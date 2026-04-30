import prisma from '@/core/prisma';
import { messageService } from '@/modules/message/message.service';

const REMINDER_EVENT_TYPE = 'OVERDUE_REMINDER';
const REMINDER_TITLE = '任务已逾期';

const ACTIVE_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'SELF_TESTING',
  'QA_REVIEW',
  'REJECTED',
  'PAUSED'
] as const;

function formatDueDate(d: Date) {
  return d.toLocaleString('zh-CN', { hour12: false });
}

let started = false;

export function startOverdueReminderJob() {
  if (started) return;
  started = true;

  // 每 30 分钟跑一次；真正的“是否已提醒过”由 TaskTimeline 做幂等控制
  const intervalMs = 30 * 60 * 1000;
  void runOnce();

  const timer = setInterval(() => {
    void runOnce();
  }, intervalMs);

  // 允许 Node 在无其他事件时退出（例如测试/脚本场景）
  timer.unref?.();
}

async function runOnce() {
  const now = new Date();

  // 避免扫描太老的历史任务，降低 DB 压力
  const scanCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: {
        not: null,
        lt: now,
        gte: scanCutoff
      },
      status: { in: ACTIVE_STATUSES as any }
    },
    select: {
      id: true,
      title: true,
      projectId: true,
      dueDate: true,
      mainAssigneeId: true,
      testerId: true,
      coAssignees: { select: { userId: true } },
      project: { select: { name: true } }
    }
  });

  if (!tasks.length) return;

  const taskIds = tasks.map((t) => t.id);

  const reminded = await prisma.taskTimeline.findMany({
    where: {
      taskId: { in: taskIds },
      eventType: REMINDER_EVENT_TYPE,
      createdAt: { gte: todayStart }
    },
    select: { taskId: true }
  });

  const remindedSet = new Set<number>(reminded.map((r) => r.taskId));

  // 批量顺序发送，避免瞬时推送风暴；失败不影响后续任务
  for (const task of tasks) {
    if (remindedSet.has(task.id)) continue;

    const due = task.dueDate ? new Date(task.dueDate) : null;
    const dueText = due ? formatDueDate(due) : '未知截止时间';
    const projectName = task.project?.name ?? '';

    // 1) 写入时间线：确保“每天每任务只提醒一次”
    await prisma.taskTimeline.create({
      data: {
        taskId: task.id,
        eventType: REMINDER_EVENT_TYPE,
        title: REMINDER_TITLE,
        content: `截止时间：${dueText}（项目：${projectName || '未命名'}）`,
        operatorId: null,
        fromStatus: null,
        toStatus: null,
        payload: { dueDate: due?.toISOString() ?? null }
      }
    });

    // 2) 站内消息：推给主负责人 + 验收人 + 协助人（排除操作者；Job 为系统消息，senderId=null）
    const receiverIds = new Set<number>();
    if (task.mainAssigneeId) receiverIds.add(task.mainAssigneeId);
    if (task.testerId) receiverIds.add(task.testerId);
    for (const ca of task.coAssignees ?? []) {
      if (ca.userId) receiverIds.add(ca.userId);
    }

    if (!receiverIds.size) continue;

    await Promise.allSettled(
      Array.from(receiverIds).map((receiverId) =>
        messageService.sendRealTimeMessage(
          {
            receiverId,
            messageType: 'TASK',
            title: REMINDER_TITLE,
            content: projectName
              ? `任务「${task.title}」已逾期，截止时间：${dueText}（项目：${projectName}）。请尽快处理。`
              : `任务「${task.title}」已逾期，截止时间：${dueText}。请尽快处理。`,
            extra: {
              biz: 'task',
              action: 'overdue',
              taskId: task.id,
              projectId: task.projectId,
              dueDate: due?.toISOString() ?? null
            }
          },
          null
        )
      )
    );
  }
}

