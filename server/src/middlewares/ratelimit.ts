import { Context, Next } from "koa";
// koa-ratelimit 无官方类型声明，使用 require 引入
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ratelimit = require("koa-ratelimit");

/**
 * 登录接口限流：同一 IP 每 15 分钟最多尝试 10 次
 * 超出后返回 429，并告知剩余等待时间
 */
export const loginRateLimit = ratelimit({
  driver: "memory",
  db: new Map(),
  duration: 15 * 60 * 1000, // 15 分钟窗口
  max: 10,                   // 最多 10 次
  id: (ctx: Context) => ctx.ip, // 按 IP 计数
  errorMessage: "登录尝试过于频繁，请 15 分钟后再试",
  headers: {
    remaining: "Rate-Limit-Remaining",
    reset: "Rate-Limit-Reset",
    total: "Rate-Limit-Total",
  },
  // 自定义 429 响应体，符合项目统一格式
  throw: false,
}) as (ctx: Context, next: Next) => Promise<void>;
