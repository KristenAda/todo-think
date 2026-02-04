// src/modules/system/menu/menu.controller.ts
import { Context } from "koa";
import menuService from "./menu.service";
import { Result } from "@/core/result";

class MenuController {
  // POST /sys/menu/list (获取树)
  async list(ctx: Context) {
    const res = await menuService.listAll();
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

    await menuService.delete(id);
    ctx.body = Result.success(null, "删除成功");
  }
}

export default new MenuController();
