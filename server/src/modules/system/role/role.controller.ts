import { Context } from "koa";
import roleService from "./role.service";
import { Result } from "@/core/result";

class RoleController {
  // 接口：/sys/role/list
  async list(ctx: Context) {
    const { page = 1, pageSize = 10, name } = ctx.request.body as any;
    const res = await roleService.pageList(page, pageSize, { name });
    ctx.body = Result.page(res.list, res.total, page, pageSize);
  }

  // 接口：/sys/role/add
  async add(ctx: Context) {
    const data = ctx.request.body as any;
    if (!data.name) return (ctx.body = Result.error("角色编码不能为空"));

    try {
      const res = await roleService.add(data);
      ctx.body = Result.success(res);
    } catch (e: any) {
      // 处理唯一索引冲突
      if (e.code === "P2002")
        return (ctx.body = Result.error("角色编码已存在"));
      throw e;
    }
  }

  // 接口：/sys/role/update
  async update(ctx: Context) {
    const data = ctx.request.body as any;
    // ID 必须传
    if (!data.id) return (ctx.body = Result.error("ID不能为空"));

    const res = await roleService.update(data.id, data);
    ctx.body = Result.success(res);
  }

  // 接口：/sys/role/delete
  async delete(ctx: Context) {
    const { id } = ctx.request.body as any; // ID 从 body 拿
    if (!id) return (ctx.body = Result.error("ID不能为空"));

    await roleService.delete(id);
    ctx.body = Result.success(null, "删除成功");
  }

  // 接口：/sys/role/assignPerms (分配权限)
  async assignPerms(ctx: Context) {
    const { roleId, menuIds } = ctx.request.body as any;
    if (!roleId || !Array.isArray(menuIds)) {
      return (ctx.body = Result.error("参数错误"));
    }
    const res = await roleService.updateMenus(roleId, menuIds);
    ctx.body = res;
  }

  // 接口：/sys/role/getPerms (获取权限回显)
  async getPerms(ctx: Context) {
    const { roleId } = ctx.request.body as any;
    const res = await roleService.getMenuIdsByRoleId(roleId);
    ctx.body = res;
  }
}

export default new RoleController();
