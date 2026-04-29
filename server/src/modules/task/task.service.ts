import prisma from "@/core/prisma";
import type { Prisma } from "@prisma/client";
import { messageService } from "@/modules/message/message.service";
import {
  CreateProjectDtoType,
  UpdateProjectDtoType,
  ProjectPageDtoType,
  CreateTaskDtoType,
  UpdateTaskDtoType,
  TaskPageDtoType,
  CreateWorkLogDtoType,
  CreateTaskCommentDtoType,
  SubmitTestDtoType,
  QaAuditDtoType,
  PerformancePageDtoType,
} from "./task.dto";

/** 仅软件开发类任务启用测试用例与提测/验收流程 */
function taskSupportsTestCases(workDomain: string): boolean {
  return workDomain === "SOFTWARE_DEVELOPMENT";
}

// 用户基础信息 select
const userSelect = {
  id: true,
  userName: true,
  nickName: true,
  avatar: true,
  userEmail: true,
};

/** 组织成员列表（选人弹窗）额外带手机号、性别 */
const orgMemberUserSelect = {
  ...userSelect,
  userPhone: true,
  userGender: true,
};

/** 任务/工时附件对外返回字段 */
const attachmentPublic = {
  id: true,
  originalName: true,
  mimeType: true,
  size: true,
  createTime: true,
} as const;

