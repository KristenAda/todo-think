import { Context } from "koa";
import { Result } from "@/core/result";
import organizationService from "./organization.service";
import { AddManagersDto, AddMembersDto } from "./organization.dto";

function currentUserId(ctx: Context): number {
  return (ctx.state as any).user?.id as number;
}
function isSuperAdmin(ctx: Context): boolean {
  const result = (ctx.state as any).user?.roles ?? [];
  return result.includes("R_SUPER") || result.includes("R_ADMIN");
}

class OrganizationController {
  async getTree(ctx: Context) {
    ctx.body = Result.success(await organizationService.getTree());
  }

  async getAllUsers(ctx: Context) {
    ctx.body = Result.success(await organizationService.getAllUsers());
  }

  async getManagers(ctx: Context) {
    const deptId = Number(ctx.params.id);
    ctx.body = Result.success(await organizationService.getManagers(deptId));
  }

  async addManagers(ctx: Context) {
    if (!isSuperAdmin(ctx)) {
      ctx.status = 403;
      ctx.body = Result.error("无权限：仅超级管理员可添加管理者", 403);
      return;
    }
    const deptId = Number(ctx.params.id);
    const parsed = AddManagersDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? "参数错误");
      return;
    }
    await organizationService.addManagers(deptId, parsed.data.userIds);
    ctx.body = Result.success(null, "添加管理者成功");
  }

  async removeManager(ctx: Context) {
    if (!isSuperAdmin(ctx)) {
      ctx.status = 403;
      ctx.body = Result.error("无权限：仅超级管理员可移除管理者", 403);
      return;
    }
    const deptId = Number(ctx.params.id);
    const userId = Number(ctx.params.userId);
    await organizationService.removeManager(deptId, userId);
    ctx.body = Result.success(null, "已移除管理者");
  }

  async getMembers(ctx: Context) {
    const deptId = Number(ctx.params.id);
    ctx.body = Result.success(await organizationService.getMembers(deptId));
  }

  async addMembers(ctx: Context) {
    const deptId = Number(ctx.params.id);
    const uid = currentUserId(ctx);
    const ok =
      isSuperAdmin(ctx) || (await organizationService.isManager(deptId, uid));
    if (!ok) {
      ctx.status = 403;
      ctx.body = Result.error("无权限：您不是该部门的管理者", 403);
      return;
    }
    const parsed = AddMembersDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.errors[0]?.message ?? "参数错误");
      return;
    }
    await organizationService.addMembers(deptId, parsed.data.userIds);
    ctx.body = Result.success(null, "添加成员成功");
  }

  async removeMember(ctx: Context) {
    const deptId = Number(ctx.params.id);
    const uid = currentUserId(ctx);
    const ok =
      isSuperAdmin(ctx) || (await organizationService.isManager(deptId, uid));
    if (!ok) {
      ctx.status = 403;
      ctx.body = Result.error("无权限：您不是该部门的管理者", 403);
      return;
    }
    const userId = Number(ctx.params.userId);
    await organizationService.removeMember(deptId, userId);
    ctx.body = Result.success(null, "已移除成员");
  }
}

export default new OrganizationController();
