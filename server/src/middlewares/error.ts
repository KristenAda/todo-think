import { Context, Next } from "koa";
import logger from "@/core/logger";

/** Prisma 已知错误码映射为可读提示 */
const PRISMA_ERROR_MAP: Record<string, string> = {
  P2002: "数据已存在，违反唯一约束",
  P2025: "记录不存在或已被删除",
  P2003: "外键约束失败，关联数据不存在",
  P2014: "关联数据冲突",
};

/**
 * 全局错误处理中间件
 * 捕获所有未处理异常，写入 error 日志（含堆栈）并返回统一响应
 */
export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err: unknown) {
    const error = err as Error & {
      status?: number;
      code?: string;
      originalError?: Error;
    };

    // 401 鉴权失败
    if (error.status === 401) {
      const reason = error.originalError?.message ?? error.message;
      logger.warn(`鉴权失败 [${ctx.method} ${ctx.url}] ${reason}`);
      ctx.status = 401;
      ctx.body = { code: 401, message: "身份验证失败" };
      return;
    }

    // Prisma 业务错误（4xx，不需要打堆栈）
    if (error.code && PRISMA_ERROR_MAP[error.code]) {
      const message = PRISMA_ERROR_MAP[error.code];
      logger.warn(`Prisma错误 [${ctx.method} ${ctx.url}] ${error.code} - ${message}`);
      ctx.status = 400;
      ctx.body = { code: 400, message };
      return;
    }

    // 其他异常（500，打完整堆栈）
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
