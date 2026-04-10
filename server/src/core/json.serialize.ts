/**
 * 将响应体中的 Date 转为本地时间字符串 YYYY-MM-DD HH:mm:ss，
 * 避免 JSON 序列化默认输出 ISO-8601（带 Z）格式。
 */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatLocalDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function walk(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return formatLocalDateTime(value);
  }
  if (typeof value !== "object") return value;
  if (seen.has(value as object)) return value;
  seen.add(value as object);
  if (Array.isArray(value)) {
    return value.map((v) => walk(v, seen));
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    out[k] = walk(obj[k], seen);
  }
  return out;
}

/** 深拷贝式地将所有 Date 字段格式化为本地时间字符串 */
export function serializeDatesForJson<T>(value: T): T {
  return walk(value, new WeakSet()) as T;
}
