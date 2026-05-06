/**
 * 站内消息状态管理模块
 *
 * 设计要点：
 * - 仅负责“消息接收/未读数/列表缓存/已读标记”等核心状态
 * - WebSocket 只复用项目既有封装（utils/socket），此处不再重复封装
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ElNotification } from 'element-plus';
import {
  fetchMarkAllMessagesRead,
  fetchMarkMessageRead,
  fetchMessagePage,
  fetchUnreadMessageCount
} from '@/api/message';
import { formatDateTime } from '@/utils/date';

export interface RealtimeMessagePayload {
  event: string;
  data: any;
}

export const useMessageStore = defineStore('messageStore', () => {
  // 未读数量（由服务端权威计算 + 前端增量更新）
  const unreadCount = ref(0);

  // 最新消息列表（仅做顶部通知面板展示；真正列表页面可走分页接口）
  const latestMessages = ref<any[]>([]);

  const hasUnread = computed(() => unreadCount.value > 0);

  async function refreshUnreadCount() {
    unreadCount.value = await fetchUnreadMessageCount();
  }

  /**
   * 拉取最新消息列表（用于铃铛面板展示）
   * - 只拉第一页，避免面板请求过重
   */
  async function refreshLatestMessages() {
    const res: any = await fetchMessagePage({ page: 1, pageSize: 20 });
    const list = (res?.list ?? []) as any[];
    latestMessages.value = list.map((m) => ({
      id: m?.id,
      title: m?.title ?? '新消息',
      content: m?.content ?? '',
      time: formatTimeText(m?.createTime),
      messageType: m?.messageType,
      isRead: Boolean(m?.isRead),
      sender: m?.sender ?? null,
      extra: m?.extra ?? undefined
    }));
  }

  function formatTimeText(time: string | Date | undefined) {
    if (!time) return '';
    return formatDateTime(time);
  }

  function showRealtimeNotification(message: any) {
    // 交互：轻盈、平滑、企业级质感（柔和阴影 + 轻微位移）
    ElNotification({
      title: message?.title ?? '新消息',
      message: message?.content ?? '',
      type: 'info',
      duration: 4500,
      offset: 18,
      customClass: 'art-realtime-message-notification'
    });
  }

  function ingestRealtimeMessage(message: any) {
    // 只保留必要字段，避免面板渲染负担
    const normalized = {
      id: message?.id,
      title: message?.title ?? '新消息',
      content: message?.content ?? '',
      time: formatTimeText(message?.createTime),
      messageType: message?.messageType,
      isRead: Boolean(message?.isRead),
      sender: message?.sender ?? null,
      extra: message?.extra ?? undefined
    };

    latestMessages.value.unshift(normalized);
    if (latestMessages.value.length > 50) {
      latestMessages.value = latestMessages.value.slice(0, 50);
    }

    if (!normalized.isRead) {
      unreadCount.value += 1;
    }

    showRealtimeNotification(normalized);
  }

  /** WebSocket messageHandler：解析并分发实时消息 */
  function handleSocketMessage(event: MessageEvent) {
    try {
      const payload = JSON.parse(event.data) as RealtimeMessagePayload;
      if (payload?.event === 'message') {
        ingestRealtimeMessage(payload.data);
      }
    } catch {
      // 非 JSON（例如服务端 pong）或其它消息，忽略即可
    }
  }

  async function markRead(id: number) {
    const ok = await fetchMarkMessageRead(id);
    if (!ok) return false;

    const msg = latestMessages.value.find((m) => m.id === id);
    if (msg && !msg.isRead) {
      msg.isRead = true;
    }

    // 后端 ok=true 表示该消息从未读 -> 已读（即命中更新了 isRead=false 的记录）
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    return true;
  }

  async function markAllRead() {
    await fetchMarkAllMessagesRead();
    unreadCount.value = 0;
    latestMessages.value = latestMessages.value.map((m) => ({ ...m, isRead: true }));
  }

  return {
    unreadCount,
    latestMessages,
    hasUnread,
    refreshUnreadCount,
    refreshLatestMessages,
    handleSocketMessage,
    markRead,
    markAllRead
  };
});
