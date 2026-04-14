import prisma from "@/core/prisma";
import type { Prisma } from "@prisma/client";
import {
  CreateProjectDtoType,
  UpdateProjectDtoType,
  ProjectPageDtoType,
  CreateTaskDtoType,
  UpdateTaskDtoType,
  TaskPageDtoType,
  CreateWorkLogDtoType,
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
    return prisma.project.create({
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
  }

  async update(id: number, dto: UpdateProjectDtoType, userId: number) {
    await this.assertUserCanAccessProject(userId, id);

    const { version, orgId, startDate, endDate, ...rest } = dto;

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

    return prisma.project.findUnique({ where: { id } });
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
      select: { orgId: true },
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

    return prisma.$transaction(async (tx) => {
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
  }

  // 更新任务（含协助人重置）
  async update(id: number, dto: UpdateTaskDtoType, userId: number) {
    await projectService.assertUserCanAccessTask(userId, id);

    const { version, coAssigneeIds, attachmentIds, testCases, ...taskData } = dto;

    return prisma.$transaction(async (tx) => {
      const existing = await tx.task.findFirst({
        where: { id, version },
        select: { workDomain: true },
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
    if (task.status !== "PENDING" && task.status !== "REJECTED") {
      throw { status: 400, message: `当前状态（${task.status}）无法开始开发` };
    }

    return prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" },
    });
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
      return tx.workLog.findUnique({
        where: { id: log.id },
        include: {
          user: { select: userSelect },
          attachments: {
            orderBy: { sort: "asc" },
            include: { attachment: { select: attachmentPublic } },
          },
        },
      });
    });
  }

  // 提交测试验收（仅主负责人）
  async submitTest(taskId: number, userId: number, dto: SubmitTestDtoType) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { testCases: true },
    });
    if (!task) throw { status: 404, message: "任务不存在" };

    if (!taskSupportsTestCases(task.workDomain)) {
      throw {
        status: 400,
        message: "仅软件开发类任务支持提测与测试用例验收流程",
      };
    }

    // 严格权限校验：仅主负责人
    if (task.mainAssigneeId !== userId) {
      throw { status: 403, message: "仅主要负责人才可提交验收" };
    }

    // 校验所有用例必须全部自测通过
    const allPassed = dto.testCaseResults.every(
      (r) => r.selfTestStatus === "PASSED"
    );
    if (!allPassed) {
      throw {
        status: 400,
        message: "所有测试用例必须全部自测通过才能提交验收",
      };
    }

    return prisma.$transaction(async (tx) => {
      // 更新各测试用例的自测状态
      for (const r of dto.testCaseResults) {
        await tx.testCase.update({
          where: { id: r.id },
          data: {
            selfTestStatus: r.selfTestStatus,
            selfTestRemark: r.selfTestRemark,
          },
        });
      }
      // 将任务状态推进到 QA_REVIEW
      return tx.task.update({
        where: { id: taskId },
        data: { status: "QA_REVIEW" },
      });
    });
  }

  // QA 验收审核
  async qaAudit(taskId: number, userId: number, dto: QaAuditDtoType) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { testCases: true },
    });
    if (!task) throw { status: 404, message: "任务不存在" };

    if (!taskSupportsTestCases(task.workDomain)) {
      throw {
        status: 400,
        message: "仅软件开发类任务支持 QA 验收流程",
      };
    }

    // 权限校验：仅测试验收人
    if (task.testerId !== userId) {
      throw { status: 403, message: "无权限：仅测试验收人可进行 QA 审核" };
    }

    if (task.status !== "QA_REVIEW") {
      throw { status: 400, message: "任务当前不在验收中状态" };
    }

    const hasFailure = dto.testCaseResults.some((r) => r.qaStatus === "FAILED");

    return prisma.$transaction(async (tx) => {
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

      if (hasFailure) {
        // 有用例失败 → 打回
        return tx.task.update({
          where: { id: taskId },
          data: { status: "REJECTED" },
        });
      } else {
        // 全部通过 → 完成，必须填写实际工时
        if (!dto.actualHours) {
          throw { status: 400, message: "验收通过时必须填写实际工时" };
        }
        return tx.task.update({
          where: { id: taskId },
          data: { status: "COMPLETED", actualHours: dto.actualHours },
        });
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

    return prisma.task.update({
      where: { id: taskId },
      data: { status: "PAUSED", version: { increment: 1 } },
    });
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

    return prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS", version: { increment: 1 } },
    });
  }

  // 重新打开任务 (REJECTED / COMPLETED -> IN_PROGRESS)
  async reopenTask(taskId: number, userId: number) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw { status: 404, message: "任务不存在" };

    if (task.status !== "REJECTED" && task.status !== "COMPLETED") {
      throw {
        status: 400,
        message: `当前状态（${task.status}）不支持重新打开，仅支持已打回或已完成的任务`,
      };
    }

    return prisma.$transaction(async (tx) => {
      if (taskSupportsTestCases(task.workDomain)) {
        await tx.testCase.updateMany({
          where: { taskId },
          data: { selfTestStatus: "UNTESTED", qaStatus: "UNTESTED" },
        });
      }

      return tx.task.update({
        where: { id: taskId },
        data: { status: "IN_PROGRESS", version: { increment: 1 } },
      });
    });
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
