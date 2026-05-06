import type { Context, Next } from "koa";
import { Readable } from "stream";
import { serializeDatesForJson } from "@/core/json.serialize";

/**
 * 在响应写出前统一把 body 中的 Date 转为 YYYY-MM-DD HH:mm:ss（原地改写，避免整树深拷贝）。
 * 需注册在路由之前（作为最外层），以便在 await next() 之后最后执行。
 */
export async function responseDateFormat(ctx: Context, next: Next): Promise<void> {
  await next();
  const b = ctx.body;
  if (b == null) return;
  if (typeof b !== "object") return;
  if (Buffer.isBuffer(b)) return;
  if (b instanceof Readable) return;
  ctx.body = serializeDatesForJson(b);
}
