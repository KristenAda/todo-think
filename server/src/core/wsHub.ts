import type WebSocket from "ws";

/**
 * WS 连接中心：
 * - 维护 userId -> WebSocket 的全局映射
 * - 统一封装推送与连接回收逻辑，避免各模块重复实现
 */

export const onlineWsByUserId = new Map<number, WebSocket>();

/** 绑定（或替换）某个用户的连接 */
export function bindUserSocket(userId: number, ws: WebSocket) {
  const old = onlineWsByUserId.get(userId);
  if (old && old !== ws) {
    try {
      old.close(1000, "Replaced by new connection");
    } catch {}
  }
  onlineWsByUserId.set(userId, ws);
}

/** 解绑连接（仅当当前连接仍是该用户的活跃连接时才删除） */
export function unbindUserSocket(userId: number, ws: WebSocket) {
  const current = onlineWsByUserId.get(userId);
  if (current === ws) {
    onlineWsByUserId.delete(userId);
  }
}

/** 判断用户是否在线 */
export function isUserOnline(userId: number): boolean {
  return onlineWsByUserId.has(userId);
}

/** 向指定用户推送 JSON（用户离线或推送失败时返回 false） */
export function pushJsonToUser(userId: number, payload: unknown): boolean {
  const ws = onlineWsByUserId.get(userId);
  if (!ws) return false;
  try {
    ws.send(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

