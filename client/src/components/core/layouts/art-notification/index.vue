<!-- 通知组件 -->
<template>
  <div
    class="art-notification-panel art-card-sm !shadow-xl"
    :style="{
      transform: show ? 'scaleY(1)' : 'scaleY(0.9)',
      opacity: show ? 1 : 0
    }"
    v-show="visible"
    @click.stop
  >
    <div class="flex-cb px-3.5 mt-3.5">
      <span class="text-base font-medium text-g-800">{{ $t('notice.title') }}</span>
      <span
        class="text-xs text-g-800 px-1.5 py-1 c-p select-none rounded hover:bg-g-200"
        @click="handleMarkAllRead"
      >
        {{ $t('notice.btnRead') }}
      </span>
    </div>

    <div class="w-full h-[calc(100%-55px)]">
      <div class="h-[calc(100%-60px)] overflow-y-scroll">
        <ul>
          <li
            v-for="(item, index) in mergedList"
            :key="item.key ?? index"
            class="box-border flex items-start px-3.5 py-3.5 c-p last:border-b-0 hover:bg-g-200/60"
            @click="handleItemClick(item)"
          >
            <div
              class="size-9 leading-9 text-center rounded-lg flex-cc shrink-0"
              :class="[getItemIconStyle(item).iconClass]"
            >
              <ArtSvgIcon class="text-lg !bg-transparent" :icon="getItemIconStyle(item).icon" />
            </div>

            <div class="w-[calc(100%-45px)] ml-3.5">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-normal leading-5.5 text-g-900 truncate">
                  {{ item.title }}
                </h4>
                <ElTag size="small" effect="light" :type="item.tagType" class="shrink-0">
                  {{ item.tagText }}
                </ElTag>

                <span
                  v-if="item.kind === 'message' && !item.isRead"
                  class="ml-auto size-1.5 !bg-danger rounded-full shrink-0"
                ></span>
              </div>
              <p class="mt-1.5 text-xs text-g-500 line-clamp-2">
                {{ item.subTitle }}
              </p>
              <p class="mt-1 text-[11px] text-g-400">{{ item.time }}</p>
            </div>
          </li>
        </ul>

        <!-- 空状态 -->
        <div
          v-show="mergedList.length === 0"
          class="relative top-25 h-full text-g-500 text-center !bg-transparent"
        >
          <ArtSvgIcon icon="system-uicons:inbox" class="text-5xl" />
          <p class="mt-3.5 text-xs !bg-transparent">{{ $t('notice.text[0]') }}通知</p>
        </div>
      </div>

      <div class="relative box-border w-full px-3.5">
        <ElButton class="w-full mt-3" @click="handleViewAll" v-ripple>
          {{ $t('notice.viewAll') }}
        </ElButton>
      </div>
    </div>

    <div class="h-25"></div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { storeToRefs } from 'pinia';
  import { useMessageStore } from '@/store/modules/message';
  import { useRouter } from 'vue-router';
  import { pushWorkbenchOpenTask } from '@/utils/navigation';
  import { ElTag } from 'element-plus';

  defineOptions({ name: 'ArtNotification' });

  interface MessageItem {
    id?: number;
    title: string;
    time: string;
    isRead?: boolean;
    content?: string;
    messageType?: string;
    sender?: any;
    extra?: any;
  }
  type MergedKind = 'message';

  interface MergedItem {
    key: string;
    kind: MergedKind;
    id?: number;
    title: string;
    subTitle: string;
    time: string;
    isRead?: boolean;
    tagText: string;
    tagType: 'info' | 'success' | 'warning' | 'danger';
    iconType: 'task' | 'system' | 'direct';
    avatar?: string;
    messageType: 'TASK' | 'SYSTEM' | 'DIRECT' | string;
    extra?: any;
  }

  interface NoticeStyle {
    /** 图标 */
    icon: string;
    /** icon 样式 */
    iconClass: string;
  }

  useI18n();

  const props = defineProps<{
    value: boolean;
  }>();

  const emit = defineEmits<{
    'update:value': [value: boolean];
  }>();

  const show = ref(false);
  const visible = ref(false);
  const router = useRouter();

  const messageStore = useMessageStore();
  const { latestMessages } = storeToRefs(messageStore);

  // 样式管理
  const useNotificationStyles = () => {
    const getNoticeStyle = (type: 'task' | 'system' | 'direct'): NoticeStyle => {
      const defaultStyle: NoticeStyle = {
        icon: 'ri:arrow-right-circle-line',
        iconClass: 'bg-theme/12 text-theme'
      };

      if (type === 'task') {
        return { icon: 'ri:task-line', iconClass: 'bg-success/12 text-success' };
      }
      if (type === 'system') {
        return { icon: 'ri:notification-3-line', iconClass: 'bg-info/12 text-info' };
      }
      if (type === 'direct') {
        return { icon: 'ri:message-3-line', iconClass: 'bg-warning/12 text-warning' };
      }
      return defaultStyle;
    };

    return {
      getNoticeStyle
    };
  };

  // 动画管理
  const useNotificationAnimation = () => {
    const showNotice = (open: boolean) => {
      if (open) {
        visible.value = true;
        setTimeout(() => {
          show.value = true;
        }, 5);
      } else {
        show.value = false;
        setTimeout(() => {
          visible.value = false;
        }, 350);
      }
    };

    return {
      showNotice
    };
  };

  // 组合所有逻辑
  const { getNoticeStyle } = useNotificationStyles();
  const { showNotice } = useNotificationAnimation();

  /** 消息列表：绑定当前账号的站内消息（WS 实时推送 + 首次拉取） */
  const mergedList = computed<MergedItem[]>(() => {
    const list = (latestMessages.value ?? []) as MessageItem[];
    return list.map((m: any, idx: number) => {
      const mt = String(m?.messageType ?? '').toUpperCase();
      const iconType: MergedItem['iconType'] =
        mt === 'TASK' ? 'task' : mt === 'DIRECT' ? 'direct' : 'system';
      const tagText = mt === 'TASK' ? '任务' : mt === 'DIRECT' ? '私信' : '系统';
      const tagType: MergedItem['tagType'] =
        mt === 'TASK' ? 'success' : mt === 'DIRECT' ? 'warning' : 'info';

      return {
        key: `message_${m?.id ?? idx}_${m?.time ?? ''}`,
        kind: 'message',
        id: m?.id,
        title: m?.title ?? '新消息',
        subTitle: m?.content ?? '',
        time: m?.time ?? '',
        isRead: Boolean(m?.isRead),
        tagText,
        tagType,
        iconType,
        avatar: m?.sender?.avatar,
        messageType: mt,
        extra: m?.extra ?? undefined
      };
    });
  });

  const getItemIconStyle = (item: MergedItem) => {
    return getNoticeStyle(item.iconType);
  };

  const handleItemClick = async (item: MergedItem) => {
    if (!item.id) return;
    // 先标记已读（不阻断跳转/打开）
    if (!item.isRead) {
      try {
        await messageStore.markRead(item.id);
      } catch {
        // 标记已读失败时不阻断交互
      }
    }

    // TASK 类型消息：尝试根据 extra.taskId 定位任务抽屉
    const taskId = Number(item?.extra?.taskId);
    if (item.messageType === 'TASK' && taskId) {
      await pushWorkbenchOpenTask(taskId);
    }

    emit('update:value', false);
  };

  // 监听属性变化
  watch(
    () => props.value,
    (newValue) => {
      showNotice(newValue);
      // 打开面板时刷新一次，确保列表是最新的（不依赖 WS 时序）
      if (newValue) {
        messageStore.refreshLatestMessages();
        messageStore.refreshUnreadCount();
      }
    }
  );

  const handleMarkAllRead = async () => {
    await messageStore.markAllRead();
  };

  /** 点击“查看全部”统一跳转到站内消息中心 */
  const handleViewAll = () => {
    router.push({ name: 'MessageCenter' });
    emit('update:value', false);
  };
</script>

<style scoped>
  @reference '@styles/core/tailwind.css';

  .art-notification-panel {
    @apply absolute 
    top-14.5 
    right-5 
    w-90 
    h-125 
    overflow-hidden 
    transition-all 
    duration-300
    origin-top 
    will-change-[top,left] 
    max-[640px]:top-[65px]
    max-[640px]:right-0
    max-[640px]:w-full 
    max-[640px]:h-[80vh];
  }

</style>
