import { Context, Next } from "koa";
import logger from "@/core/logger";

/**
 * 全局错误处理中间件
 * 捕获所有未处理异常，写入 error 日志（含堆栈）并返回统一响应
 */
export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err: unknown) {
    const error = err as Error & { status?: number; originalError?: Error };

    // 401 鉴权失败
    if (error.status === 401) {
      const reason = error.originalError?.message ?? error.message;
      logger.warn(`鉴权失败 [${ctx.method} ${ctx.url}] ${reason}`);
      ctx.status = 401;
      ctx.body = { code: 401, message: "身份验证失败" };
      return;
    }

    // 其他异常
    const status = error.status ?? 500;
    const message = error.message ?? "服务器内部错误";

    logger.error(
      `未捕获异常 [${ctx.method} ${ctx.url}] status=${status} ${message}\n${error.stack ?? "（无堆栈）"}`,
    );

    ctx.status = status;
    ctx.body = {
      code: status,
      message: process.env.NODE_ENV === "production" ? "服务器内部错误" : message,
    };
  }
}
