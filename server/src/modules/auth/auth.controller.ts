import { Context } from "koa";
import authService from "./auth.service";
import { Result } from "@/core/result";

class AuthController {
  // 登录
  async login(ctx: Context) {
    const { username, password } = ctx.request.body as any;
    try {
      const data = await authService.login(username, password);
      ctx.body = Result.success(data, "登录成功");
    } catch (err: any) {
      ctx.body = Result.error(err.message, 401);
    }
  }

  // 注册 (为了方便测试先开放)
  async register(ctx: Context) {
    const data = ctx.request.body;
    try {
      const user = await authService.register(data);
      ctx.body = Result.success(user, "注册成功");
    } catch (err: any) {
      ctx.body = Result.error(err.message);
    }
  }

  // 获取当前用户信息 (需要鉴权)
  async info(ctx: Context) {
    // koa-jwt 会把解析后的 token 数据挂载在 ctx.state.user 上
    const user = ctx.state.user;
    ctx.body = Result.success(user);
  }
}

export default new AuthController();
