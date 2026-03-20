import { Context } from "koa";
import menuService from "./menu.service";
import { Result } from "@/core/result";

class MenuController {
  // POST /sys/menu/list — 完整菜单树（管理端），支持 title 筛选
  async list(ctx: Context) {
    const { title } = ctx.request.body as any;
    const res = await menuService.listAll(title);
    ctx.body = res;
  }

  // POST /sys/menu/tree — 当前用户的导航菜单树（动态路由专用）
  async tree(ctx: Context) {
    const { id } = ctx.state.user;
    const res = await menuService.getUserMenus(id);
    ctx.body = res;
  }

  // POST /sys/menu/add
  async add(ctx: Context) {
    const data = ctx.request.body as any;
    if (!data.title) return (ctx.body = Result.error("菜单名称不能为空"));
    const res = await menuService.add(data);
    ctx.body = Result.success(res);
  }

  // POST /sys/menu/update
  async update(ctx: Context) {
    const { id, ...data } = ctx.request.body as any;
    if (!id) return (ctx.body = Result.error("ID不能为空"));
    const res = await menuService.update(id, data);
    ctx.body = Result.success(res);
  }

  // POST /sys/menu/delete
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
