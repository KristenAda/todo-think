import { Context } from "koa";
import roleService from "./role.service";
import { Result } from "@/core/result";

class RoleController {
  // 接口：GET /role/list
  async list(ctx: Context) {
    const { current = 1, size = 20, roleName, roleCode, description, enabled } = ctx.query as any;
    
    const res = await roleService.pageList(Number(current), Number(size), {
      roleName,
      roleCode,
      description,
      enabled: enabled !== undefined ? enabled === 'true' : undefined,
    });
    
    // 将 id 映射为 roleId，与前端类型对齐
    const mappedList = res.list.map((item: any) => ({
      ...item,
      roleId: item.id,
    }));
    
    ctx.body = Result.page(mappedList, res.total, Number(current), Number(size));
  }

  // 接口：POST /api/role/add
  async add(ctx: Context) {
    const data = ctx.request.body as any;
    if (!data.roleName) return (ctx.body = Result.error("角色名称不能为空"));
    if (!data.roleCode) return (ctx.body = Result.error("角色编码不能为空"));

    try {
      const res = await roleService.add(data);
      ctx.body = Result.success(res);
    } catch (e: any) {
      // 处理唯一索引冲突
      if (e.code === "P2002") {
        const field = e.meta?.target?.[0];
        if (field === "roleCode") return (ctx.body = Result.error("角色编码已存在"));
        return (ctx.body = Result.error("角色信息已存在"));
      }
      throw e;
    }
  }

  // 接口：POST /api/role/update
  async update(ctx: Context) {
    const data = ctx.request.body as any;
    if (!data.id) return (ctx.body = Result.error("ID不能为空"));
    const res = await roleService.update(data.id, data);
    ctx.body = Result.success(res);
  }

  // 接口：POST /api/role/delete
  async delete(ctx: Context) {
    const { id } = ctx.request.body as any;
    if (!id) return (ctx.body = Result.error("ID不能为空"));
    await roleService.delete(id);
    ctx.body = Result.success(null, "删除成功");
  }

  // 接口：POST /api/role/assignMenus (分配菜单权限)
  async assignMenus(ctx: Context) {
    const { roleId, menuIds } = ctx.request.body as any;
    if (!roleId || !Array.isArray(menuIds)) {
      return (ctx.body = Result.error("参数错误"));
    }
    const res = await roleService.updateMenus(roleId, menuIds);
    ctx.body = res;
  }

  // 接口：POST /api/role/getMenus (获取菜单权限回显)
  async getMenus(ctx: Context) {
    const { roleId } = ctx.request.body as any;
    if (!roleId) return (ctx.body = Result.error("roleId不能为空"));
    const res = await roleService.getMenuIdsByRoleId(roleId);
    ctx.body = res;
  }

  // 接口：POST /api/role/updateDataScope (分配数据权限)
  async updateDataScope(ctx: Context) {
    const { roleId, dataScope, deptIds = [] } = ctx.request.body as any;
    if (!roleId) return (ctx.body = Result.error("roleId不能为空"));
    if (dataScope === undefined) return (ctx.body = Result.error("dataScope不能为空"));
    const res = await roleService.updateDataScope(roleId, dataScope, deptIds);
    ctx.body = res;
  }
}

export default new RoleController();
