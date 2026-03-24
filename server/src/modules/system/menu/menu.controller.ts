import { Context } from "koa";
import menuService from "./menu.service";
import { Result } from "@/core/result";

class MenuController {
  // GET /api/menu/list — 完整菜单树（管理端），支持 title 筛选
  async list(ctx: Context) {
    const { title } = ctx.query as any;
    const res = await menuService.listAll(title);
    ctx.body = res;
  }

  // GET /api/menu/tree — 当前用户的导航菜单树（动态路由专用）
  async tree(ctx: Context) {
    const { id } = ctx.state.user;
    const res = await menuService.getUserMenus(id);
    ctx.body = res;
  }

  // POST /api/menu/add
  async add(ctx: Context) {
    const data = ctx.request.body as any;
    if (!data.title) return (ctx.body = Result.error("菜单名称不能为空"));
    
    // 将 roles 和 authList 转换为 JSON 字符串
    if (data.roles && Array.isArray(data.roles)) {
      data.roles = JSON.stringify(data.roles);
    }
    if (data.authList && Array.isArray(data.authList)) {
      data.authList = JSON.stringify(data.authList);
    }
    
    const res = await menuService.add(data);
    ctx.body = Result.success(res);
  }

  // POST /api/menu/update
  async update(ctx: Context) {
    const { id, ...data } = ctx.request.body as any;
    if (!id) return (ctx.body = Result.error("ID不能为空"));
    
    // 将 roles 和 authList 转换为 JSON 字符串
    if (data.roles && Array.isArray(data.roles)) {
      data.roles = JSON.stringify(data.roles);
    }
    if (data.authList && Array.isArray(data.authList)) {
      data.authList = JSON.stringify(data.authList);
    }
    
    const res = await menuService.update(id, data);
    ctx.body = Result.success(res);
  }

  // POST /api/menu/delete
  async delete(ctx: Context) {
    const { id } = ctx.request.body as any;
    if (!id) return (ctx.body = Result.error("ID不能为空"));
    
    // 检查是否有子菜单
    const hasChildren = await (menuService as any).model.findFirst({
      where: { parentId: id },
    });
    if (hasChildren) return (ctx.body = Result.error("存在子菜单，请先删除子菜单"));
    
    await menuService.delete(id);
    ctx.body = Result.success(null, "删除成功");
  }
}

export default new MenuController();
