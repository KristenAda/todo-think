/**
 * 与后端 WebSocket 推送的 `event` 字段对齐（仅列前端消费项）
 */
export const SocketEventEnum = {
  MESSAGE: 'message',
  POINTS_SETTLEMENT: 'points_settlement'
} as const;

export type SocketEvent = (typeof SocketEventEnum)[keyof typeof SocketEventEnum];
