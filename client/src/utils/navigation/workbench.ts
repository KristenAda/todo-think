/**
 * 跳转工作台并打开任务详情（站内消息、通知铃铛等）
 *
 * `Console` 来自动态菜单，无工作台菜单的用户路由中不存在该 name，需回退到静态 `/outside/workbench`。
 */
import { router } from '@/router';

export const OPEN_TASK_QUERY_KEY = 'openTaskId';

export async function pushWorkbenchOpenTask(taskId: number): Promise<void> {
  const q = { [OPEN_TASK_QUERY_KEY]: String(taskId) };
  if (router.hasRoute('Console')) {
    await router.push({ name: 'Console', query: q });
  } else {
    await router.push({ name: 'OutsideWorkbench', query: q });
  }
}
