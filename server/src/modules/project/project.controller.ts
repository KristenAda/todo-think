import { Context } from 'koa';
import { Result } from '@/core/result';
import projectService from './project.service';
import { CreateProjectDto, UpdateProjectDto, ProjectPageDto } from './project.dto';

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

  async listAll(ctx: Context) {
    ctx.body = Result.success(await projectService.listAll());
  }

  // 获取当前用户所在组织及下级组织的成员（项目负责人候选人）
  async orgMembers(ctx: Context) {
    const currentUserId = (ctx.state as any).user?.id as number;
    if (!currentUserId) {
      ctx.status = 401;
      ctx.body = Result.error('未登录', 401);
      return;
    }
    ctx.body = Result.success(await projectService.getOrgMembers(currentUserId));
  }

  async info(ctx: Context) {
    const id = Number(ctx.params.id);
    const data = await projectService.info(id);
    if (!data) {
      ctx.status = 404;
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
    const data = await projectService.create(parsed.data);
    ctx.body = Result.success(data, '创建成功');
  }

  async update(ctx: Context) {
    const id = Number(ctx.params.id);
    const parsed = UpdateProjectDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? '参数错误');
      return;
    }
    const data = await projectService.update(id, parsed.data);
    ctx.body = Result.success(data, '更新成功');
  }

  async delete(ctx: Context) {
    const id = Number(ctx.params.id);
    await projectService.delete(id);
    ctx.body = Result.success(null, '删除成功');
  }
}

export default new ProjectController();
