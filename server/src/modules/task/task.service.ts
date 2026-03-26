import prisma from '@/core/prisma';
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
} from './task.dto';

// 用户基础信息 select
const userSelect = {
  id: true,
  userName: true,
  nickName: true,
  avatar: true,
  userEmail: true,
};

// =====================================================================
// Project Service
// =====================================================================

class ProjectService {
  async page(dto: ProjectPageDtoType) {
    const { page, pageSize, name, status } = dto;
    const where: any = {};
    if (name) where.name = { contains: name };
    if (status) where.status = status;

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
          manager: { select: userSelect },
          _count: { select: { tasks: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);
    return { list, total };
  }

  async info(id: number) {
    if (!id || isNaN(id)) return null;
    return prisma.project.findFirst({
      where: { id, deletedAt: null },
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
        select: userSelect,
        orderBy: { id: 'asc' },
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
      const ancestorIds = dept.ancestors.split(',').map((s) => s.trim()).filter(Boolean);
      if (ancestorIds.some((aid) => myDeptIdSet.has(aid))) relatedDeptIds.add(dept.id);
    }

    const memberRows = await prisma.deptMember.findMany({
      where: { deptId: { in: Array.from(relatedDeptIds) } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const memberUserIds = memberRows.map((r) => r.userId);
    if (!memberUserIds.includes(currentUserId)) memberUserIds.push(currentUserId);

    return prisma.user.findMany({
      where: { id: { in: memberUserIds }, deletedAt: null },
      select: userSelect,
      orderBy: { id: 'asc' },
    });
  }

  async create(dto: CreateProjectDtoType) {
    return prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        managerId: dto.managerId,
        status: dto.status ?? 'ACTIVE',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async update(id: number, dto: UpdateProjectDtoType) {
    return prisma.project.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async delete(id: number) {
    return prisma.project.delete({ where: { id } });
  }

  async list() {
    return prisma.project.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'desc' },
      select: { id: true, name: true, status: true },
    });
  }
}

export const projectService = new ProjectService();

// =====================================================================
// Task Service
// =====================================================================

class TaskService {
  async page(dto: TaskPageDtoType) {
    const { page, pageSize, projectId, status, mainAssigneeId, keyword } = dto;
    const where: any = {};
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
        orderBy: { id: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
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

  async info(id: number) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        manager: { select: userSelect },
        mainAssignee: { select: userSelect },
        tester: { select: userSelect },
        coAssignees: {
          include: { user: { select: userSelect } },
        },
        testCases: true,
        workLogs: {
          include: { user: { select: userSelect } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // 使用事务原子性创建任务（含协助人 + 测试用例）
  async create(dto: CreateTaskDtoType) {
    const { coAssigneeIds = [], testCases = [], ...taskData } = dto;

    return prisma.$transaction(async (tx) => {
      // 1. 创建任务主记录
      const task = await tx.task.create({
        data: {
          projectId: taskData.projectId,
          title: taskData.title,
          description: taskData.description,
          managerId: taskData.managerId,
          mainAssigneeId: taskData.mainAssigneeId,
          testerId: taskData.testerId,
          estimatedHours: taskData.estimatedHours,
          status: 'PENDING',
        },
      });

      // 2. 批量写入协助人中间表
      if (coAssigneeIds.length > 0) {
        await tx.taskCoAssignee.createMany({
          data: coAssigneeIds.map((userId) => ({ taskId: task.id, userId })),
          skipDuplicates: true,
        });
      }

      // 3. 批量创建测试用例
      if (testCases.length > 0) {
        await tx.testCase.createMany({
          data: testCases.map((tc) => ({
            taskId: task.id,
            description: tc.description,
            expectedResult: tc.expectedResult,
          })),
        });
      }

      return tx.task.findUnique({
        where: { id: task.id },
        include: {
          mainAssignee: { select: userSelect },
          coAssignees: { include: { user: { select: userSelect } } },
          testCases: true,
        },
      });
    });
  }

  // 更新任务（含协助人重置）
  async update(id: number, dto: UpdateTaskDtoType) {
    const { coAssigneeIds, ...taskData } = dto;

    return prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id },
        data: {
          ...(taskData.title !== undefined && { title: taskData.title }),
          ...(taskData.description !== undefined && { description: taskData.description }),
          ...(taskData.managerId !== undefined && { managerId: taskData.managerId }),
          ...(taskData.mainAssigneeId !== undefined && { mainAssigneeId: taskData.mainAssigneeId }),
          ...(taskData.testerId !== undefined && { testerId: taskData.testerId }),
          ...(taskData.estimatedHours !== undefined && { estimatedHours: taskData.estimatedHours }),
          ...(taskData.status !== undefined && { status: taskData.status }),
        },
      });

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

      return task;
    });
  }

  async delete(id: number) {
    return prisma.task.delete({ where: { id } });
  }

  // 开始开发（主负责人或协助人将 PENDING → IN_PROGRESS）
  async startWork(taskId: number, userId: number) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { coAssignees: true },
    });
    if (!task) throw { status: 404, message: '任务不存在' };

    const isMainAssignee = task.mainAssigneeId === userId;
    const isCoAssignee = task.coAssignees.some((ca) => ca.userId === userId);
    if (!isMainAssignee && !isCoAssignee) {
      throw { status: 403, message: '无权限：仅任务负责人可开始开发' };
    }
    if (task.status !== 'PENDING' && task.status !== 'REJECTED') {
      throw { status: 400, message: `当前状态（${task.status}）无法开始开发` };
    }

    return prisma.task.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS' },
    });
  }

  // 填写工时（主负责人或协助人均可）
  async addWorkLog(taskId: number, userId: number, dto: CreateWorkLogDtoType) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { coAssignees: true },
    });
    if (!task) throw { status: 404, message: '任务不存在' };

    const isMainAssignee = task.mainAssigneeId === userId;
    const isCoAssignee = task.coAssignees.some((ca) => ca.userId === userId);
    if (!isMainAssignee && !isCoAssignee) {
      throw { status: 403, message: '无权限：仅任务负责人可填写工时' };
    }

    return prisma.workLog.create({
      data: { taskId, userId, hours: dto.hours, content: dto.content },
    });
  }

  // 提交测试验收（仅主负责人）
  async submitTest(taskId: number, userId: number, dto: SubmitTestDtoType) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { testCases: true },
    });
    if (!task) throw { status: 404, message: '任务不存在' };

    // 严格权限校验：仅主负责人
    if (task.mainAssigneeId !== userId) {
      throw { status: 403, message: '仅主要负责人才可提交验收' };
    }

    // 校验所有用例必须全部自测通过
    const allPassed = dto.testCaseResults.every((r) => r.selfTestStatus === 'PASSED');
    if (!allPassed) {
      throw { status: 400, message: '所有测试用例必须全部自测通过才能提交验收' };
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
        data: { status: 'QA_REVIEW' },
      });
    });
  }

  // QA 验收审核
  async qaAudit(taskId: number, userId: number, dto: QaAuditDtoType) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { testCases: true },
    });
    if (!task) throw { status: 404, message: '任务不存在' };

    // 权限校验：仅测试验收人
    if (task.testerId !== userId) {
      throw { status: 403, message: '无权限：仅测试验收人可进行 QA 审核' };
    }

    if (task.status !== 'QA_REVIEW') {
      throw { status: 400, message: '任务当前不在验收中状态' };
    }

    const hasFailure = dto.testCaseResults.some((r) => r.qaStatus === 'FAILED');

    return prisma.$transaction(async (tx) => {
      for (const r of dto.testCaseResults) {
        await tx.testCase.update({
          where: { id: r.id },
          data: {
            qaStatus: r.qaStatus,
            qaRemark: r.qaRemark,
            ...(r.qaStatus === 'FAILED' && { bugCount: { increment: 1 } }),
          },
        });
      }

      if (hasFailure) {
        // 有用例失败 → 打回
        return tx.task.update({
          where: { id: taskId },
          data: { status: 'REJECTED' },
        });
      } else {
        // 全部通过 → 完成，必须填写实际工时
        if (!dto.actualHours) {
          throw { status: 400, message: '验收通过时必须填写实际工时' };
        }
        return tx.task.update({
          where: { id: taskId },
          data: { status: 'COMPLETED', actualHours: dto.actualHours },
        });
      }
    });
  }
}

export const taskService = new TaskService();

// =====================================================================
// Performance Service
// =====================================================================

class PerformanceService {
  async stats(dto: PerformancePageDtoType) {
    const { page, pageSize, projectId } = dto;
    const where: any = { status: 'COMPLETED' };
    if (projectId) where.projectId = projectId;

    const completedTasks = await prisma.task.findMany({
      where,
      include: {
        mainAssignee: { select: { id: true, userName: true, nickName: true, avatar: true, userEmail: true } },
        testCases: true,
      },
    });

    // 按主负责人聚合
    const map = new Map<number, {
      user: any;
      totalTasks: number;
      totalActualHours: number;
      totalEstimatedHours: number;
      totalBugCount: number;
      firstPassCount: number;
    }>();

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
      firstPassRate: s.totalTasks > 0
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
