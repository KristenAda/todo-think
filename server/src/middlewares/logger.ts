import { Context, Next } from "koa";
import logger from "@/core/logger";

/** 安全序列化为单行 JSON，超过 2KB 截断 */
function safeJson(value: unknown): string {
  if (value === null || value === undefined) return "null";
  try {
    const str = JSON.stringify(value);
    return str.length > 2048 ? `[过大已截断,长度${str.length}]` : str;
  } catch {
    return "[无法序列化]";
  }
}

/**
 * 请求日志中间件
 * 请求进入：记录 method、url、ip、body
 * 请求结束：记录 status、耗时
 */
export async function requestLogger(ctx: Context, next: Next) {
  const start = Date.now();
  const { method, url, ip } = ctx;
  const body = (ctx.request as { body?: unknown }).body;

  logger.info(`→ ${method} ${url} ip=${ip} body=${safeJson(body)}`);

  await next();

  const duration = Date.now() - start;
  const status = ctx.status;
  const msg = `← ${method} ${url} ${status} ${duration}ms`;

  if (status >= 500) {
    logger.error(msg);
  } else if (status >= 400) {
    logger.warn(msg);
  } else {
    logger.info(msg);
  }
}
