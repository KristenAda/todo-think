import { Context } from "koa";
import roleService from "./role.service";
import { Result } from "@/core/result";

class RoleController {
  // GET /role/list
  async list(ctx: Context) {
    const { current = 1, size = 20, roleName, roleCode, description, enabled } =
      ctx.query as any;

    const res = await roleService.pageList(Number(current), Number(size), {
      roleName,
      roleCode,
      description,
      enabled: enabled !== undefined ? enabled === "true" : undefined,
    });

    const mappedList = res.list.map((item: any) => ({
      ...item,
      roleId: item.id,
    }));

    ctx.body = Result.page(mappedList, res.total, Number(current), Number(size));
  }

  // POST /role/add
  async add(ctx: Context) {
    const data = ctx.request.body as any;
    if (!data.roleName) return (ctx.body = Result.error("角色名称不能为空"));
    if (!data.roleCode) return (ctx.body = Result.error("角色编码不能为空"));
    const res = await roleService.add(data);
    ctx.body = Result.success(res);
  }

  // POST /role/update
  async update(ctx: Context) {
    const data = ctx.request.body as any;
    if (!data.id) return (ctx.body = Result.error("ID不能为空"));
    const res = await roleService.update(data.id, data);
    ctx.body = Result.success(res);
  }

  // POST /role/delete
  async delete(ctx: Context) {
    const { id } = ctx.request.body as any;
    if (!id) return (ctx.body = Result.error("ID不能为空"));
    await roleService.delete(id);
    ctx.body = Result.success(null, "删除成功");
  }

  // POST /role/assignMenus
  async assignMenus(ctx: Context) {
    const { roleId, menuIds } = ctx.request.body as any;
    if (!roleId || !Array.isArray(menuIds))
      return (ctx.body = Result.error("参数错误"));
    const res = await roleService.updateMenus(roleId, menuIds);
    ctx.body = res;
  }

  // POST /role/getMenus
  async getMenus(ctx: Context) {
    const { roleId } = ctx.request.body as any;
    if (!roleId) return (ctx.body = Result.error("roleId不能为空"));
    const res = await roleService.getMenuIdsByRoleId(roleId);
    ctx.body = res;
  }

  // POST /role/updateDataScope
  async updateDataScope(ctx: Context) {
    const { roleId, dataScope, deptIds = [] } = ctx.request.body as any;
    if (!roleId) return (ctx.body = Result.error("roleId不能为空"));
    if (dataScope === undefined) return (ctx.body = Result.error("dataScope不能为空"));
    const res = await roleService.updateDataScope(roleId, dataScope, deptIds);
    ctx.body = res;
  }
}

export default new RoleController();
