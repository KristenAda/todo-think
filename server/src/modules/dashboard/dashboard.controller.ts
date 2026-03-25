import { Context } from 'koa';
import { Result } from '@/core/result';
import dashboardService from './dashboard.service';

class DashboardController {
  /**
   * GET /dashboard/workbench
   * 获取当前登录员工的工作台聚合看板数据
   */
  async workbench(ctx: Context) {
    const userId = (ctx.state as any).user?.id as number;
    if (!userId) {
      ctx.status = 401;
      ctx.body = Result.error('未登录', 401);
      return;
    }
    const data = await dashboardService.workbench(userId);
    ctx.body = Result.success(data);
  }
}

export default new DashboardController();
