// src/modules/system/user/user.controller.ts
import { Context } from "koa";
import userService from "./user.service";
import { Result } from "@/core/result";

class UserController {
  // POST /sys/user/list
  async list(ctx: Context) {
    const {
      page = 1,
      pageSize = 10,
      username,
      deptId,
    } = ctx.request.body as any;
    const res = await userService.pageList(page, pageSize, {
      username,
      deptId,
    });
    ctx.body = Result.page(res.list, res.total, page, pageSize);
  }

  // POST /sys/user/add
  async add(ctx: Context) {
    const data = ctx.request.body as any;
    try {
      // 默认密码
      if (!data.password) data.password = "123456";
      const res = await userService.add(data);
      ctx.body = Result.success(res);
    } catch (e: any) {
      if (e.code === "P2002") return (ctx.body = Result.error("用户名已存在"));
      throw e;
    }
  }

  // POST /sys/user/update
  async update(ctx: Context) {
    const { id, ...data } = ctx.request.body as any;
    const res = await userService.update(id, data);
    ctx.body = Result.success(res);
  }

  // POST /sys/user/delete
  async delete(ctx: Context) {
    const { id } = ctx.request.body as any;
    // 保护一下 admin 不能删
    if (id === 1) return (ctx.body = Result.error("超级管理员无法删除"));
    await userService.delete(id);
    ctx.body = Result.success();
  }

  // POST /sys/user/assignRoles
  async assignRoles(ctx: Context) {
    const { userId, roleIds } = ctx.request.body as any;
    const res = await userService.assignRoles(userId, roleIds);
    ctx.body = res;
  }
}

export default new UserController();
