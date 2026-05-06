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

/**
 * 原地将树中的 Date 叶子转为本地时间字符串，避免深拷贝整棵响应树（大幅省内存与分配）。
 * 仅应在响应即将写出、且确认无其它代码再依赖 body 中 Date 类型时调用。
 */
function mutateDatesToLocalStrings(value: unknown, seen: WeakSet<object>): void {
  if (value === null || value === undefined) return;
  if (typeof value !== "object") return;
  if (seen.has(value as object)) return;
  seen.add(value as object);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const el = value[i];
      if (el instanceof Date) {
        value[i] = Number.isNaN(el.getTime())
          ? null
          : formatLocalDateTime(el);
      } else {
        mutateDatesToLocalStrings(el, seen);
      }
    }
    return;
  }

  const obj = value as Record<string, unknown>;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v instanceof Date) {
      obj[k] = Number.isNaN(v.getTime()) ? null : formatLocalDateTime(v);
    } else {
      mutateDatesToLocalStrings(v, seen);
    }
  }
}

/** 将响应体中所有 Date 格式化为本地时间字符串（原地修改，与旧行为对外一致） */
export function serializeDatesForJson<T>(value: T): T {
  if (value instanceof Date) {
    return (
      Number.isNaN(value.getTime()) ? null : formatLocalDateTime(value)
    ) as unknown as T;
  }
  mutateDatesToLocalStrings(value, new WeakSet());
  return value;
}
