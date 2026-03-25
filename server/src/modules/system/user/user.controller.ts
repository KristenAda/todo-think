import { Context } from "koa";
import userService from "./user.service";
import { Result } from "@/core/result";

class UserController {
  // GET /user/list
  async list(ctx: Context) {
    const {
      current = 1,
      size = 20,
      userName,
      userPhone,
      userEmail,
      status,
      deptId,
    } = ctx.query as any;

    const res = await userService.pageList(Number(current), Number(size), {
      userName,
      userPhone,
      userEmail,
      status,
      deptId,
    });

    ctx.body = Result.page(res.list, res.total, Number(current), Number(size));
  }

  // POST /user/add
  async add(ctx: Context) {
    const body = ctx.request.body as any;
    const data: any = {};
    const allowedFields = [
      "userName", "password", "nickName", "userPhone",
      "userEmail", "userGender", "avatar", "status", "remark", "deptId",
    ];
    allowedFields.forEach((f) => {
      if (body[f] !== undefined) data[f] = body[f];
    });
    if (!data.password) data.password = "123456";

    const res = await userService.add(data);

    if (Array.isArray(body.roleIds) && body.roleIds.length > 0) {
      await userService.assignRoles(res.id, body.roleIds);
    }

    ctx.body = Result.success(res);
  }

  // POST /user/update
  async update(ctx: Context) {
    const body = ctx.request.body as any;
    const id = body.id;
    const data: any = {};
    const allowedFields = [
      "userName", "password", "nickName", "userPhone",
      "userEmail", "userGender", "avatar", "status", "remark", "deptId",
    ];
    allowedFields.forEach((f) => {
      if (body[f] !== undefined) data[f] = body[f];
    });

    const res = await userService.update(id, data);

    if (Array.isArray(body.roleIds)) {
      await userService.assignRoles(id, body.roleIds);
    }

    ctx.body = Result.success(res);
  }

  // POST /user/delete
  async delete(ctx: Context) {
    const { id } = ctx.request.body as any;
    if (id === 1) return (ctx.body = Result.error("超级管理员无法删除"));
    await userService.delete(id);
    ctx.body = Result.success();
  }

  // POST /user/assignRoles
  async assignRoles(ctx: Context) {
    const { userId, roleIds } = ctx.request.body as any;
    if (!userId) return (ctx.body = Result.error("userId不能为空"));
    if (!Array.isArray(roleIds)) return (ctx.body = Result.error("roleIds格式错误"));
    const res = await userService.assignRoles(userId, roleIds);
    ctx.body = res;
  }

  // POST /user/roles
  async getRoles(ctx: Context) {
    const { userId } = ctx.request.body as any;
    if (!userId) return (ctx.body = Result.error("userId不能为空"));
    const res = await userService.getUserRoles(Number(userId));
    ctx.body = Result.success(res);
  }
}

export default new UserController();
