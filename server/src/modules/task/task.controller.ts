import { Context } from 'koa';
import { Result } from '@/core/result';
import { projectService, taskService, performanceService } from './task.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectPageDto,
  CreateTaskDto,
  UpdateTaskDto,
  TaskPageDto,
  CreateWorkLogDto,
  SubmitTestDto,
  QaAuditDto,
  PerformancePageDto,
} from './task.dto';

/** 从 JWT 中取当前用户 ID */
function currentUserId(ctx: Context): number {
  return (ctx.state as any).user?.id as number;
}

// ======================== Project Controller ========================

class ProjectController {
  async page(ctx: Context) {
    const parsed = ProjectPageDto.safeParse(ctx.query);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? '参数错误');
      return;
    }
    const { list, total } = await projectService.page(parsed.data);
    ctx.body = Result.page(list, total, parsed.data.page, parsed.data.pageSize);
  }

  async list(ctx: Context) {
    ctx.body = Result.success(await projectService.list());
  }

  async orgMembers(ctx: Context) {
    const uid = (ctx.state as any).user?.id as number;
    if (!uid) { ctx.status = 401; ctx.body = Result.error('未登录', 401); return; }
    ctx.body = Result.success(await projectService.orgMembers(uid));
  }

  async info(ctx: Context) {
    const id = Number(ctx.params.id);
    const data = await projectService.info(id);
    if (!data) {
      ctx.body = Result.error('项目不存在', 404);
      return;
    }
    ctx.body = Result.success(data);
  }

  async create(ctx: Context) {
    const parsed = CreateProjectDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? '参数错误');
      return;
    }
    ctx.body = Result.success(await projectService.create(parsed.data), '创建成功');
  }

  async update(ctx: Context) {
    const id = Number(ctx.params.id);
    const parsed = UpdateProjectDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? '参数错误');
      return;
    }
    ctx.body = Result.success(await projectService.update(id, parsed.data), '更新成功');
  }

  async delete(ctx: Context) {
    const id = Number(ctx.params.id);
    await projectService.delete(id);
    ctx.body = Result.success(null, '删除成功');
  }
}

export const projectController = new ProjectController();

// ======================== Task Controller ========================

class TaskController {
  async page(ctx: Context) {
    const parsed = TaskPageDto.safeParse(ctx.query);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? '参数错误');
      return;
    }
    const { list, total } = await taskService.page(parsed.data);
    ctx.body = Result.page(list, total, parsed.data.page, parsed.data.pageSize);
  }

  async info(ctx: Context) {
    const id = Number(ctx.params.id);
    const data = await taskService.info(id);
    if (!data) {
      ctx.body = Result.error('任务不存在', 404);
      return;
    }
    ctx.body = Result.success(data);
  }

  async create(ctx: Context) {
    const parsed = CreateTaskDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? '参数错误');
      return;
    }
    ctx.body = Result.success(await taskService.create(parsed.data), '创建成功');
  }

  async update(ctx: Context) {
    const id = Number(ctx.params.id);
    const parsed = UpdateTaskDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? '参数错误');
      return;
    }
    ctx.body = Result.success(await taskService.update(id, parsed.data), '更新成功');
  }

  async delete(ctx: Context) {
    const id = Number(ctx.params.id);
    await taskService.delete(id);
    ctx.body = Result.success(null, '删除成功');
  }

  async startWork(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    try {
      ctx.body = Result.success(await taskService.startWork(taskId, userId), '已开始开发');
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? '操作失败', e.status ?? 500);
    }
  }

  async addWorkLog(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    const parsed = CreateWorkLogDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? '参数错误');
      return;
    }
    try {
      ctx.body = Result.success(await taskService.addWorkLog(taskId, userId, parsed.data), '工时登记成功');
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? '操作失败', e.status ?? 500);
    }
  }

  async submitTest(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    const parsed = SubmitTestDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? '参数错误');
      return;
    }
    try {
      ctx.body = Result.success(await taskService.submitTest(taskId, userId, parsed.data), '已提交验收');
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? '操作失败', e.status ?? 500);
    }
  }

  async qaAudit(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    const parsed = QaAuditDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? '参数错误');
      return;
    }
    try {
      ctx.body = Result.success(await taskService.qaAudit(taskId, userId, parsed.data), '验收完成');
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? '操作失败', e.status ?? 500);
    }
  }
}

export const taskController = new TaskController();

// ======================== Performance Controller ========================

class PerformanceController {
  async stats(ctx: Context) {
    const parsed = PerformancePageDto.safeParse(ctx.query);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error?.errors?.[0]?.message ?? '参数错误');
      return;
    }
    const { list, total } = await performanceService.stats(parsed.data);
    ctx.body = Result.page(list, total, parsed.data.page, parsed.data.pageSize);
  }
}

export const performanceController = new PerformanceController();
