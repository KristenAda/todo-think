import { Context } from "koa";
import authService from "./auth.service";
import { Result } from "@/core/result";

class AuthController {
  // 登录
  async login(ctx: Context) {
    const { userName, password } = ctx.request.body as any;
    const data = await authService.login(userName, password);
    ctx.body = Result.success(data, "登录成功");
  }

  // 注册
  async register(ctx: Context) {
    const data = ctx.request.body;
    const user = await authService.register(data);
    ctx.body = Result.success(user, "注册成功");
  }

  // 获取当前用户信息（含角色、权限），需要鉴权
  async info(ctx: Context) {
    const { id } = ctx.state.user;
    const data = await authService.getUserInfo(id);
    ctx.body = Result.success(data);
  }
}

export default new AuthController();