async function assertAttachmentsOwnedByUser(
  attachmentIds: number[] | undefined,
  userId: number,
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<void> {
  if (!attachmentIds?.length) return;
  const uniq = [...new Set(attachmentIds)];
  const rows = await db.attachment.findMany({
    where: { id: { in: uniq }, deletedAt: null },
    select: { id: true, uploadedById: true },
  });
  if (rows.length !== uniq.length) {
    throw { status: 400, message: "部分附件不存在或已删除" };
  }
  for (const r of rows) {
    if (r.uploadedById !== userId) {
      throw { status: 403, message: "仅能关联本人上传的附件" };
    }
  }
}

/** 编辑任务：可保留他人已挂在本任务上的附件；新加的须为本人上传 */
async function assertAttachmentsAllowedForTaskEdit(
  attachmentIds: number[],
  taskId: number,
  userId: number,
  db: Prisma.TransactionClient | typeof prisma,
): Promise<void> {
  if (attachmentIds.length === 0) return;
  const uniq = [...new Set(attachmentIds)];
  const rows = await db.attachment.findMany({
    where: { id: { in: uniq }, deletedAt: null },
    select: { id: true, uploadedById: true },
  });
  if (rows.length !== uniq.length) {
    throw { status: 400, message: "部分附件不存在或已删除" };
  }
  const alreadyOnTask = await db.taskAttachment.findMany({
    where: { taskId, attachmentId: { in: uniq } },
    select: { attachmentId: true },
  });
  const onTask = new Set(alreadyOnTask.map((x) => x.attachmentId));
  for (const r of rows) {
    if (r.uploadedById === userId) continue;
    if (onTask.has(r.id)) continue;
    throw { status: 403, message: "无权关联该附件" };
  }
}

async function appendTaskTimeline(
  db: Prisma.TransactionClient | typeof prisma,
  params: {
    taskId: number;
    eventType: string;
    title: string;
    content?: string;
    operatorId?: number;
    fromStatus?: any;
    toStatus?: any;
    payload?: any;
  }
) {
  await db.taskTimeline.create({
    data: {
      taskId: params.taskId,
      eventType: params.eventType,
      title: params.title,
      content: params.content,
      operatorId: params.operatorId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      payload: params.payload,
    },
  });
}

// =====================================================================
// Project Service
// =====================================================================

class ProjectService {
  /**
   * 根据部门 parentId 链向上找到根部门 ID（与 organization 模块树结构一致，不依赖 ancestors 字符串格式）
   */
  private rootDeptIdFromMap(
    deptId: number,
    byId: Map<number, { id: number; parentId: number | null }>,
  ): number | null {
    const seen = new Set<number>();
    let cur: number | null = deptId;
    while (cur != null && !seen.has(cur)) {
      seen.add(cur);
      const node = byId.get(cur);
      if (!node) return null;
      if (node.parentId == null) return node.id;
      cur = node.parentId;
    }
    return null;
  }

  /** 当前用户所属部门对应的全部根组织 ID（跨多个部门时取多个根） */
  async getOrgIdsForUser(userId: number): Promise<number[]> {
    const memberships = await prisma.deptMember.findMany({
      where: { userId },
      select: { deptId: true },
    });
    if (memberships.length === 0) return [];

    const allDepts = await prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, parentId: true },
    });
    const byId = new Map(allDepts.map((d) => [d.id, d]));

    const roots = new Set<number>();
    for (const m of memberships) {
      const r = this.rootDeptIdFromMap(m.deptId, byId);
      if (r != null) roots.add(r);
    }
    return Array.from(roots);
  }

  /** 兼容旧逻辑：取主归属组织（多根时取最小 id，保证稳定） */
  async getOrgIdByUserId(userId: number): Promise<number | null> {
    const ids = await this.getOrgIdsForUser(userId);
    if (ids.length === 0) return null;
    return ids.sort((a, b) => a - b)[0]!;
  }

  /** 校验用户是否可访问指定组织下的数据 */
  async assertUserCanAccessOrg(userId: number, orgId: number | null) {
    const allowed = await this.getOrgIdsForUser(userId);
    if (allowed.length === 0) {
      throw { status: 403, message: "当前账号未关联部门，无权限操作" };
    }
    if (orgId == null) {
      throw { status: 403, message: "资源未绑定组织，无权限操作" };
    }
    if (!allowed.includes(orgId)) {
      throw { status: 403, message: "无权限访问该组织下的数据" };
    }
  }

  async assertUserCanAccessProject(userId: number, projectId: number) {
    const p = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true, orgId: true },
    });
    if (!p) throw { status: 404, message: "项目不存在" };
    await this.assertUserCanAccessOrg(userId, p.orgId);
  }

  async assertUserCanAccessTask(userId: number, taskId: number) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        orgId: true,
        project: { select: { orgId: true } },
      },
    });
    if (!task) throw { status: 404, message: "任务不存在" };
    const effectiveOrg = task.orgId ?? task.project?.orgId ?? null;
    await this.assertUserCanAccessOrg(userId, effectiveOrg);
  }

  async page(dto: ProjectPageDtoType, userId: number) {
    const orgIds = await this.getOrgIdsForUser(userId);
    if (orgIds.length === 0) {
      return { list: [], total: 0 };
    }

    const { page, pageSize, name, status } = dto;
    const where: any = {
      deletedAt: null,
      orgId: { in: orgIds },
    };
    if (name) where.name = { contains: name };
    if (status) where.status = status;

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: "desc" },
        include: {
          manager: { select: userSelect },
          _count: { select: { tasks: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);
    return { list, total };
  }

  async info(id: number, userId: number) {
    if (!id || isNaN(id)) return null;
    const orgIds = await this.getOrgIdsForUser(userId);
    if (orgIds.length === 0) return null;

    return prisma.project.findFirst({
      where: { id, deletedAt: null, orgId: { in: orgIds } },
      include: {
        manager: { select: userSelect },
        _count: { select: { tasks: true } },
      },
    });
  }

  /**
   * 获取当前用户所在组织及所有下级组织的成员（负责人候选）
   */
  async orgMembers(currentUserId: number) {
    const myMemberships = await prisma.deptMember.findMany({
      where: { userId: currentUserId },
      select: { deptId: true },
    });
    const myDeptIds = myMemberships.map((m) => m.deptId);

    // 兜底：用户不在任何部门则返回全量用户
    if (myDeptIds.length === 0) {
      return prisma.user.findMany({
        where: { deletedAt: null },
        select: orgMemberUserSelect,
        orderBy: { id: "asc" },
      });
    }

    const allDepts = await prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, ancestors: true },
    });

    const myDeptIdSet = new Set(myDeptIds.map(String));
    const relatedDeptIds = new Set<number>(myDeptIds);
    for (const dept of allDepts) {
      if (!dept.ancestors) continue;
      const ancestorIds = dept.ancestors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ancestorIds.some((aid) => myDeptIdSet.has(aid)))
        relatedDeptIds.add(dept.id);
    }

    const memberRows = await prisma.deptMember.findMany({
      where: { deptId: { in: Array.from(relatedDeptIds) } },
      select: { userId: true },
      distinct: ["userId"],
    });
    const memberUserIds = memberRows.map((r) => r.userId);
    if (!memberUserIds.includes(currentUserId))
      memberUserIds.push(currentUserId);

    return prisma.user.findMany({
      where: { id: { in: memberUserIds }, deletedAt: null },
      select: orgMemberUserSelect,
      orderBy: { id: "asc" },
    });
  }

  async create(dto: CreateProjectDtoType, userId: number) {
    // orgId 未传时从当前用户部门推导；若显式传入则必须在用户可访问的根组织内
    let orgId = dto.orgId;
    const allowed = await this.getOrgIdsForUser(userId);
    if (orgId != null) {
      if (allowed.length === 0 || !allowed.includes(orgId)) {
        throw { status: 403, message: "无权在该组织下创建项目" };
      }
    } else {
      orgId = (await this.getOrgIdByUserId(userId)) ?? undefined;
    }

    const orgIdVal = orgId ?? undefined;
    const created = await prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        managerId: dto.managerId,
        orgId: orgIdVal as any,
        status: dto.status ?? "ACTIVE",
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });

    // ===== 站内消息推送：创建项目（只推给项目负责人）=====
    try {
      if (dto.managerId && dto.managerId !== userId) {
        await messageService.sendRealTimeMessage(
          {
            receiverId: dto.managerId,
            messageType: "TASK",
            title: "你被指定为项目负责人",
            content: `项目「${created.name}」已创建，你是负责人。`,
            extra: { biz: "project", action: "created", projectId: created.id },
          },
          userId,
        );
      }
    } catch {}

    return created;
  }

  async update(id: number, dto: UpdateProjectDtoType, userId: number) {
    await this.assertUserCanAccessProject(userId, id);

    const { version, orgId, startDate, endDate, ...rest } = dto;

    const before = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, managerId: true },
    });

    if (orgId != null) {
      const allowed = await this.getOrgIdsForUser(userId);
      if (!allowed.includes(orgId)) {
        throw { status: 403, message: "无权将项目归属到该组织" };
      }
    }

    // 👉 使用 updateMany 实现基于版本号的乐观锁
    const updateData: any = { ...rest };
    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }
    // orgId 只在显式传入时更新，不传则保持原值
    if (orgId !== undefined) {
      updateData.orgId = orgId;
    }

    const result = await prisma.project.updateMany({
      where: { id, version },
      data: { ...updateData, version: { increment: 1 } },
    });

    if (result.count === 0) {
      throw {
        status: 409,
        message: "当前项目数据已被其他人修改，请刷新页面获取最新数据后重试",
      };
    }

    const updated = await prisma.project.findUnique({ where: { id } });

    // ===== 站内消息推送：项目负责人变更（只推给新负责人；不推给被替换的人）=====
    try {
      const nextManagerId = dto.managerId;
      const prevManagerId = before?.managerId;
      if (
        nextManagerId !== undefined &&
        nextManagerId != null &&
        nextManagerId !== prevManagerId &&
        nextManagerId !== userId
      ) {
        await messageService.sendRealTimeMessage(
          {
            receiverId: nextManagerId,
            messageType: "TASK",
            title: "项目负责人变更",
            content: `你已成为项目「${before?.name ?? updated?.name ?? ""}」的新负责人。`,
            extra: { biz: "project", action: "managerChanged", projectId: id },
          },
          userId,
        );
      }
    } catch {}

    return updated;
  }
  async delete(id: number, userId: number) {
    await this.assertUserCanAccessProject(userId, id);
    return prisma.project.delete({ where: { id } });
  }

  async list(userId: number) {
    const orgIds = await this.getOrgIdsForUser(userId);
    if (orgIds.length === 0) return [];

    return prisma.project.findMany({
      where: { status: "ACTIVE", deletedAt: null, orgId: { in: orgIds } },
      orderBy: { id: "desc" },
      select: { id: true, name: true, status: true, managerId: true },
    });
  }
}

