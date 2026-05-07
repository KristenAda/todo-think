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
  PointsLedgerPageDtoType,
  ProjectTaskRuleDtoType,
} from "./task.dto";
import logger from "@/core/logger";
import {
  createFirstSettlementForAcceptedTask,
  createReversalSettlement,
  buildRuleEvaluationDetail,
} from "@/modules/performance/settlement.service";

/** 仅软件开发类任务启用测试用例与提测/验收流程 */
function taskSupportsTestCases(workDomain: string): boolean {
  return workDomain === "SOFTWARE_DEVELOPMENT";
}

function calcSuggestedBaseScore(input: {
  type?: string;
  priority?: string;
  estimatedHours?: number | null;
  workDomain?: string;
}): number {
  const typeBase: Record<string, number> = {
    FEATURE: 12,
    BUG: 10,
    ENHANCEMENT: 8,
    CHORE: 6,
  };
  const priorityFactor: Record<string, number> = {
    P0: 1.6,
    P1: 1.3,
    P2: 1.0,
    P3: 0.8,
  };
  const domainFactor: Record<string, number> = {
    SOFTWARE_DEVELOPMENT: 1.0,
    PRODUCT_DESIGN: 0.9,
    OPERATIONS_SUPPORT: 0.8,
    DATA_ANALYTICS: 0.95,
    GENERAL: 0.85,
  };
  const base = typeBase[input.type ?? "FEATURE"] ?? 10;
  const p = priorityFactor[input.priority ?? "P2"] ?? 1;
  const d = domainFactor[input.workDomain ?? "GENERAL"] ?? 1;
  const hourPart = Math.min(12, Math.max(0, Number(input.estimatedHours ?? 0))) * 0.8;
  const score = (base + hourPart) * p * d;
  return Number(score.toFixed(1));
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

  // ==================== ProjectTaskRule ====================
  private defaultTaskRules() {
    return {
      requireEstimateHours: false,
      requireDueDate: false,
      requireTestEvidenceForDev: true,
      allowCoAssigneeSubmitQa: false,
      allowQaRejectWithoutHours: true,
    };
  }

  async taskRulesInfo(projectId: number, userId: number) {
    await this.assertUserCanAccessProject(userId, projectId);

    const record = await prisma.projectTaskRule.findUnique({
      where: { projectId },
    });

    if (!record) return this.defaultTaskRules();

    return {
      requireEstimateHours: record.requireEstimateHours,
      requireDueDate: record.requireDueDate,
      requireTestEvidenceForDev: record.requireTestEvidenceForDev,
      allowCoAssigneeSubmitQa: record.allowCoAssigneeSubmitQa,
      allowQaRejectWithoutHours: record.allowQaRejectWithoutHours,
    };
  }

  async taskRulesUpdate(projectId: number, userId: number, dto: ProjectTaskRuleDtoType) {
    await this.assertUserCanAccessProject(userId, projectId);

    const data = {
      requireEstimateHours: dto.requireEstimateHours ?? false,
      requireDueDate: dto.requireDueDate ?? false,
      requireTestEvidenceForDev: dto.requireTestEvidenceForDev ?? true,
      allowCoAssigneeSubmitQa: dto.allowCoAssigneeSubmitQa ?? false,
      allowQaRejectWithoutHours: dto.allowQaRejectWithoutHours ?? true,
    };

    // 使用 upsert，确保“首次配置”可自动创建默认记录
    await prisma.projectTaskRule.upsert({
      where: { projectId },
      update: data,
      create: { projectId, ...data },
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
        project: {
          select: {
            id: true,
            name: true,
            managerId: true,
            taskRule: {
              select: {
                requireEstimateHours: true,
                requireDueDate: true,
                requireTestEvidenceForDev: true,
                allowCoAssigneeSubmitQa: true,
                allowQaRejectWithoutHours: true,
              },
            },
          },
        },
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

    // ==================== 项目规则校验（创建时）====================
    const rules = await projectService.taskRulesInfo(dto.projectId, userId);
    if (
      rules.requireEstimateHours &&
      (taskData.estimatedHours == null || taskData.estimatedHours <= 0)
    ) {
      throw {
        status: 400,
        message: "该项目要求创建任务时填写预估工时（estimatedHours），当前为空或非正数。",
      };
    }
    if (rules.requireDueDate && taskData.dueDate == null) {
      throw { status: 400, message: "该项目要求创建任务时填写截止时间（dueDate），当前为空。" };
    }

    const createdTask = await prisma.$transaction(async (tx) => {
      // Prisma MySQL 驱动不接受 undefined，必须显式控制每个字段
      const createData: any = {
        title: taskData.title,
        // 创建时若已指定主负责人，直接进入开发中，避免“已指派但仍待分配”的语义冲突
        status: taskData.mainAssigneeId ? "IN_PROGRESS" : "PENDING",
      };
      if (taskData.projectId !== undefined) createData.projectId = taskData.projectId;
      if (taskData.mainAssigneeId !== undefined) createData.mainAssigneeId = taskData.mainAssigneeId;
      if (taskData.testerId !== undefined) createData.testerId = taskData.testerId;
      if (taskData.estimatedHours !== undefined) createData.estimatedHours = taskData.estimatedHours;
      const suggestedBaseScore = calcSuggestedBaseScore({
        type: taskData.type,
        priority: taskData.priority,
        estimatedHours: taskData.estimatedHours,
        workDomain: taskData.workDomain,
      });
      createData.suggestedBaseScore = suggestedBaseScore;
      if (taskData.baseScore !== undefined && taskData.baseScore !== null) {
        createData.baseScore = taskData.baseScore;
        createData.baseScoreSource = "MANUAL";
      } else {
        createData.baseScore = suggestedBaseScore;
        createData.baseScoreSource = "AUTO";
      }
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
        content: `任务已创建${taskData.mainAssigneeId ? "并指定负责人，进入开发中" : ""}`,
        operatorId: userId,
        toStatus: createData.status,
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
          dueDate: true,
          estimatedHours: true,
          status: true,
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
      const shouldAutoStartByAssign =
        taskData.status === undefined &&
        existing.status === "PENDING" &&
        taskData.mainAssigneeId !== undefined &&
        taskData.mainAssigneeId !== null;

      // ==================== 项目规则校验（更新时）====================
      const rules = await projectService.taskRulesInfo(existing.projectId, userId);
      const nextEstimatedHours =
        taskData.estimatedHours !== undefined ? taskData.estimatedHours : existing.estimatedHours;
      if (rules.requireEstimateHours && (nextEstimatedHours == null || nextEstimatedHours <= 0)) {
        throw {
          status: 400,
          message: "该项目要求任务必须填写预估工时（estimatedHours），请补全后再更新。",
        };
      }

      const nextDueDate = taskData.dueDate !== undefined ? taskData.dueDate : existing.dueDate;
      if (rules.requireDueDate && nextDueDate == null) {
        throw { status: 400, message: "该项目要求任务必须填写截止时间（dueDate），请补全后再更新。" };
      }

      const nextType = taskData.type !== undefined ? taskData.type : (existing as any).type;
      const nextPriority =
        taskData.priority !== undefined ? taskData.priority : (existing as any).priority;
      const nextSuggestedBaseScore = calcSuggestedBaseScore({
        type: nextType,
        priority: nextPriority,
        estimatedHours: nextEstimatedHours,
        workDomain: nextWorkDomain,
      });

      const nextBaseScoreSource =
        taskData.baseScoreSource ?? (taskData.baseScore !== undefined ? "MANUAL" : "AUTO");
      const nextBaseScore =
        taskData.baseScore !== undefined
          ? taskData.baseScore
          : nextBaseScoreSource === "MANUAL"
            ? nextSuggestedBaseScore
            : nextSuggestedBaseScore;

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

      const updateData: any = {
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
        suggestedBaseScore: nextSuggestedBaseScore,
        baseScore: nextBaseScore,
        baseScoreSource:
          taskData.baseScore !== undefined
            ? "MANUAL"
            : nextBaseScoreSource === "MANUAL"
              ? "MANUAL"
              : "AUTO",
        ...(taskData.status !== undefined && { status: taskData.status }),
        ...(shouldAutoStartByAssign && { status: "IN_PROGRESS" }),
        version: { increment: 1 },
      };

      const updateResult = await tx.task.updateMany({
        where: {
          id,
          version: version,
        },
        data: updateData,
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
      const prevCoIds = new Set<number>((existing.coAssignees ?? []).map((x: any) => x.userId));

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
      include: {
        coAssignees: true,
        project: { select: { name: true } },
      },
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

    // ==================== 项目规则校验（开始开发时）====================
    const rules = await projectService.taskRulesInfo(task.projectId, userId);
    if (rules.requireEstimateHours && (task.estimatedHours == null || task.estimatedHours <= 0)) {
      throw {
        status: 400,
        message: "该项目要求开发前填写预估工时（estimatedHours）。请先补全后再开始开发。",
      };
    }
    if (rules.requireDueDate && task.dueDate == null) {
      throw { status: 400, message: "该项目要求开发前填写截止时间（dueDate）。请先补全后再开始开发。" };
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

    // ===== 站内消息推送：开始开发（推给主负责人/协助人/验收人；排除操作者）=====
    try {
      const receiverIds = new Set<number>();
      if (task.mainAssigneeId) receiverIds.add(task.mainAssigneeId);
      if (task.testerId) receiverIds.add(task.testerId);
      for (const ca of task.coAssignees ?? []) receiverIds.add(ca.userId);
      receiverIds.delete(userId);

      const projectName = task.project?.name ?? "";
      const taskTitle = task.title ?? "";

      await Promise.allSettled(
        Array.from(receiverIds).map((receiverId) =>
          messageService.sendRealTimeMessage(
            {
              receiverId,
              messageType: "TASK",
              title: "任务已开始开发",
              content: `任务「${taskTitle}」进入开发中（项目：${projectName}）。`,
              extra: {
                biz: "task",
                action: "started",
                taskId,
                projectId: task.projectId,
              },
            },
            userId
          )
        )
      );
    } catch {}

    return updated;
  }

  // 填写工时（主负责人或协助人均可）
  async addWorkLog(taskId: number, userId: number, dto: CreateWorkLogDtoType) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        coAssignees: true,
        project: { select: { name: true } },
      },
    });
    if (!task) throw { status: 404, message: "任务不存在" };

    const isMainAssignee = task.mainAssigneeId === userId;
    const isCoAssignee = task.coAssignees.some((ca) => ca.userId === userId);
    if (!isMainAssignee && !isCoAssignee) {
      throw { status: 403, message: "无权限：仅任务负责人可填写工时" };
    }

    await assertAttachmentsOwnedByUser(dto.attachmentIds, userId);

    const ret = await prisma.$transaction(async (tx) => {
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

    // ===== 站内消息推送：工时登记（推给主负责人/协助人/验收人；排除操作者）=====
    try {
      const receiverIds = new Set<number>();
      if (task.mainAssigneeId) receiverIds.add(task.mainAssigneeId);
      if (task.testerId) receiverIds.add(task.testerId);
      for (const ca of task.coAssignees ?? []) receiverIds.add(ca.userId);
      receiverIds.delete(userId);

      const projectName = task.project?.name ?? "";
      const taskTitle = task.title ?? "";

      await Promise.allSettled(
        Array.from(receiverIds).map((receiverId) =>
          messageService.sendRealTimeMessage(
            {
              receiverId,
              messageType: "TASK",
              title: "工时已登记",
              content: `任务「${taskTitle}」新增工时：${dto.hours}h（项目：${projectName}）。`,
              extra: {
                biz: "task",
                action: "worklogAdded",
                taskId,
                projectId: task.projectId,
              },
            },
            userId
          )
        )
      );
    } catch {}

    return ret;
  }

  async addComment(taskId: number, userId: number, dto: CreateTaskCommentDtoType) {
    await projectService.assertUserCanAccessTask(userId, taskId);
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { coAssignees: true, project: { select: { name: true } } },
    });
    if (!task) throw { status: 404, message: "任务不存在" };

    await assertAttachmentsOwnedByUser(dto.attachmentIds, userId);

    const ret = await prisma.$transaction(async (tx) => {
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

    // ===== 站内消息推送：评论新增（推给主负责人/协助人/验收人；排除操作者）=====
    try {
      const receiverIds = new Set<number>();
      if (task.mainAssigneeId) receiverIds.add(task.mainAssigneeId);
      if (task.testerId) receiverIds.add(task.testerId);
      for (const ca of task.coAssignees ?? []) receiverIds.add(ca.userId);
      receiverIds.delete(userId);

      // 如果评论内容包含 @用户，则额外通知被提及用户（按 userName / nickName 精确匹配）
      // 规则：@xxx，xxx 直到遇到空白或标点分隔（不支持复杂富文本结构）
      const mentionTokens = Array.from(
        (dto.content ?? '').matchAll(/@([^\s@，。,.!?;:：]{1,30})/g)
      )
        .map((m) => m[1])
        .filter(Boolean);

      if (mentionTokens.length) {
        const uniqTokens = Array.from(new Set(mentionTokens));
        const mentionedUsers = await prisma.user.findMany({
          where: {
            OR: [{ userName: { in: uniqTokens } }, { nickName: { in: uniqTokens } }]
          },
          select: { id: true }
        });

        for (const u of mentionedUsers) receiverIds.add(u.id);
      }

      const projectName = task.project?.name ?? "";
      const taskTitle = task.title ?? "";
      const snippet = dto.content?.slice(0, 80) ?? "";

      await Promise.allSettled(
        Array.from(receiverIds).map((receiverId) =>
          messageService.sendRealTimeMessage(
            {
              receiverId,
              messageType: "TASK",
              title: "任务收到新评论",
              content: `任务「${taskTitle}」新增评论：${snippet}（项目：${projectName}）。`,
              extra: {
                biz: "task",
                action: "commentAdded",
                taskId,
                projectId: task.projectId,
              },
            },
            userId
          )
        )
      );
    } catch {}

    return ret;
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

    const rules = await projectService.taskRulesInfo(task.projectId, userId);

    if (taskSupportsTestCases(task.workDomain)) {
      if (!task.testCases.length) {
        throw { status: 400, message: "请先添加测试用例" };
      }

      if (rules.requireTestEvidenceForDev) {
        if (dto.testCaseResults.length !== task.testCases.length) {
          throw { status: 400, message: "请完整提交全部测试用例的自测结果" };
        }
        const allPassed = dto.testCaseResults.every(
          (r) => r.selfTestStatus === "PASSED"
        );
        if (!allPassed) {
          throw {
            status: 400,
            message: "所有测试用例必须全部自测通过才能提交验收（已启用项目规则：requireTestEvidenceForDev）",
          };
        }
      } else {
        // 放宽：允许不完整/不强制全部通过；但需要确保提交的用例 id 属于本任务
        const taskCaseIds = new Set(task.testCases.map((tc) => tc.id));
        const invalid = dto.testCaseResults.some((r) => !taskCaseIds.has(r.id));
        if (invalid) {
          throw { status: 400, message: "自测结果包含无效测试用例，请重新选择" };
        }
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

    const rules = await projectService.taskRulesInfo(task.projectId, userId);

    // 权限校验：仅测试验收人；可由规则放宽到协助人
    const isCoAssignee = (task.coAssignees ?? []).some((ca) => ca.userId === userId);
    if (task.testerId !== userId) {
      if (!(rules.allowCoAssigneeSubmitQa && isCoAssignee)) {
        throw { status: 403, message: "无权限：仅测试验收人可进行 QA 审核（协助人权限未启用）" };
      }
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

    const updated = await prisma.$transaction(async (tx) => {
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

        // 若规则要求：打回必须填写实际工时
        const needHours = !rules.allowQaRejectWithoutHours;
        if (needHours) {
          const actualHours = dto.actualHours;
          if (!actualHours || actualHours <= 0) {
            throw {
              status: 400,
              message: "打回修改需要填写实际工时（规则：allowQaRejectWithoutHours=false）",
            };
          }
        }

        // 打回后直接回到提交验收前状态（开发中）
        const updated = await tx.task.update({
          where: { id: taskId },
          data: {
            status: "IN_PROGRESS",
            qaRejectReason: rejectReason,
            ...(dto.actualHours && !rules.allowQaRejectWithoutHours
              ? { actualHours: dto.actualHours }
              : {}),
          } as any,
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
        const acceptedAt = new Date();
        const updated = await tx.task.update({
          where: { id: taskId },
          data: {
            status: "COMPLETED",
            actualHours: dto.actualHours,
            qaRejectReason: null,
            acceptedAt,
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

    // 验收通过才结算：异步创建结算（失败不影响验收通过主流程）
    if (!hasFailure) {
      try {
        await createFirstSettlementForAcceptedTask(taskId);
      } catch (e: any) {
        logger.error(`[perf] create settlement failed taskId=${taskId}: ${e?.message ?? e}`);
      }
    }

    return updated;
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

  // 重新打开任务（COMPLETED -> IN_PROGRESS），并冲正上一笔结算
  async reopenTask(taskId: number, userId: number) {
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
      throw { status: 403, message: "无权限：仅任务负责人或项目负责人可重新打开任务" };
    }

    if (task.status !== "COMPLETED") {
      throw { status: 400, message: `当前状态（${task.status}）无法重新打开` };
    }

    const reopenedAt = new Date();
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "IN_PROGRESS",
        acceptedAt: null,
        version: { increment: 1 },
      } as any,
    });
    await appendTaskTimeline(prisma, {
      taskId,
      eventType: "STATUS_CHANGED",
      title: "重新打开任务",
      operatorId: userId,
      fromStatus: "COMPLETED",
      toStatus: "IN_PROGRESS",
    });

    // 冲正上一笔（异步；失败不阻断主流程）
    try {
      await createReversalSettlement(taskId, reopenedAt);
    } catch (e: any) {
      logger.error(`[perf] create reversal failed taskId=${taskId}: ${e?.message ?? e}`);
    }

    // ===== 站内消息推送：重新打开（推给主负责人/协助人/验收人；排除操作者）=====
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
              title: "任务已重新打开",
              content: `任务「${task.title}」已被重新打开。`,
              extra: { biz: "task", action: "reopened", taskId, projectId: task.projectId },
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

/** 积分详情：任务事实字段中文名（结算快照 task.*） */
const TASK_FACT_FIELD_LABEL_ZH: Record<string, string> = {
  id: "任务 ID",
  projectId: "所属项目",
  workDomain: "任务领域",
  priority: "优先级",
  dueDate: "截止日期",
  acceptedAt: "验收通过时间",
  estimatedHours: "预估工时",
  actualHours: "实际工时",
  mainAssigneeId: "主负责人",
  testerId: "验收人",
  coAssigneeIds: "协助人",
  testCaseBugCount: "用例缺陷数",
  delayHours: "延期小时数",
  aheadDays: "提前完成天数",
  baseScore: "基础积分",
  complexity: "难度系数",
};

const TASK_WORK_DOMAIN_ZH: Record<string, string> = {
  SOFTWARE_DEVELOPMENT: "软件开发",
  PRODUCT_DESIGN: "产品与设计",
  OPERATIONS_SUPPORT: "运维与实施",
  DATA_ANALYTICS: "数据分析",
  GENERAL: "综合与其他",
};

const TASK_PRIORITY_LABEL_ZH: Record<string, string> = {
  P0: "P0（紧急）",
  P1: "P1（高）",
  P2: "P2（中）",
  P3: "P3（低）",
};

type TaskFactLedgerRow = {
  field: string;
  label: string;
  raw: unknown;
  display: string;
};

/** 数值展示：最多 fractionDigits 位小数，并去掉末尾无意义的 0 */
function trimNumberDisplay(n: number, fractionDigits: number): string {
  const s = n.toFixed(fractionDigits);
  if (!s.includes(".")) return s;
  return s.replace(/\.?0+$/, "");
}

async function buildTaskFactRowsForLedger(taskFact: Record<string, unknown>): Promise<TaskFactLedgerRow[]> {
  const userIds = new Set<number>();
  if (typeof taskFact.mainAssigneeId === "number" && taskFact.mainAssigneeId > 0) {
    userIds.add(taskFact.mainAssigneeId);
  }
  if (typeof taskFact.testerId === "number" && taskFact.testerId > 0) {
    userIds.add(taskFact.testerId);
  }
  if (Array.isArray(taskFact.coAssigneeIds)) {
    for (const id of taskFact.coAssigneeIds as unknown[]) {
      if (typeof id === "number" && id > 0) userIds.add(id);
    }
  }

  const users =
    userIds.size === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: [...userIds] } },
          select: { id: true, userName: true, nickName: true },
        });
  const userMap = new Map<number, string>(
    users.map((u) => [u.id, (u.nickName || u.userName)?.trim() || `用户${u.id}`]),
  );

  let projectName: string | null = null;
  if (typeof taskFact.projectId === "number" && taskFact.projectId > 0) {
    const proj = await prisma.project.findUnique({
      where: { id: taskFact.projectId },
      select: { name: true },
    });
    projectName = proj?.name ?? null;
  }

  function formatDisplay(field: string, val: unknown): string {
    if (val === null || val === undefined || val === "") return "—";
    if (field === "mainAssigneeId" || field === "testerId") {
      const id = Number(val);
      if (!id) return "—";
      const name = userMap.get(id);
      return name ? `${name}（ID ${id}）` : `ID ${id}`;
    }
    if (field === "coAssigneeIds") {
      if (!Array.isArray(val) || val.length === 0) return "—";
      return (val as unknown[])
        .map((id) => {
          if (typeof id !== "number" || !id) return null;
          const name = userMap.get(id);
          return name ? `${name}（${id}）` : String(id);
        })
        .filter(Boolean)
        .join("、");
    }
    if (field === "workDomain") {
      const code = String(val);
      const zh = TASK_WORK_DOMAIN_ZH[code];
      return zh ? `${zh}（${code}）` : code;
    }
    if (field === "priority") {
      const code = String(val);
      const zh = TASK_PRIORITY_LABEL_ZH[code];
      return zh ?? code;
    }
    if (field === "projectId") {
      const id = Number(val);
      if (!id) return "—";
      return projectName ? `${projectName}（ID ${id}）` : `ID ${id}`;
    }
    if (typeof val === "object") return JSON.stringify(val);
    if (typeof val === "number" && Number.isFinite(val)) {
      if (Number.isInteger(val)) return String(val);
      return trimNumberDisplay(val, 2);
    }
    if (typeof val === "string") {
      const t = val.trim();
      if (t !== "" && /^-?\d+(\.\d+)?$/.test(t)) {
        const n = Number(t);
        if (Number.isFinite(n)) {
          if (Number.isInteger(n)) return String(Math.trunc(n));
          return trimNumberDisplay(n, 2);
        }
      }
    }
    return String(val);
  }

  const preferredOrder = [
    "id",
    "projectId",
    "workDomain",
    "priority",
    "dueDate",
    "acceptedAt",
    "estimatedHours",
    "actualHours",
    "mainAssigneeId",
    "testerId",
    "coAssigneeIds",
    "testCaseBugCount",
    "delayHours",
    "aheadDays",
    "baseScore",
    "complexity",
  ];
  const keys = [
    ...preferredOrder.filter((k) => Object.prototype.hasOwnProperty.call(taskFact, k)),
    ...Object.keys(taskFact).filter((k) => !preferredOrder.includes(k)),
  ];

  return keys.map((field) => ({
    field,
    label: TASK_FACT_FIELD_LABEL_ZH[field] ?? field,
    raw: taskFact[field],
    display: formatDisplay(field, taskFact[field]),
  }));
}

function perfMedian(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

function perfNormMinMax(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 50;
  if (max <= min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function perfTierFromRank(rank: number, total: number): "S" | "A" | "B" | "C" {
  if (total <= 0) return "C";
  const sEnd = Math.max(1, Math.ceil(total * 0.2));
  const aEnd = Math.max(sEnd, Math.ceil(total * 0.5));
  const bEnd = Math.max(aEnd, Math.ceil(total * 0.8));
  if (rank < sEnd) return "S";
  if (rank < aEnd) return "A";
  if (rank < bEnd) return "B";
  return "C";
}

/**
 * 效能统计应展示的用户 ID：当前用户 + 其管理部门（DeptManager 所辖部门及子部门）内全部成员；
 * 若无部门管理关系，则退化为「与当前用户同属根组织」的全部部门成员。
 * 仅包含部门树根在 orgIds 范围内的部门，避免跨组织数据。
 */
async function performanceRosterUserIds(orgIds: number[], viewerUserId: number): Promise<number[]> {
  const orgSet = new Set(orgIds);
  const allDepts = await prisma.department.findMany({
    where: { deletedAt: null },
    select: { id: true, parentId: true },
  });
  const byId = new Map(allDepts.map((d) => [d.id, d]));

  const rootOf = (deptId: number): number | null => {
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
  };

  const inOrgScope = (deptId: number) => {
    const r = rootOf(deptId);
    return r != null && orgSet.has(r);
  };

  const childrenByParent = new Map<number, number[]>();
  for (const d of allDepts) {
    const pk = d.parentId == null ? -1 : d.parentId;
    if (!childrenByParent.has(pk)) childrenByParent.set(pk, []);
    childrenByParent.get(pk)!.push(d.id);
  }

  const collectSubtreeDeptIds = (startIds: number[]) => {
    const out = new Set<number>();
    for (const sid of startIds) {
      const st: number[] = [sid];
      while (st.length) {
        const id = st.pop()!;
        if (out.has(id)) continue;
        out.add(id);
        const kids = childrenByParent.get(id) ?? [];
        for (const k of kids) st.push(k);
      }
    }
    return out;
  };

  const managed = await prisma.deptManager.findMany({
    where: { userId: viewerUserId },
    select: { deptId: true },
  });
  const managedInScope = managed.map((m) => m.deptId).filter((id) => inOrgScope(id));

  let deptIdsForRoster: Set<number>;
  if (managedInScope.length > 0) {
    deptIdsForRoster = collectSubtreeDeptIds(managedInScope);
  } else {
    deptIdsForRoster = new Set(allDepts.map((d) => d.id).filter((id) => inOrgScope(id)));
  }

  const roster = new Set<number>([viewerUserId]);
  const deptList = Array.from(deptIdsForRoster);
  if (deptList.length > 0) {
    const members = await prisma.deptMember.groupBy({
      by: ["userId"],
      where: { deptId: { in: deptList } },
    });
    for (const m of members) roster.add(m.userId);
  }
  return Array.from(roster);
}

class PerformanceService {
  async myTotalPoints(userId: number) {
    const account = await prisma.pointsAccount.findUnique({
      where: { ownerType_ownerId: { ownerType: "USER", ownerId: userId } },
      select: { id: true },
    });
    if (!account) return { totalPoints: 0 };
    const agg = await prisma.pointsLedgerEntry.aggregate({
      where: { accountId: account.id },
      _sum: { amount: true },
    });
    return { totalPoints: Number(agg._sum.amount ?? 0) };
  }

  async stats(dto: PerformancePageDtoType, userId: number) {
    const emptySummary = () => ({
      tasksByType: {} as Record<string, number>,
      tasksByPriority: {} as Record<string, number>,
      totals: {
        headcount: 0,
        completedTasks: 0,
        totalWorkLogHours: 0,
        totalPoints: 0,
        totalQaRejects: 0,
        avgCompositeScore: 0,
        avgOnTimeRate: 0,
      },
    });

    const orgIds = await projectService.getOrgIdsForUser(userId);
    if (orgIds.length === 0) {
      return { list: [], total: 0, summary: emptySummary() };
    }

    const { page, pageSize, projectId, startAt, endAt } = dto;

    const allowedProjects = await prisma.project.findMany({
      where: { orgId: { in: orgIds }, deletedAt: null },
      select: { id: true },
    });
    const allowedProjectIds = allowedProjects.map((p) => p.id);
    if (!allowedProjectIds.length) {
      return { list: [], total: 0, summary: emptySummary() };
    }

    let projectFilter: number | { in: number[] };
    if (projectId) {
      if (!allowedProjectIds.includes(projectId)) {
        return { list: [], total: 0, summary: emptySummary() };
      }
      projectFilter = projectId;
    } else {
      projectFilter = { in: allowedProjectIds };
    }

    const orgAccessOr = [
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
    ];

    const dateClause =
      startAt || endAt
        ? {
            OR: [
              {
                acceptedAt: {
                  ...(startAt ? { gte: new Date(startAt) } : {}),
                  ...(endAt ? { lte: new Date(endAt) } : {}),
                },
              },
              {
                AND: [
                  { acceptedAt: null },
                  {
                    updatedAt: {
                      ...(startAt ? { gte: new Date(startAt) } : {}),
                      ...(endAt ? { lte: new Date(endAt) } : {}),
                    },
                  },
                ],
              },
            ],
          }
        : null;

    const completedWhere: any = {
      status: "COMPLETED",
      projectId: projectFilter,
      OR: orgAccessOr,
    };
    if (dateClause) {
      completedWhere.AND = completedWhere.AND ?? [];
      completedWhere.AND.push(dateClause);
    }

    const pointsWhere: any = {
      bizType: { in: ["task_settlement", "adjustment", "reversal"] },
      projectId: projectFilter,
    };
    if (startAt || endAt) {
      pointsWhere.occurredAt = {
        ...(startAt ? { gte: new Date(startAt) } : {}),
        ...(endAt ? { lte: new Date(endAt) } : {}),
      };
    }

    const timelineDate =
      startAt || endAt
        ? {
            createdAt: {
              ...(startAt ? { gte: new Date(startAt) } : {}),
              ...(endAt ? { lte: new Date(endAt) } : {}),
            },
          }
        : {};

    const workLogDate =
      startAt || endAt
        ? {
            createdAt: {
              ...(startAt ? { gte: new Date(startAt) } : {}),
              ...(endAt ? { lte: new Date(endAt) } : {}),
            },
          }
        : {};

    const [
      completedTasks,
      ledger,
      rejectTimelines,
      workLogGroups,
      wipGroups,
    ] = await Promise.all([
      prisma.task.findMany({
        where: completedWhere,
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
          coAssignees: { select: { userId: true } },
        },
      }),
      prisma.pointsLedgerEntry.findMany({
        where: pointsWhere,
        include: { account: true },
      }),
      prisma.taskTimeline.findMany({
        where: {
          eventType: "QA_REJECTED",
          ...timelineDate,
          task: {
            projectId: projectFilter,
            OR: orgAccessOr,
          },
        },
        select: {
          taskId: true,
          task: { select: { mainAssigneeId: true } },
        },
      }),
      prisma.workLog.groupBy({
        by: ["userId"],
        where: {
          ...workLogDate,
          task: {
            projectId: projectFilter,
            OR: orgAccessOr,
          },
        },
        _sum: { hours: true },
      }),
      prisma.task.groupBy({
        by: ["mainAssigneeId"],
        where: {
          projectId: projectFilter,
          OR: orgAccessOr,
          mainAssigneeId: { not: null },
          status: { notIn: ["COMPLETED", "CANCELLED", "PAUSED"] },
        },
        _count: { _all: true },
      }),
    ]);

    const qaRejectByMain = new Map<number, number>();
    for (const row of rejectTimelines) {
      const mid = row.task?.mainAssigneeId;
      if (!mid) continue;
      qaRejectByMain.set(mid, (qaRejectByMain.get(mid) ?? 0) + 1);
    }

    const workLogByUser = new Map<number, number>();
    for (const g of workLogGroups) {
      workLogByUser.set(g.userId, Number(g._sum.hours ?? 0));
    }

    const wipByMain = new Map<number, number>();
    for (const g of wipGroups) {
      if (g.mainAssigneeId != null) {
        wipByMain.set(g.mainAssigneeId, g._count._all);
      }
    }

    const pointsByUser = new Map<number, { totalPoints: number; byType: Record<string, number> }>();
    let totalPointsAll = 0;
    for (const e of ledger) {
      if (e.account?.ownerType !== "USER") continue;
      const uid = e.account.ownerId;
      if (!pointsByUser.has(uid)) pointsByUser.set(uid, { totalPoints: 0, byType: {} });
      const p = pointsByUser.get(uid)!;
      p.totalPoints += e.amount;
      p.byType[e.pointsType] = (p.byType[e.pointsType] ?? 0) + e.amount;
      totalPointsAll += e.amount;
    }

    type Agg = {
      user: any;
      totalTasks: number;
      totalActualHours: number;
      totalEstimatedHours: number;
      totalBugCount: number;
      firstPassCount: number;
      leadDaysList: number[];
      onTimeWithDue: number;
      onTimeHits: number;
      delayHoursSum: number;
      tasksWithDue: number;
      hoursAccuracySum: number;
      hoursAccuracyTasks: number;
    };

    const map = new Map<number, Agg>();
    const coAssigneeCompleted = new Map<number, number>();
    const testerCompleted = new Map<number, number>();
    const tasksByType: Record<string, number> = {};
    const tasksByPriority: Record<string, number> = {};

    for (const task of completedTasks) {
      const t = String(task.type ?? "FEATURE");
      tasksByType[t] = (tasksByType[t] ?? 0) + 1;
      const pr = String(task.priority ?? "P2");
      tasksByPriority[pr] = (tasksByPriority[pr] ?? 0) + 1;

      if (task.testerId) {
        testerCompleted.set(task.testerId, (testerCompleted.get(task.testerId) ?? 0) + 1);
      }
      for (const ca of task.coAssignees ?? []) {
        if (ca.userId && ca.userId !== task.mainAssigneeId) {
          coAssigneeCompleted.set(ca.userId, (coAssigneeCompleted.get(ca.userId) ?? 0) + 1);
        }
      }

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
          leadDaysList: [],
          onTimeWithDue: 0,
          onTimeHits: 0,
          delayHoursSum: 0,
          tasksWithDue: 0,
          hoursAccuracySum: 0,
          hoursAccuracyTasks: 0,
        });
      }
      const stat = map.get(uid)!;
      stat.totalTasks += 1;
      stat.totalActualHours += task.actualHours ?? 0;
      stat.totalEstimatedHours += task.estimatedHours ?? 0;

      const bugCount = task.testCases.reduce((sum, tc) => sum + tc.bugCount, 0);
      stat.totalBugCount += bugCount;
      if (bugCount === 0) stat.firstPassCount += 1;

      const createdAt = new Date(task.createdAt);
      const acceptedAt = task.acceptedAt ? new Date(task.acceptedAt) : new Date(task.updatedAt);
      const leadDays = (acceptedAt.getTime() - createdAt.getTime()) / (24 * 3600000);
      stat.leadDaysList.push(Math.max(0, leadDays));

      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      if (dueDate) {
        stat.tasksWithDue += 1;
        const delayHours = Math.max(0, (acceptedAt.getTime() - dueDate.getTime()) / 3600000);
        stat.delayHoursSum += delayHours;
        if (delayHours <= 0) stat.onTimeHits += 1;
        stat.onTimeWithDue += 1;
      }

      const est = task.estimatedHours;
      if (est != null && est > 0) {
        const act = task.actualHours ?? 0;
        const acc = 100 - Math.min(100, (Math.abs(act - est) / est) * 100);
        stat.hoursAccuracySum += acc;
        stat.hoursAccuracyTasks += 1;
      }
    }

    type StatRow = {
      user: any;
      totalTasks: number;
      totalActualHours: number;
      totalEstimatedHours: number;
      totalBugCount: number;
      firstPassCount: number;
      firstPassRate: number;
      totalPoints: number;
      pointsByType: Record<string, number>;
      medianLeadTimeDays: number;
      avgDelayHours: number;
      onTimeRate: number;
      hoursAccuracyAvg: number;
      qaRejectCount: number;
      workLogHours: number;
      coAssigneeCompletedCount: number;
      testerCompletedCount: number;
      wipCount: number;
      compositeScore: number;
      compositeTier: "S" | "A" | "B" | "C";
      subScores: {
        throughput: number;
        quality: number;
        punctuality: number;
        speed: number;
        stability: number;
      };
    };

    const rows: StatRow[] = [];

    for (const s of map.values()) {
      const firstPassRate =
        s.totalTasks > 0 ? Math.round((s.firstPassCount / s.totalTasks) * 100) : 0;
      const medianLeadTimeDays = perfMedian(s.leadDaysList);
      const avgDelayHours = s.tasksWithDue > 0 ? s.delayHoursSum / s.tasksWithDue : 0;
      const onTimeRate =
        s.onTimeWithDue > 0 ? Math.round((s.onTimeHits / s.onTimeWithDue) * 100) : 100;
      const hoursAccuracyAvg =
        s.hoursAccuracyTasks > 0 ? Math.round(s.hoursAccuracySum / s.hoursAccuracyTasks) : 0;
      const uid = s.user.id;
      const qaRejectCount = qaRejectByMain.get(uid) ?? 0;
      const workLogHours = workLogByUser.get(uid) ?? 0;
      const coAssigneeCompletedCount = coAssigneeCompleted.get(uid) ?? 0;
      const testerCompletedCount = testerCompleted.get(uid) ?? 0;
      const wipCount = wipByMain.get(uid) ?? 0;

      rows.push({
        user: s.user,
        totalTasks: s.totalTasks,
        totalActualHours: s.totalActualHours,
        totalEstimatedHours: s.totalEstimatedHours,
        totalBugCount: s.totalBugCount,
        firstPassCount: s.firstPassCount,
        firstPassRate,
        totalPoints: pointsByUser.get(uid)?.totalPoints ?? 0,
        pointsByType: pointsByUser.get(uid)?.byType ?? {},
        medianLeadTimeDays: Math.round(medianLeadTimeDays * 10) / 10,
        avgDelayHours: Math.round(avgDelayHours * 10) / 10,
        onTimeRate,
        hoursAccuracyAvg,
        qaRejectCount,
        workLogHours: Math.round(workLogHours * 10) / 10,
        coAssigneeCompletedCount,
        testerCompletedCount,
        wipCount,
        compositeScore: 0,
        compositeTier: "C",
        subScores: {
          throughput: 0,
          quality: 0,
          punctuality: 0,
          speed: 0,
          stability: 0,
        },
      });
    }

    /** 花名册：本人 + 管理部门成员（或同组织全员），无主责完成数据也展示为 0 */
    const rosterUserIds = await performanceRosterUserIds(orgIds, userId);
    const seenRoster = new Set(rows.map((r) => r.user.id));
    const missingUserIds = rosterUserIds.filter((id) => !seenRoster.has(id));
    if (missingUserIds.length > 0) {
      const fillerUsers = await prisma.user.findMany({
        where: { id: { in: missingUserIds } },
        select: {
          id: true,
          userName: true,
          nickName: true,
          avatar: true,
          userEmail: true,
        },
      });
      for (const u of fillerUsers) {
        const uid2 = u.id;
        rows.push({
          user: u,
          totalTasks: 0,
          totalActualHours: 0,
          totalEstimatedHours: 0,
          totalBugCount: 0,
          firstPassCount: 0,
          firstPassRate: 0,
          totalPoints: pointsByUser.get(uid2)?.totalPoints ?? 0,
          pointsByType: pointsByUser.get(uid2)?.byType ?? {},
          medianLeadTimeDays: 0,
          avgDelayHours: 0,
          onTimeRate: 100,
          hoursAccuracyAvg: 0,
          qaRejectCount: qaRejectByMain.get(uid2) ?? 0,
          workLogHours: Math.round((workLogByUser.get(uid2) ?? 0) * 10) / 10,
          coAssigneeCompletedCount: coAssigneeCompleted.get(uid2) ?? 0,
          testerCompletedCount: testerCompleted.get(uid2) ?? 0,
          wipCount: wipByMain.get(uid2) ?? 0,
          compositeScore: 0,
          compositeTier: "C",
          subScores: {
            throughput: 0,
            quality: 0,
            punctuality: 0,
            speed: 0,
            stability: 0,
          },
        });
      }
    }

    if (rows.length === 0) {
      return { list: [], total: 0, summary: emptySummary() };
    }

    const tasksArr = rows.map((r) => r.totalTasks);
    const leadArr = rows.map((r) => r.medianLeadTimeDays);
    const onTimeArr = rows.map((r) => r.onTimeRate);
    const qualArr = rows.map((r) => r.firstPassRate);
    const rejPerTask = rows.map((r) => (r.totalTasks > 0 ? r.qaRejectCount / r.totalTasks : 0));

    const tMin = Math.min(...tasksArr);
    const tMax = Math.max(...tasksArr);
    const leadMin = Math.min(...leadArr);
    const leadMax = Math.max(...leadArr);
    const otMin = Math.min(...onTimeArr);
    const otMax = Math.max(...onTimeArr);
    const qMin = Math.min(...qualArr);
    const qMax = Math.max(...qualArr);
    const rpMin = Math.min(...rejPerTask);
    const rpMax = Math.max(...rejPerTask);

    for (const r of rows) {
      const throughput = perfNormMinMax(r.totalTasks, tMin, tMax);
      const speed = 100 - perfNormMinMax(r.medianLeadTimeDays, leadMin, leadMax);
      const punctuality = perfNormMinMax(r.onTimeRate, otMin, otMax);
      const quality = perfNormMinMax(r.firstPassRate, qMin, qMax);
      const stability = 100 - perfNormMinMax(r.totalTasks > 0 ? r.qaRejectCount / r.totalTasks : 0, rpMin, rpMax);

      r.subScores = {
        throughput: Math.round(throughput),
        quality: Math.round(quality),
        punctuality: Math.round(punctuality),
        speed: Math.round(speed),
        stability: Math.round(stability),
      };
      r.compositeScore = Math.round(
        throughput * 0.18 +
          quality * 0.22 +
          punctuality * 0.22 +
          speed * 0.22 +
          stability * 0.16,
      );
    }

    rows.sort((a, b) => b.compositeScore - a.compositeScore);
    rows.forEach((r, idx) => {
      r.compositeTier = perfTierFromRank(idx, rows.length);
    });

    const totalWorkLogHours = Array.from(workLogByUser.values()).reduce((a, b) => a + b, 0);
    const summary = {
      tasksByType,
      tasksByPriority,
      totals: {
        headcount: rows.length,
        completedTasks: completedTasks.length,
        totalWorkLogHours: Math.round(totalWorkLogHours * 10) / 10,
        totalPoints: totalPointsAll,
        totalQaRejects: rejectTimelines.length,
        avgCompositeScore:
          Math.round((rows.reduce((s, r) => s + r.compositeScore, 0) / rows.length) * 10) / 10,
        avgOnTimeRate:
          Math.round((rows.reduce((s, r) => s + r.onTimeRate, 0) / rows.length) * 10) / 10,
      },
    };

    const total = rows.length;
    const skip = (page - 1) * pageSize;
    const list = rows.slice(skip, skip + pageSize);
    return { list, total, summary };
  }

  async reconcileTask(taskId: number, userId: number) {
    await projectService.assertUserCanAccessTask(userId, taskId);

    const settlements = await prisma.perfSettlement.findMany({
      where: { taskId },
      orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
      include: {
        items: true,
      },
    });

    const settlementIds = settlements.map((s) => s.id.toString());
    const ledgers = await prisma.pointsLedgerEntry.findMany({
      where: {
        taskId,
        bizId: { in: settlementIds.length ? settlementIds : ["-1"] },
      },
      include: {
        account: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      taskId,
      settlements,
      ledgers,
    };
  }

  async ledgerPage(dto: PointsLedgerPageDtoType, userId: number) {
    const orgIds = await projectService.getOrgIdsForUser(userId);
    if (!orgIds.length) {
      return { list: [], total: 0, summary: { sumAmount: 0 } };
    }
    const allowedProjects = await prisma.project.findMany({
      where: { orgId: { in: orgIds }, deletedAt: null },
      select: { id: true },
    });
    const allowedProjectIds = allowedProjects.map((p) => p.id);
    if (!allowedProjectIds.length) {
      return { list: [], total: 0, summary: { sumAmount: 0 } };
    }

    let projectFilter: number | { in: number[] };
    if (dto.projectId) {
      if (!allowedProjectIds.includes(dto.projectId)) {
        return { list: [], total: 0, summary: { sumAmount: 0 } };
      }
      projectFilter = dto.projectId;
    } else {
      projectFilter = { in: allowedProjectIds };
    }

    const where: any = {
      projectId: projectFilter,
    };
    if (dto.bizType) {
      where.bizType = dto.bizType;
    } else {
      where.bizType = { in: ["task_settlement", "adjustment", "reversal", "manual"] };
    }
    if (dto.taskId) where.taskId = dto.taskId;
    if (dto.userOwnerId) {
      where.account = { ownerType: "USER", ownerId: dto.userOwnerId };
    }
    if (dto.startAt || dto.endAt) {
      where.occurredAt = {
        ...(dto.startAt ? { gte: new Date(dto.startAt) } : {}),
        ...(dto.endAt ? { lte: new Date(dto.endAt) } : {}),
      };
    }

    const [agg, total, rows] = await Promise.all([
      prisma.pointsLedgerEntry.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.pointsLedgerEntry.count({ where }),
      prisma.pointsLedgerEntry.findMany({
        where,
        include: {
          account: true,
          ruleSetVersion: {
            include: { ruleSet: { select: { id: true, name: true, code: true } } },
          },
        },
        orderBy: { occurredAt: "desc" },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
    ]);

    const taskIds = [...new Set(rows.map((r) => r.taskId).filter((x): x is number => x != null))];
    const tasks =
      taskIds.length === 0
        ? []
        : await prisma.task.findMany({
            where: { id: { in: taskIds } },
            select: { id: true, title: true },
          });
    const taskMap = new Map(tasks.map((t) => [t.id, t.title]));

    const projectIds = [...new Set(rows.map((r) => r.projectId).filter((x): x is number => x != null))];
    const projects =
      projectIds.length === 0
        ? []
        : await prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true },
          });
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));

    const ownerIds = [
      ...new Set(rows.filter((r) => r.account?.ownerType === "USER").map((r) => r.account!.ownerId)),
    ];
    const users =
      ownerIds.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: { id: true, userName: true, nickName: true },
          });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const list = rows.map((e) => ({
      id: e.id.toString(),
      bizType: e.bizType,
      bizId: e.bizId,
      projectId: e.projectId,
      projectName: e.projectId != null ? projectMap.get(e.projectId) ?? null : null,
      taskId: e.taskId,
      taskTitle: e.taskId != null ? taskMap.get(e.taskId) ?? null : null,
      occurredAt: e.occurredAt,
      pointsType: e.pointsType,
      amount: e.amount,
      ownerUserId: e.account.ownerType === "USER" ? e.account.ownerId : null,
      ownerDisplayName:
        e.account.ownerType === "USER"
          ? (userMap.get(e.account.ownerId)?.nickName ||
              userMap.get(e.account.ownerId)?.userName ||
              null)
          : null,
      ruleSetVersionId: e.ruleSetVersionId,
      ruleSetName: e.ruleSetVersion?.ruleSet?.name ?? null,
      ruleSetCode: e.ruleSetVersion?.ruleSet?.code ?? null,
      ruleVersionNo: e.ruleSetVersion?.version ?? null,
      explain: e.explain,
    }));

    return {
      list,
      total,
      summary: { sumAmount: Number(agg._sum.amount ?? 0) },
    };
  }

  async ledgerDetail(entryIdStr: string, userId: number) {
    let id: bigint;
    try {
      id = BigInt(entryIdStr);
    } catch {
      throw Object.assign(new Error("无效的记录 ID"), { status: 400 });
    }
    const entry = await prisma.pointsLedgerEntry.findUnique({
      where: { id },
      include: {
        account: true,
        ruleSetVersion: { include: { ruleSet: true } },
      },
    });
    if (!entry) {
      throw Object.assign(new Error("记录不存在"), { status: 404 });
    }
    if (entry.projectId != null) {
      await projectService.assertUserCanAccessProject(userId, entry.projectId);
    }

    const ownerUser =
      entry.account.ownerType === "USER"
        ? await prisma.user.findUnique({
            where: { id: entry.account.ownerId },
            select: { id: true, userName: true, nickName: true },
          })
        : null;

    const task = entry.taskId
      ? await prisma.task.findUnique({
          where: { id: entry.taskId },
          select: { id: true, title: true },
        })
      : null;

    const project = entry.projectId
      ? await prisma.project.findUnique({
          where: { id: entry.projectId },
          select: { id: true, name: true },
        })
      : null;

    let settlement: any = null;
    if (["task_settlement", "adjustment", "reversal"].includes(entry.bizType)) {
      try {
        const sid = BigInt(entry.bizId);
        const s = await prisma.perfSettlement.findUnique({
          where: { id: sid },
          select: {
            id: true,
            settlementType: true,
            settlementKey: true,
            status: true,
            ruleSetVersionId: true,
            inputSnapshot: true,
            outputSnapshot: true,
            occurredAt: true,
            taskId: true,
            projectId: true,
            replacesSettlementId: true,
          },
        });
        settlement = s
          ? {
              ...s,
              id: s.id.toString(),
              replacesSettlementId: s.replacesSettlementId?.toString() ?? null,
            }
          : null;
      } catch {
        settlement = null;
      }
    }

    const ex: any = entry.explain ?? {};

    /** Prisma Json 可能为对象；若曾写入字符串或 rules 为 JSON 字符串则归一化 */
    const coerceRuleDefinition = (raw: unknown): any => {
      if (raw == null) return null;
      if (typeof raw === "string") {
        try {
          const p = JSON.parse(raw);
          return typeof p === "object" && p !== null ? p : null;
        } catch {
          return null;
        }
      }
      if (typeof raw !== "object") return null;
      const o = raw as Record<string, unknown>;
      if (typeof o.rules === "string") {
        try {
          const p = JSON.parse(o.rules);
          return typeof p === "object" && p !== null ? p : raw;
        } catch {
          return raw;
        }
      }
      return raw;
    };

    let def: any = coerceRuleDefinition(entry.ruleSetVersion?.definition ?? null);
    const settlementRsvId =
      settlement != null && (settlement as any).ruleSetVersionId != null
        ? Number((settlement as any).ruleSetVersionId)
        : null;

    if ((!def || !Array.isArray(def.rules)) && settlementRsvId != null) {
      const v = await prisma.ruleSetVersion.findUnique({
        where: { id: settlementRsvId },
        select: { definition: true },
      });
      const alt = coerceRuleDefinition(v?.definition ?? null);
      if (alt) def = alt;
    }

    if ((!def || !Array.isArray(def.rules)) && entry.ruleSetVersionId != null) {
      const v = await prisma.ruleSetVersion.findUnique({
        where: { id: entry.ruleSetVersionId },
        select: { definition: true },
      });
      const alt = coerceRuleDefinition(v?.definition ?? null);
      if (alt) def = alt;
    }

    const inputSnap = settlement?.inputSnapshot ?? null;
    let evaluation = def
      ? buildRuleEvaluationDetail(def, inputSnap ?? {}, {
          preferredRuleId: ex.ruleId ?? null,
        })
      : null;
    if (evaluation?.variableRows?.length) {
      const codes = [...new Set(evaluation.variableRows.map((r) => r.code))];
      const vr = await prisma.ruleVariable.findMany({
        where: { code: { in: codes } },
        select: { code: true, label: true },
      });
      const labelByCode = new Map(vr.map((v) => [v.code, (v.label ?? "").trim()]));
      evaluation = {
        ...evaluation,
        variableRows: evaluation.variableRows.map((r) => {
          const fromDb = labelByCode.get(r.code);
          const fromDef = (r.name ?? "").trim();
          return {
            ...r,
            name: fromDb || fromDef || "",
          };
        }),
      };
    }
    const recordedPostings =
      settlement?.outputSnapshot && typeof settlement.outputSnapshot === "object"
        ? ((settlement.outputSnapshot as any).postings as any[]) ?? []
        : [];

    let matchedRecordedPosting: any = null;
    for (const p of recordedPostings) {
      if (
        entry.account.ownerType === "USER" &&
        p?.subjectId === entry.account.ownerId &&
        p?.pointsType === entry.pointsType &&
        Number(p?.amount) === entry.amount &&
        (!ex.ruleId || p?.ruleId === ex.ruleId)
      ) {
        matchedRecordedPosting = p;
        break;
      }
    }
    if (!matchedRecordedPosting && recordedPostings.length) {
      matchedRecordedPosting =
        recordedPostings.find(
          (p) =>
            entry.account.ownerType === "USER" &&
            p?.subjectId === entry.account.ownerId &&
            p?.pointsType === entry.pointsType &&
            Number(p?.amount) === entry.amount,
        ) ?? null;
    }

    const taskFact = inputSnap && typeof inputSnap === "object" ? (inputSnap as any).task : null;
    const taskFactRows =
      taskFact && typeof taskFact === "object"
        ? await buildTaskFactRowsForLedger(taskFact as Record<string, unknown>)
        : [];

    return {
      entry: {
        id: entry.id.toString(),
        bizType: entry.bizType,
        bizId: entry.bizId,
        pointsType: entry.pointsType,
        amount: entry.amount,
        occurredAt: entry.occurredAt,
        createdAt: entry.createdAt,
        explain: entry.explain,
        idempotencyKey: entry.idempotencyKey,
      },
      ownerUser,
      task,
      project,
      ruleSetVersion: entry.ruleSetVersion
        ? {
            id: entry.ruleSetVersion.id,
            version: entry.ruleSetVersion.version,
            checksum: entry.ruleSetVersion.checksum,
            ruleSet: entry.ruleSetVersion.ruleSet
              ? {
                  id: entry.ruleSetVersion.ruleSet.id,
                  name: entry.ruleSetVersion.ruleSet.name,
                  code: entry.ruleSetVersion.ruleSet.code,
                }
              : null,
          }
        : null,
      settlement,
      evaluation,
      recordedPostings,
      matchedRecordedPosting,
      taskFactRows,
    };
  }
}

export const performanceService = new PerformanceService();
