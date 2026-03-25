import prisma from '@/core/prisma';

class DashboardService {
  /**
   * 获取当前登录员工的工作台聚合数据
   */
  async workbench(userId: number) {
    // 本月起始时间
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 协助人任务 ID（用于复用）
    const coAssigneeRows = await prisma.taskCoAssignee.findMany({
      where: { userId },
      select: { taskId: true },
    });
    const coAssigneeTaskIds = coAssigneeRows.map((r) => r.taskId);

    // 并发查询所有数据
    const [
      pendingCount,
      qaCount,
      completedCount,
      bugCount,
      pendingTasks,
      qaTasks,
      processedTasks,
    ] = await Promise.all([
      // 1. 待处理任务数（主责或协助，状态 PENDING/IN_PROGRESS/REJECTED）
      prisma.task.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS', 'SELF_TESTING', 'REJECTED'] },
          OR: [
            { mainAssigneeId: userId },
            { managerId: userId },
            { id: { in: coAssigneeTaskIds } },
          ],
        },
      }),

      // 2. 待验收任务数（当前用户为测试人，状态 QA_REVIEW）
      prisma.task.count({
        where: {
          testerId: userId,
          status: 'QA_REVIEW',
        },
      }),

      // 3. 本月已完成任务数
      prisma.task.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: monthStart, lte: monthEnd },
          OR: [
            { mainAssigneeId: userId },
            { testerId: userId },
            { id: { in: coAssigneeTaskIds } },
          ],
        },
      }),

      // 4. Bug 数：该用户名下 TestCase 被打回的 FAILED 累计数
      prisma.testCase.aggregate({
        where: {
          task: {
            OR: [
              { mainAssigneeId: userId },
              { id: { in: coAssigneeTaskIds } },
            ],
          },
          qaStatus: 'FAILED',
        },
        _sum: { bugCount: true },
      }),

      // 5. 待处理任务列表（前 10 条，含项目信息）
      prisma.task.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS', 'SELF_TESTING', 'REJECTED'] },
          OR: [
            { mainAssigneeId: userId },
            { managerId: userId },
            { id: { in: coAssigneeTaskIds } },
          ],
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 10,
        include: {
          project: { select: { id: true, name: true } },
          mainAssignee: { select: { id: true, userName: true, nickName: true, avatar: true } },
        },
      }),

      // 6. 待验收任务列表（前 10 条）
      prisma.task.findMany({
        where: {
          testerId: userId,
          status: 'QA_REVIEW',
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          project: { select: { id: true, name: true } },
          mainAssignee: { select: { id: true, userName: true, nickName: true, avatar: true } },
        },
      }),

      // 7. 已处理/最近完成任务列表（前 10 条）
      prisma.task.findMany({
        where: {
          status: 'COMPLETED',
          OR: [
            { mainAssigneeId: userId },
            { testerId: userId },
            { id: { in: coAssigneeTaskIds } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          project: { select: { id: true, name: true } },
          mainAssignee: { select: { id: true, userName: true, nickName: true, avatar: true } },
        },
      }),
    ]);

    return {
      stats: {
        pendingCount,
        qaCount,
        completedCount,
        bugCount: bugCount._sum.bugCount ?? 0,
      },
      pendingTasks,
      qaTasks,
      processedTasks,
    };
  }
}

export default new DashboardService();