export const projectService = new ProjectService();

// =====================================================================
// Task Service
// =====================================================================

class TaskService {
  async page(dto: TaskPageDtoType, userId: number) {
    const orgIds = await projectService.getOrgIdsForUser(userId);
    if (orgIds.length === 0) {
      return { list: [], total: 0 };
    }

    const { page, pageSize, projectId, status, mainAssigneeId, keyword } = dto;
    const where: any = {
      OR: [
        { orgId: { in: orgIds } },
        {
          AND: [
            { orgId: null },
            {
              project: {
                orgId: { in: orgIds },
                deletedAt: null,
              },
            },
          ],
        },
      ],
    };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (mainAssigneeId) where.mainAssigneeId = mainAssigneeId;
    if (keyword) where.title = { contains: keyword };

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: "desc" },
        include: {
          project: { select: { id: true, name: true, managerId: true } },
          manager: { select: userSelect },
          mainAssignee: { select: userSelect },
          tester: { select: userSelect },
          coAssignees: {
            include: { user: { select: userSelect } },
          },
          _count: { select: { testCases: true, workLogs: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);
    return { list, total };
  }

  async info(id: number, userId: number) {
    try {
      await projectService.assertUserCanAccessTask(userId, id);
    } catch (e: any) {
      if (e.status === 404 || e.status === 403) return null;
      throw e;
    }

    return prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, managerId: true } },
        manager: { select: userSelect },
        mainAssignee: { select: userSelect },
        tester: { select: userSelect },
        coAssignees: {
          include: { user: { select: userSelect } },
        },
        testCases: {
          orderBy: { id: "asc" },
        },
        workLogs: {
          include: {
            user: { select: userSelect },
            attachments: {
              where: { attachment: { deletedAt: null } },
              orderBy: { sort: "asc" },
              include: { attachment: { select: attachmentPublic } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            user: { select: userSelect },
            attachments: {
              where: { attachment: { deletedAt: null } },
              orderBy: { sort: "asc" },
              include: { attachment: { select: attachmentPublic } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        timelines: {
          include: {
            operator: { select: userSelect },
          },
          orderBy: { createdAt: "desc" },
        },
        attachments: {
          where: { attachment: { deletedAt: null } },
          orderBy: { sort: "asc" },
          include: { attachment: { select: attachmentPublic } },
        },
      },
    });
  }

  // 使用事务原子性创建任务（含协助人 + 测试用例）
  async create(dto: CreateTaskDtoType, userId: number) {
    await projectService.assertUserCanAccessProject(userId, dto.projectId);

    const proj = await prisma.project.findFirst({
      where: { id: dto.projectId, deletedAt: null },
      select: { orgId: true, name: true },
    });
    if (!proj?.orgId) {
      throw { status: 400, message: "项目未绑定组织，无法创建任务" };
    }

    const { coAssigneeIds = [], testCases = [], attachmentIds, ...taskData } = dto;
    await assertAttachmentsOwnedByUser(attachmentIds, userId);
    if (taskData.orgId != null && taskData.orgId !== proj.orgId) {
      throw { status: 400, message: "任务组织必须与所属项目一致" };
    }
    const mergedOrgId = proj.orgId;

    const createdTask = await prisma.$transaction(async (tx) => {
      // Prisma MySQL 驱动不接受 undefined，必须显式控制每个字段
      const createData: any = {
        title: taskData.title,
        status: "PENDING",
      };
      if (taskData.projectId !== undefined) createData.projectId = taskData.projectId;
      if (taskData.mainAssigneeId !== undefined) createData.mainAssigneeId = taskData.mainAssigneeId;
      if (taskData.testerId !== undefined) createData.testerId = taskData.testerId;
      if (taskData.estimatedHours !== undefined) createData.estimatedHours = taskData.estimatedHours;
      if (mergedOrgId !== undefined) createData.orgId = mergedOrgId;
      if (taskData.parentId !== undefined) createData.parentId = taskData.parentId;
      if (taskData.workDomain !== undefined) createData.workDomain = taskData.workDomain;
      if (taskData.type !== undefined) createData.type = taskData.type;
      if (taskData.priority !== undefined) createData.priority = taskData.priority;
      if (taskData.dueDate != null) createData.dueDate = new Date(taskData.dueDate);
      if (taskData.description !== undefined) createData.description = taskData.description;

      const task = await tx.task.create({ data: createData });

      // 2. 批量写入协助人中间表（userId 过滤 null，避免 MySQL driver 报错）
      const validCoAssignees = coAssigneeIds.filter((uid) => uid != null);
      if (validCoAssignees.length > 0) {
        await tx.taskCoAssignee.createMany({
          data: validCoAssignees.map((userId) => ({ taskId: task.id, userId })),
          skipDuplicates: true,
        });
      }

      // 3. 批量创建测试用例（仅软件开发；其它领域忽略入参）
      const validTestCases = testCases.filter(
        (tc) => tc.description != null && tc.expectedResult != null,
      );
      if (
        taskSupportsTestCases(taskData.workDomain ?? "GENERAL") &&
        validTestCases.length > 0
      ) {
        await tx.testCase.createMany({
          data: validTestCases.map((tc) => ({
            taskId: task.id,
            description: tc.description,
            expectedResult: tc.expectedResult,
          })),
        });
      }

      if (attachmentIds?.length) {
        await tx.taskAttachment.createMany({
          data: attachmentIds.map((aid, i) => ({
            taskId: task.id,
            attachmentId: aid,
            sort: i,
          })),
        });
      }

      await appendTaskTimeline(tx, {
        taskId: task.id,
        eventType: "TASK_CREATED",
        title: "创建任务",
        content: `任务已创建${taskData.mainAssigneeId ? "并指定负责人" : ""}`,
        operatorId: userId,
        toStatus: "PENDING",
      });

      return tx.task.findUnique({
        where: { id: task.id },
        include: {
          mainAssignee: { select: userSelect },
          coAssignees: { include: { user: { select: userSelect } } },
          testCases: true,
          attachments: {
            orderBy: { sort: "asc" },
            include: { attachment: { select: attachmentPublic } },
          },
        },
      });
    });

    /**
     * 站内消息推送（创建任务）：
     * - 仅推给相关执行人：主负责人/协助人/验收人
     * - 去重 + 排除创建人，避免自我通知
     * - 写库成功后再推送，不影响事务一致性
     */
    try {
      const receiverIds = new Set<number>();
      const mainId = (createdTask as any)?.mainAssigneeId as number | null | undefined;
      const testerId = (createdTask as any)?.testerId as number | null | undefined;
      const coIds = ((createdTask as any)?.coAssignees ?? []).map((x: any) => x.userId as number);

      if (mainId) receiverIds.add(mainId);
      if (testerId) receiverIds.add(testerId);
      for (const cid of coIds) {
        if (cid) receiverIds.add(cid);
      }
      receiverIds.delete(userId);

      const projectName = proj.name;
      const taskTitle = (createdTask as any)?.title ?? dto.title;

      await Promise.allSettled(
        Array.from(receiverIds).map((receiverId) =>
          messageService.sendRealTimeMessage(
            {
              receiverId,
              messageType: "TASK",
              title: "你有一个新任务",
              content: `任务「${taskTitle}」已创建并分配给你（项目：${projectName}）。`,
              extra: {
                biz: "task",
                action: "created",
                taskId: (createdTask as any)?.id,
                projectId: dto.projectId,
              },
            },
            userId,
          ),
        ),
      );
    } catch {}

    return createdTask;
  }

  // 更新任务（含协助人重置）
  async update(id: number, dto: UpdateTaskDtoType, userId: number) {
    await projectService.assertUserCanAccessTask(userId, id);

    const { version, coAssigneeIds, attachmentIds, testCases, ...taskData } = dto;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const existing = await tx.task.findFirst({
        where: { id, version },
        select: {
          id: true,
          title: true,
          projectId: true,
          workDomain: true,
          mainAssigneeId: true,
          testerId: true,
          coAssignees: { select: { userId: true } },
          project: { select: { name: true } },
        },
      });
      if (!existing) {
        throw {
          status: 409,
          message: "当前任务状态或信息已被他人修改，请刷新后重试",
        };
      }

      const nextWorkDomain =
        taskData.workDomain !== undefined
          ? taskData.workDomain
          : existing.workDomain;

      if (
        testCases !== undefined &&
        !taskSupportsTestCases(nextWorkDomain) &&
        testCases.length > 0
      ) {
        throw {
          status: 400,
          message: "仅软件开发类任务可维护测试用例",
        };
      }

      const updateResult = await tx.task.updateMany({
        where: {
          id,
          version: version,
        },
        data: {
          ...(taskData.parentId !== undefined && {
            parentId: taskData.parentId,
          }),
          ...(taskData.workDomain !== undefined && {
            workDomain: taskData.workDomain,
          }),
          ...(taskData.type !== undefined && { type: taskData.type }),
          ...(taskData.priority !== undefined && {
            priority: taskData.priority,
          }),
          ...(taskData.dueDate !== undefined && {
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          }),
          ...(taskData.title !== undefined && { title: taskData.title }),
          ...(taskData.description !== undefined && {
            description: taskData.description,
          }),
          ...(taskData.mainAssigneeId !== undefined && {
            mainAssigneeId: taskData.mainAssigneeId,
          }),
          ...(taskData.testerId !== undefined && {
            testerId: taskData.testerId,
          }),
          ...(taskData.estimatedHours !== undefined && {
            estimatedHours: taskData.estimatedHours,
          }),
          ...(taskData.status !== undefined && { status: taskData.status }),
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw {
          status: 409,
          message: "当前任务状态或信息已被他人修改，请刷新后重试",
        };
      }

      // ===== 计算“新执行人集合”（用于推送新增/变更，不推送被移除）=====
      const prevMainAssigneeId = existing.mainAssigneeId ?? null;
      const prevTesterId = existing.testerId ?? null;
      const prevCoIds = new Set<number>((existing.coAssignees ?? []).map((x) => x.userId));

      const nextMainAssigneeId =
        taskData.mainAssigneeId !== undefined ? taskData.mainAssigneeId ?? null : prevMainAssigneeId;
      const nextTesterId =
        taskData.testerId !== undefined ? taskData.testerId ?? null : prevTesterId;
      const nextCoIds =
        coAssigneeIds !== undefined ? new Set<number>(coAssigneeIds) : prevCoIds;

      const notifyUserIds = new Set<number>();

      // 主负责人变更：只通知“新主负责人”
      if (prevMainAssigneeId !== nextMainAssigneeId && nextMainAssigneeId) {
        notifyUserIds.add(nextMainAssigneeId);
      }
      // 验收人变更：只通知“新验收人”
      if (prevTesterId !== nextTesterId && nextTesterId) {
        notifyUserIds.add(nextTesterId);
      }
      // 协助人变更：只通知“新增协助人”
      if (coAssigneeIds !== undefined) {
        for (const cid of nextCoIds) {
          if (!prevCoIds.has(cid)) notifyUserIds.add(cid);
        }
      }
      notifyUserIds.delete(userId);

      // 重置协助人列表
      if (coAssigneeIds !== undefined) {
        await tx.taskCoAssignee.deleteMany({ where: { taskId: id } });
        if (coAssigneeIds.length > 0) {
          await tx.taskCoAssignee.createMany({
            data: coAssigneeIds.map((userId) => ({ taskId: id, userId })),
            skipDuplicates: true,
          });
        }
      }

      if (attachmentIds !== undefined) {
        await assertAttachmentsAllowedForTaskEdit(attachmentIds, id, userId, tx);
        await tx.taskAttachment.deleteMany({ where: { taskId: id } });
        if (attachmentIds.length > 0) {
          await tx.taskAttachment.createMany({
            data: attachmentIds.map((aid, i) => ({
              taskId: id,
              attachmentId: aid,
              sort: i,
            })),
          });
        }
      }

      // 测试用例：仅软件开发可维护；否则清空（非空入参已在上方拒绝）
      if (testCases !== undefined) {
        if (taskSupportsTestCases(nextWorkDomain)) {
          const normalized = testCases.map((tc) => ({
            id: tc.id,
            description: tc.description.trim(),
            expectedResult: tc.expectedResult.trim(),
          }));
          for (const tc of normalized) {
            if (!tc.description || !tc.expectedResult) {
              throw {
                status: 400,
                message: "测试用例描述与预期结果不能为空",
              };
            }
          }

          if (normalized.length === 0) {
            await tx.testCase.deleteMany({ where: { taskId: id } });
          } else {
            const keptIds = normalized
              .map((tc) => tc.id)
              .filter((x): x is number => x != null);
            await tx.testCase.deleteMany({
              where: {
                taskId: id,
                ...(keptIds.length > 0 ? { id: { notIn: keptIds } } : {}),
              },
            });
            for (const tc of normalized) {
              if (tc.id != null) {
                const row = await tx.testCase.findFirst({
                  where: { id: tc.id, taskId: id },
                });
                if (!row) {
                  throw {
                    status: 400,
                    message: "测试用例不存在或不属于该任务",
                  };
                }
                await tx.testCase.update({
                  where: { id: tc.id },
                  data: {
                    description: tc.description,
                    expectedResult: tc.expectedResult,
                  },
                });
              } else {
                await tx.testCase.create({
                  data: {
                    taskId: id,
                    description: tc.description,
                    expectedResult: tc.expectedResult,
                  },
                });
              }
            }
          }
        } else {
          await tx.testCase.deleteMany({ where: { taskId: id } });
        }
      } else if (!taskSupportsTestCases(nextWorkDomain)) {
        await tx.testCase.deleteMany({ where: { taskId: id } });
      }

      return tx.task.findUnique({
        where: { id },
        include: {
          testCases: {
            orderBy: { id: "asc" },
          },
          attachments: {
            where: { attachment: { deletedAt: null } },
            orderBy: { sort: "asc" },
            include: { attachment: { select: attachmentPublic } },
          },
        },
      });
    });

    /**
     * 站内消息推送（更新指派）：
     * - 推送给所有任务相关人员：主负责人/协助人/验收人（不推送被移除的人；排除操作者）
     * - 为了避免影响主流程，推送失败不抛错
     */
    try {
      // 重新查询一次“变更后”的关键字段，确保推送内容准确
      const latest = await prisma.task.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          projectId: true,
          mainAssigneeId: true,
          testerId: true,
          coAssignees: { select: { userId: true } },
          project: { select: { name: true } },
        },
      });
      if (latest) {
        const receiverIds = new Set<number>();

        // 只要本次更新触及“执行相关字段”，就通知所有当前相关人员
        const shouldNotify =
          taskData.mainAssigneeId !== undefined ||
          taskData.testerId !== undefined ||
          coAssigneeIds !== undefined;
        if (!shouldNotify) return updatedTask;

        if (latest.mainAssigneeId) receiverIds.add(latest.mainAssigneeId);
        if (latest.testerId) receiverIds.add(latest.testerId);
        for (const ca of latest.coAssignees ?? []) receiverIds.add(ca.userId);

        receiverIds.delete(userId);

        const projectName = latest.project?.name ?? "";
        const taskTitle = latest.title ?? "";

        await Promise.allSettled(
          Array.from(receiverIds).map((receiverId) =>
            messageService.sendRealTimeMessage(
              {
                receiverId,
                messageType: "TASK",
                title: "任务指派已更新",
                content: projectName
                  ? `任务「${taskTitle}」的执行信息已更新（项目：${projectName}）。`
                  : `任务「${taskTitle}」的执行信息已更新。`,
                extra: {
                  biz: "task",
                  action: "assigneeUpdated",
                  taskId: latest.id,
                  projectId: latest.projectId,
                },
              },
              userId,
            ),
          ),
        );
      }
    } catch {}

    return updatedTask;
  }

  async delete(id: number, userId: number) {
    await projectService.assertUserCanAccessTask(userId, id);
    return prisma.task.delete({ where: { id } });
  }

  // 开始开发（主负责人或协助人将 PENDING → IN_PROGRESS）
  async startWork(taskId: number, userId: number) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { coAssignees: true },
    });
    if (!task) throw { status: 404, message: "任务不存在" };

    const isMainAssignee = task.mainAssigneeId === userId;
    const isCoAssignee = task.coAssignees.some((ca) => ca.userId === userId);
    if (!isMainAssignee && !isCoAssignee) {
      throw { status: 403, message: "无权限：仅任务负责人可开始开发" };
    }
    if (task.status !== "PENDING") {
      throw { status: 400, message: `当前状态（${task.status}）无法开始开发` };
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" },
    });
    await appendTaskTimeline(prisma, {
      taskId,
      eventType: "STATUS_CHANGED",
      title: "开始开发",
      operatorId: userId,
      fromStatus: task.status,
      toStatus: "IN_PROGRESS",
    });
    return updated;
  }

  // 填写工时（主负责人或协助人均可）
  async addWorkLog(taskId: number, userId: number, dto: CreateWorkLogDtoType) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { coAssignees: true },
    });
    if (!task) throw { status: 404, message: "任务不存在" };

    const isMainAssignee = task.mainAssigneeId === userId;
    const isCoAssignee = task.coAssignees.some((ca) => ca.userId === userId);
    if (!isMainAssignee && !isCoAssignee) {
      throw { status: 403, message: "无权限：仅任务负责人可填写工时" };
    }

    await assertAttachmentsOwnedByUser(dto.attachmentIds, userId);

    return prisma.$transaction(async (tx) => {
      const log = await tx.workLog.create({
        data: { taskId, userId, hours: dto.hours, content: dto.content },
      });
      if (dto.attachmentIds?.length) {
        await tx.workLogAttachment.createMany({
          data: dto.attachmentIds.map((attachmentId, i) => ({
            workLogId: log.id,
            attachmentId,
            sort: i,
          })),
        });
      }
      const ret = await tx.workLog.findUnique({
        where: { id: log.id },
        include: {
          user: { select: userSelect },
          attachments: {
            orderBy: { sort: "asc" },
            include: { attachment: { select: attachmentPublic } },
          },
        },
      });
      await appendTaskTimeline(tx, {
        taskId,
        eventType: "WORKLOG_ADDED",
        title: "登记工时",
        content: `${dto.hours}h · ${dto.content.slice(0, 80)}`,
        operatorId: userId,
      });
      return ret;
    });
  }

  async addComment(taskId: number, userId: number, dto: CreateTaskCommentDtoType) {
    await projectService.assertUserCanAccessTask(userId, taskId);
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw { status: 404, message: "任务不存在" };

    await assertAttachmentsOwnedByUser(dto.attachmentIds, userId);

    return prisma.$transaction(async (tx) => {
      const comment = await tx.taskComment.create({
        data: { taskId, userId, content: dto.content },
      });
      if (dto.attachmentIds?.length) {
        await tx.taskCommentAttachment.createMany({
          data: dto.attachmentIds.map((attachmentId, i) => ({
            commentId: comment.id,
            attachmentId,
            sort: i,
          })),
        });
      }
      await appendTaskTimeline(tx, {
        taskId,
        eventType: "COMMENT_ADDED",
        title: "发表评论",
        content: dto.content.slice(0, 120),
        operatorId: userId,
      });
      return tx.taskComment.findUnique({
        where: { id: comment.id },
        include: {
          user: { select: userSelect },
          attachments: {
            where: { attachment: { deletedAt: null } },
            orderBy: { sort: "asc" },
            include: { attachment: { select: attachmentPublic } },
          },
        },
      });
    });
  }

  // 提交验收（仅主负责人；软件开发任务额外校验测试用例）
  async submitTest(taskId: number, userId: number, dto: SubmitTestDtoType) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        testCases: true,
        project: { select: { name: true } },
      },
    });
    if (!task) throw { status: 404, message: "任务不存在" };

    // 严格权限校验：仅主负责人
    if (task.mainAssigneeId !== userId) {
      throw { status: 403, message: "仅主要负责人才可提交验收" };
    }

    if (task.status !== "IN_PROGRESS") {
      throw { status: 400, message: `当前状态（${task.status}）不可提交验收` };
    }

    if (taskSupportsTestCases(task.workDomain)) {
      if (!task.testCases.length) {
        throw { status: 400, message: "请先添加测试用例" };
      }
      if (dto.testCaseResults.length !== task.testCases.length) {
        throw { status: 400, message: "请完整提交全部测试用例的自测结果" };
      }
      const allPassed = dto.testCaseResults.every(
        (r) => r.selfTestStatus === "PASSED"
      );
      if (!allPassed) {
        throw {
          status: 400,
          message: "所有测试用例必须全部自测通过才能提交验收",
        };
      }
    }

    return prisma.$transaction(async (tx) => {
      // 软件开发任务才更新测试用例自测状态
      if (taskSupportsTestCases(task.workDomain)) {
        for (const r of dto.testCaseResults) {
          await tx.testCase.update({
            where: { id: r.id },
            data: {
              selfTestStatus: r.selfTestStatus,
              selfTestRemark: r.selfTestRemark,
            },
          });
        }
      }
      // 将任务状态推进到 QA_REVIEW
      const updated = await tx.task.update({
        where: { id: taskId },
        data: { status: "QA_REVIEW", qaRejectReason: null } as any,
      });
      await appendTaskTimeline(tx, {
        taskId,
        eventType: "STATUS_CHANGED",
        title: "提交验收",
        operatorId: userId,
        fromStatus: task.status,
        toStatus: "QA_REVIEW",
      });

      // ===== 站内消息推送：任务提测（推给主负责人/协助人/验收人）=====
      try {
        const receiverIds = new Set<number>();
        if (task.mainAssigneeId) receiverIds.add(task.mainAssigneeId);
        if (task.testerId) receiverIds.add(task.testerId);
        const coRows = await tx.taskCoAssignee.findMany({
          where: { taskId },
          select: { userId: true },
        });
        for (const r of coRows) receiverIds.add(r.userId);
        receiverIds.delete(userId);

        await Promise.allSettled(
          Array.from(receiverIds).map((receiverId) =>
            messageService.sendRealTimeMessage(
              {
                receiverId,
                messageType: "TASK",
                title: "任务已提测",
                content: `任务「${task.title}」已提交验收（项目：${task.project?.name ?? ""}）。`,
                extra: {
                  biz: "task",
                  action: "submittedForQa",
                  taskId,
                  projectId: task.projectId,
                },
              },
              userId,
            ),
          ),
        );
      } catch {}

      return updated;
    });
  }

  // QA 验收审核（软件开发任务会落测试用例结果，其他任务走简化验收）
  async qaAudit(taskId: number, userId: number, dto: QaAuditDtoType) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        testCases: true,
        coAssignees: true,
        project: { select: { name: true } },
      },
    });
    if (!task) throw { status: 404, message: "任务不存在" };

    // 权限校验：仅测试验收人
    if (task.testerId !== userId) {
      throw { status: 403, message: "无权限：仅测试验收人可进行 QA 审核" };
    }

    if (task.status !== "QA_REVIEW") {
      throw { status: 400, message: "任务当前不在验收中状态" };
    }

    const supportsTestCases = taskSupportsTestCases(task.workDomain);

    if (supportsTestCases) {
      if (!task.testCases.length) {
        throw { status: 400, message: "暂无用例可验收" };
      }
      if (dto.testCaseResults.length !== task.testCases.length) {
        throw { status: 400, message: "请完整提交全部测试用例的验收结果" };
      }
    } else if (!dto.decision) {
      throw { status: 400, message: "请明确本次验收结果（通过或打回）" };
    }

    const hasFailure = supportsTestCases
      ? dto.testCaseResults.some((r) => r.qaStatus === "FAILED")
      : dto.decision === "reject";

    return prisma.$transaction(async (tx) => {
      if (supportsTestCases) {
        for (const r of dto.testCaseResults) {
          await tx.testCase.update({
            where: { id: r.id },
            data: {
              qaStatus: r.qaStatus,
              qaRemark: r.qaRemark,
              ...(r.qaStatus === "FAILED" && { bugCount: { increment: 1 } }),
            },
          });
        }
      }

      if (hasFailure) {
        const rejectReason = dto.qaRejectReason?.trim();
        if (!rejectReason) {
          throw { status: 400, message: "请填写打回原因" };
        }
        // 打回后直接回到提交验收前状态（开发中）
        const updated = await tx.task.update({
          where: { id: taskId },
          data: { status: "IN_PROGRESS", qaRejectReason: rejectReason } as any,
        });
        await appendTaskTimeline(tx, {
          taskId,
          eventType: "QA_REJECTED",
          title: "验收打回",
          content: rejectReason,
          operatorId: userId,
          fromStatus: "QA_REVIEW",
          toStatus: "IN_PROGRESS",
        });

        // ===== 站内消息推送：QA 打回（推给主负责人/协助人/验收人）=====
        try {
          const receiverIds = new Set<number>();
          if (task.mainAssigneeId) receiverIds.add(task.mainAssigneeId);
          if (task.testerId) receiverIds.add(task.testerId);
          for (const ca of task.coAssignees ?? []) receiverIds.add(ca.userId);
          receiverIds.delete(userId);

          await Promise.allSettled(
            Array.from(receiverIds).map((receiverId) =>
              messageService.sendRealTimeMessage(
                {
                  receiverId,
                  messageType: "TASK",
                  title: "任务被打回",
                  content: `任务「${task.title}」QA 验收未通过，已打回（项目：${task.project?.name ?? ""}）。`,
                  extra: {
                    biz: "task",
                    action: "qaRejected",
                    taskId,
                    projectId: task.projectId,
                  },
                },
                userId,
              ),
            ),
          );
        } catch {}

        return updated;
      } else {
        // 全部通过 → 完成，必须填写实际工时
        if (!dto.actualHours) {
          throw { status: 400, message: "验收通过时必须填写实际工时" };
        }
        const updated = await tx.task.update({
          where: { id: taskId },
          data: {
            status: "COMPLETED",
            actualHours: dto.actualHours,
            qaRejectReason: null,
          } as any,
        });
        await appendTaskTimeline(tx, {
          taskId,
          eventType: "QA_PASSED",
          title: "验收通过",
          content: `确认实际工时 ${dto.actualHours}h`,
          operatorId: userId,
          fromStatus: "QA_REVIEW",
          toStatus: "COMPLETED",
        });

        // ===== 站内消息推送：QA 通过（推给主负责人/协助人/验收人）=====
        try {
          const receiverIds = new Set<number>();
          if (task.mainAssigneeId) receiverIds.add(task.mainAssigneeId);
          if (task.testerId) receiverIds.add(task.testerId);
          for (const ca of task.coAssignees ?? []) receiverIds.add(ca.userId);
          receiverIds.delete(userId);

          await Promise.allSettled(
            Array.from(receiverIds).map((receiverId) =>
              messageService.sendRealTimeMessage(
                {
                  receiverId,
                  messageType: "TASK",
                  title: "任务验收通过",
                  content: `任务「${task.title}」已验收通过并完成（项目：${task.project?.name ?? ""}）。`,
                  extra: {
                    biz: "task",
                    action: "qaPassed",
                    taskId,
                    projectId: task.projectId,
                  },
                },
                userId,
              ),
            ),
          );
        } catch {}

        return updated;
      }
    });
  }

  // ==================== 以下为新增的状态流转(逆向)业务 ====================

  // 暂停任务 (IN_PROGRESS -> PAUSED)
  async pauseTask(taskId: number, userId: number) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { coAssignees: true, project: { select: { managerId: true } } },
    });
    if (!task) throw { status: 404, message: "任务不存在" };

    const isMainAssignee = task.mainAssigneeId === userId;
    const isCoAssignee = task.coAssignees.some((ca) => ca.userId === userId);
    const isProjectManager = task.project?.managerId === userId;
    if (!isMainAssignee && !isCoAssignee && !isProjectManager) {
      throw { status: 403, message: "无权限：仅任务负责人或项目负责人可暂停任务" };
    }

    if (task.status !== "IN_PROGRESS") {
      throw { status: 400, message: `当前状态（${task.status}）无法暂停` };
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: "PAUSED", version: { increment: 1 } },
    });
    await appendTaskTimeline(prisma, {
      taskId,
      eventType: "STATUS_CHANGED",
      title: "暂停任务",
      operatorId: userId,
      fromStatus: "IN_PROGRESS",
      toStatus: "PAUSED",
    });

    // ===== 站内消息推送：暂停（推给主负责人/协助人/验收人；排除操作者）=====
    try {
      const receiverIds = new Set<number>();
      if (task.mainAssigneeId) receiverIds.add(task.mainAssigneeId);
      if (task.testerId) receiverIds.add(task.testerId);
      for (const ca of task.coAssignees ?? []) receiverIds.add(ca.userId);
      receiverIds.delete(userId);

      await Promise.allSettled(
        Array.from(receiverIds).map((receiverId) =>
          messageService.sendRealTimeMessage(
            {
              receiverId,
              messageType: "TASK",
              title: "任务已暂停",
              content: `任务「${task.title}」已被暂停。`,
              extra: { biz: "task", action: "paused", taskId, projectId: task.projectId },
            },
            userId,
          ),
        ),
      );
    } catch {}

    return updated;
  }

  // 恢复开发 (PAUSED -> IN_PROGRESS)
  async resumeTask(taskId: number, userId: number) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { coAssignees: true },
    });
    if (!task) throw { status: 404, message: "任务不存在" };

    const isMainAssignee = task.mainAssigneeId === userId;
    const isCoAssignee = task.coAssignees.some((ca) => ca.userId === userId);
    if (!isMainAssignee && !isCoAssignee) {
      throw { status: 403, message: "无权限：仅任务负责人可恢复开发" };
    }

    if (task.status !== "PAUSED") {
      throw { status: 400, message: `当前状态不是暂停中，无法恢复` };
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS", version: { increment: 1 } },
    });
    await appendTaskTimeline(prisma, {
      taskId,
      eventType: "STATUS_CHANGED",
      title: "恢复开发",
      operatorId: userId,
      fromStatus: "PAUSED",
      toStatus: "IN_PROGRESS",
    });

    // ===== 站内消息推送：恢复开发（推给主负责人/协助人/验收人；排除操作者）=====
    try {
      const receiverIds = new Set<number>();
      if (task.mainAssigneeId) receiverIds.add(task.mainAssigneeId);
      if (task.testerId) receiverIds.add(task.testerId);
      for (const ca of task.coAssignees ?? []) receiverIds.add(ca.userId);
      receiverIds.delete(userId);

      await Promise.allSettled(
        Array.from(receiverIds).map((receiverId) =>
          messageService.sendRealTimeMessage(
            {
              receiverId,
              messageType: "TASK",
              title: "任务已恢复开发",
              content: `任务「${task.title}」已恢复开发。`,
              extra: { biz: "task", action: "resumed", taskId, projectId: task.projectId },
            },
            userId,
          ),
        ),
      );
    } catch {}

    return updated;
  }

}

export const taskService = new TaskService();

// =====================================================================
// Performance Service
// =====================================================================

class PerformanceService {
  async stats(dto: PerformancePageDtoType, userId: number) {
    const orgIds = await projectService.getOrgIdsForUser(userId);
    if (orgIds.length === 0) {
      return { list: [], total: 0 };
    }

    const { page, pageSize, projectId } = dto;
    const where: any = {
      status: "COMPLETED",
      OR: [
        { orgId: { in: orgIds } },
        {
          AND: [
            { orgId: null },
            {
              project: {
                orgId: { in: orgIds },
                deletedAt: null,
              },
            },
          ],
        },
      ],
    };
    if (projectId) where.projectId = projectId;

    const completedTasks = await prisma.task.findMany({
      where,
      include: {
        mainAssignee: {
          select: {
            id: true,
            userName: true,
            nickName: true,
            avatar: true,
            userEmail: true,
          },
        },
        testCases: true,
      },
    });

    // 按主负责人聚合
    const map = new Map<
      number,
      {
        user: any;
        totalTasks: number;
        totalActualHours: number;
        totalEstimatedHours: number;
        totalBugCount: number;
        firstPassCount: number;
      }
    >();

    for (const task of completedTasks) {
      if (!task.mainAssigneeId || !task.mainAssignee) continue;
      const uid = task.mainAssigneeId;
      if (!map.has(uid)) {
        map.set(uid, {
          user: task.mainAssignee,
          totalTasks: 0,
          totalActualHours: 0,
          totalEstimatedHours: 0,
          totalBugCount: 0,
          firstPassCount: 0,
        });
      }
      const stat = map.get(uid)!;
      stat.totalTasks += 1;
      stat.totalActualHours += task.actualHours ?? 0;
      stat.totalEstimatedHours += task.estimatedHours ?? 0;

      const bugCount = task.testCases.reduce((sum, tc) => sum + tc.bugCount, 0);
      stat.totalBugCount += bugCount;
      if (bugCount === 0) stat.firstPassCount += 1;
    }

    const allStats = Array.from(map.values()).map((s) => ({
      ...s,
      firstPassRate:
        s.totalTasks > 0
          ? Math.round((s.firstPassCount / s.totalTasks) * 100)
          : 0,
    }));

    const total = allStats.length;
    const skip = (page - 1) * pageSize;
    const list = allStats.slice(skip, skip + pageSize);
    return { list, total };
  }
}

export const performanceService = new PerformanceService();
