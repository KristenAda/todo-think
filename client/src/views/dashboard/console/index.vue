<template>
  <div class="workbench">
    <div class="workbench__welcome">
      <div class="welcome-left">
        <div class="welcome-avatar-wrap">
          <el-avatar :size="48" :src="userStore.info?.avatar || ''" class="welcome-avatar">
            <art-svg-icon icon="mdi:account" style="font-size: 24px" />
          </el-avatar>
          <div class="weather-badge">
            <art-svg-icon :icon="greetingIcon" />
          </div>
        </div>
        <div class="welcome-info">
          <div class="welcome-title">
            {{ greeting }}，<span class="welcome-name">{{ userName }}</span>
          </div>
          <div class="welcome-desc">
            <template v-if="loading">正在加载看板数据，请稍候...</template>
            <template v-else-if="stats.pendingCount > 0 || stats.qaCount > 0">
              今日待办：<strong class="text-warning">{{ stats.pendingCount }}</strong> 项待处理，
              <strong class="text-danger">{{ stats.qaCount }}</strong> 项待验收，请合理安排时间。
            </template>
            <template v-else>今天所有的任务都已处理完毕，享受轻松的时刻吧！</template>
          </div>
        </div>
      </div>

      <div class="welcome-right">
        <div class="welcome-date-widget">
          <div class="date-label"> <art-svg-icon icon="mdi:calendar-month-outline" /> 今天是 </div>
          <div class="date-value">{{ todayStr }}</div>
        </div>
      </div>
    </div>

    <div class="workbench__stats">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="stat-card"
        :class="`stat-card--${card.colorKey}`"
      >
        <div class="stat-card__body">
          <div class="stat-card__label">{{ card.label }}</div>
          <div class="stat-card__value">
            <span v-if="loading" class="stat-skeleton" />
            <span v-else class="stat-num">{{ stats[card.key] }}</span>
          </div>
          <div class="stat-card__desc">{{ card.desc }}</div>
        </div>
        <div class="stat-card__icon-wrap">
          <art-svg-icon :icon="card.icon" class="stat-card__icon" />
        </div>
      </div>
    </div>

    <div class="workbench__board">
      <div class="board-col">
        <div class="board-col__header">
          <div class="board-col__title">
            <span class="board-col__dot board-col__dot--pending" />
            <art-svg-icon icon="mdi:clipboard-text-clock" class="board-col__hicon" />
            <span>待处理任务</span>
          </div>
          <el-badge :value="pendingTasks.length" :max="99" type="warning" />
        </div>
        <div class="board-col__list" v-loading="loading">
          <div v-if="!loading && pendingTasks.length === 0" class="board-col__empty">
            <art-svg-icon icon="mdi:check-all" class="empty-icon empty-icon--ok" />
            <span>暂无待处理任务</span>
          </div>
          <div
            v-for="task in pendingTasks"
            :key="task.id"
            class="task-card task-card--clickable"
            @click="openDrawer(task.id)"
          >
            <div class="task-card__project">
              <art-svg-icon icon="mdi:folder-outline" class="task-card__proj-icon" />
              {{ task.project?.name }}
            </div>
            <div class="task-card__title">{{ task.title }}</div>
            <div class="task-card__footer">
              <el-tag :type="statusTag(task.status)" size="small" round>
                {{ statusLabel(task.status) }}
              </el-tag>
              <span class="task-card__time">{{ fromNow(task.updatedAt) }}</span>
              <span class="task-card__action">
                去处理
                <art-svg-icon icon="ri:arrow-right-line" class="action-icon" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="board-col">
        <div class="board-col__header">
          <div class="board-col__title">
            <span class="board-col__dot board-col__dot--qa" />
            <art-svg-icon icon="mdi:shield-check-outline" class="board-col__hicon" />
            <span>待验收任务</span>
          </div>
          <el-badge :value="qaTasks.length" :max="99" type="danger" />
        </div>
        <div class="board-col__list" v-loading="loading">
          <div v-if="!loading && qaTasks.length === 0" class="board-col__empty">
            <art-svg-icon icon="mdi:shield-check" class="empty-icon empty-icon--ok" />
            <span>暂无待验收任务</span>
          </div>
          <div
            v-for="task in qaTasks"
            :key="task.id"
            class="task-card task-card--clickable task-card--qa"
            @click="openDrawer(task.id)"
          >
            <div class="task-card__project">
              <art-svg-icon icon="mdi:folder-outline" class="task-card__proj-icon" />
              {{ task.project?.name }}
            </div>
            <div class="task-card__title">{{ task.title }}</div>
            <div class="task-card__footer">
              <el-tag type="warning" size="small" round>验收中</el-tag>
              <span class="task-card__time">{{ fromNow(task.updatedAt) }}</span>
              <span class="task-card__action">
                去验收
                <art-svg-icon icon="ri:arrow-right-line" class="action-icon" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="board-col">
        <div class="board-col__header">
          <div class="board-col__title">
            <span class="board-col__dot board-col__dot--done" />
            <art-svg-icon icon="mdi:check-circle-outline" class="board-col__hicon" />
            <span>最近完成</span>
          </div>
          <el-badge :value="processedTasks.length" :max="99" type="success" />
        </div>
        <div class="board-col__list" v-loading="loading">
          <div v-if="!loading && processedTasks.length === 0" class="board-col__empty">
            <art-svg-icon icon="mdi:inbox-outline" class="empty-icon" />
            <span>暂无已完成任务</span>
          </div>
          <div
            v-for="task in processedTasks"
            :key="task.id"
            class="task-card task-card--done task-card--clickable"
            @click="openDrawer(task.id)"
          >
            <div class="task-card__project">
              <art-svg-icon icon="mdi:folder-outline" class="task-card__proj-icon" />
              {{ task.project?.name }}
            </div>
            <div class="task-card__title">{{ task.title }}</div>
            <div class="task-card__footer">
              <el-tag type="success" size="small" round>已完成</el-tag>
              <span class="task-card__time">{{ fromNow(task.updatedAt) }}</span>
              <span class="task-card__action">
                查看
                <art-svg-icon icon="ri:arrow-right-line" class="action-icon" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <TaskDetailDrawer
      v-if="drawerTaskId !== null"
      v-model="drawerVisible"
      :taskId="drawerTaskId"
      @refresh="loadWorkbench"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { fetchWorkbench, type WorkbenchStats, type WorkbenchTask } from '@/api/dashboard';
  import { useUserStore } from '@/store/modules/user';
  // 根据你的实际路径引入任务详情组件
  import TaskDetailDrawer from '@/views/task/detail/TaskDetailDrawer.vue';

  defineOptions({ name: 'Console' });

  // ===== 用户信息 =====
  const userStore = useUserStore();
  const userName = computed(() => userStore.info?.userName || '同学');

  // ===== 动态问候语与天气图标 =====
  const greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 12) return '早安';
    if (h < 14) return '午安';
    if (h < 18) return '下午好';
    return '晚上好';
  });

  const greetingIcon = computed(() => {
    const h = new Date().getHours();
    if (h < 6) return 'mdi:weather-night';
    if (h < 12) return 'mdi:weather-sunset-up';
    if (h < 14) return 'mdi:weather-sunny';
    if (h < 18) return 'mdi:weather-sunset-down';
    return 'mdi:weather-night';
  });

  const todayStr = computed(() =>
    new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  );

  // ===== 统计与列表数据 =====
  const loading = ref(false);
  const stats = ref<WorkbenchStats>({
    pendingCount: 0,
    qaCount: 0,
    completedCount: 0,
    bugCount: 0
  });
  const pendingTasks = ref<WorkbenchTask[]>([]);
  const qaTasks = ref<WorkbenchTask[]>([]);
  const processedTasks = ref<WorkbenchTask[]>([]);

  const statCards = [
    {
      key: 'pendingCount' as keyof WorkbenchStats,
      colorKey: 'pending',
      label: '待处理',
      desc: '需要跟进的任务',
      icon: 'mdi:clipboard-text-clock'
    },
    {
      key: 'qaCount' as keyof WorkbenchStats,
      colorKey: 'qa',
      label: '待验收',
      desc: '等待你验收的任务',
      icon: 'mdi:shield-check-outline'
    },
    {
      key: 'completedCount' as keyof WorkbenchStats,
      colorKey: 'completed',
      label: '本月完成',
      desc: '本月已完成任务数',
      icon: 'mdi:check-circle-outline'
    },
    {
      key: 'bugCount' as keyof WorkbenchStats,
      colorKey: 'bug',
      label: 'Bug 数',
      desc: '累计被打回的缺陷',
      icon: 'mdi:bug-outline'
    }
  ];

  // ===== 加载工作台数据 =====
  async function loadWorkbench() {
    loading.value = true;
    try {
      // request 工具已自动解包 res.data.data，直接拿到 WorkbenchData
      const data = await fetchWorkbench();
      if (data) {
        stats.value = data.stats;
        pendingTasks.value = data.pendingTasks;
        qaTasks.value = data.qaTasks;
        processedTasks.value = data.processedTasks;
      }
    } catch {
      // 由拦截器统一处理错误提示
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => loadWorkbench());

  // ===== 抽屉控制 =====
  const drawerVisible = ref(false);
  const drawerTaskId = ref<number | null>(null);

  function openDrawer(taskId: number) {
    drawerTaskId.value = taskId;
    drawerVisible.value = true;
  }

  // ===== 工具函数 =====
  const STATUS_MAP: Record<string, { label: string; tag: string }> = {
    PENDING: { label: '待分配', tag: 'info' },
    IN_PROGRESS: { label: '开发中', tag: '' },
    SELF_TESTING: { label: '待提测', tag: 'warning' },
    QA_REVIEW: { label: '验收中', tag: 'warning' },
    REJECTED: { label: '打回修改', tag: 'danger' },
    COMPLETED: { label: '已完成', tag: 'success' }
  };

  function statusLabel(s: string) {
    return STATUS_MAP[s]?.label ?? s;
  }

  function statusTag(s: string) {
    return STATUS_MAP[s]?.tag ?? 'info';
  }

  function fromNow(dateStr: string) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} 天前`;
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }
</script>

<style scoped lang="scss">
  $bg: #f2f3f5;
  $card-radius: 12px;
  $card-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  $card-shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.1);
  $transition: 0.25s ease;
  $color-pending: #f59e0b;
  $color-qa: #ef4444;
  $color-completed: #10b981;
  $color-bug: #8b5cf6;

  /* ★ 占满高度、阻止外层滚动 */
  .workbench {
    padding: 16px;
    background: $bg;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  /* ★ 1. 纯净质感横幅 */
  .workbench__welcome {
    position: relative;
    background: #ffffff;
    border-radius: $card-radius;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
    border: 1px solid #ebeef5;
    flex-shrink: 0;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 400px;
      background: linear-gradient(90deg, transparent, rgba(var(--el-color-primary-rgb), 0.04));
      pointer-events: none;
    }

    .welcome-left {
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 1;
    }

    /* 头像与天气微章组合 */
    .welcome-avatar-wrap {
      position: relative;

      .welcome-avatar {
        border: 2px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      .weather-badge {
        position: absolute;
        bottom: -2px;
        right: -4px;
        background: #ffffff;
        border-radius: 50%;
        padding: 3px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        color: #f59e0b;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .welcome-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .welcome-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      letter-spacing: 0.5px;
    }

    .welcome-name {
      color: var(--el-color-primary);
    }

    .welcome-desc {
      font-size: 13px;
      color: #6b7280;

      strong {
        font-weight: 600;
        font-size: 14px;
        margin: 0 2px;
      }
      .text-warning {
        color: $color-pending;
      }
      .text-danger {
        color: $color-qa;
      }
    }

    /* 右侧虚线分割与日期组件 */
    .welcome-right {
      z-index: 1;
      padding-left: 24px;
      border-left: 1px dashed #e5e7eb;
    }

    .welcome-date-widget {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;

      .date-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #9ca3af;

        .art-svg-icon {
          font-size: 14px;
        }
      }

      .date-value {
        font-size: 15px;
        font-weight: 600;
        color: #374151;
        letter-spacing: 0.5px;
      }
    }
  }

  // ===== 统计卡片 =====
  .workbench__stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    flex-shrink: 0;
    @media (max-width: 1100px) {
      grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .stat-card {
    background: #fff;
    border-radius: $card-radius;
    box-shadow: $card-shadow;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition:
      transform $transition,
      box-shadow $transition;
    border-left: 4px solid transparent;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $card-shadow-hover;
    }
    &__body {
      flex: 1;
      min-width: 0;
    }
    &__label {
      font-size: 12px;
      color: #888;
      font-weight: 500;
      margin-bottom: 4px;
    }
    &__value {
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 4px;
    }
    &__desc {
      font-size: 11px;
      color: #bbb;
    }
    &__icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    &__icon {
      font-size: 24px;
    }

    &--pending {
      border-left-color: $color-pending;
      .stat-card__value {
        color: $color-pending;
      }
      .stat-card__icon-wrap {
        background: rgba($color-pending, 0.1);
        color: $color-pending;
      }
    }
    &--qa {
      border-left-color: $color-qa;
      .stat-card__value {
        color: $color-qa;
      }
      .stat-card__icon-wrap {
        background: rgba($color-qa, 0.1);
        color: $color-qa;
      }
    }
    &--completed {
      border-left-color: $color-completed;
      .stat-card__value {
        color: $color-completed;
      }
      .stat-card__icon-wrap {
        background: rgba($color-completed, 0.1);
        color: $color-completed;
      }
    }
    &--bug {
      border-left-color: $color-bug;
      .stat-card__value {
        color: $color-bug;
      }
      .stat-card__icon-wrap {
        background: rgba($color-bug, 0.1);
        color: $color-bug;
      }
    }
  }

  .stat-skeleton {
    display: inline-block;
    width: 40px;
    height: 28px;
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  // ===== 三列看板 =====
  .workbench__board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    align-items: start;
    flex: 1;
    min-height: 0;
    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }
  }

  .board-col {
    background: #fff;
    border-radius: $card-radius;
    box-shadow: $card-shadow;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #f0f0f0;
      flex-shrink: 0;
    }
    &__title {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    &__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      &--pending {
        background: $color-pending;
      }
      &--qa {
        background: $color-qa;
      }
      &--done {
        background: $color-completed;
      }
    }
    &__hicon {
      font-size: 17px;
      color: #666;
    }

    &__list {
      flex: 1;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: #dfdfdf;
        border-radius: 3px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
    }

    &__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 40px 0;
      color: #ccc;
      font-size: 13px;
      height: 100%;
    }
  }

  .empty-icon {
    font-size: 40px;
    color: #d0d0d0;
    &--ok {
      color: #a7f3d0;
    }
  }

  // ===== 任务卡片 =====
  .task-card {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    transition:
      transform $transition,
      box-shadow $transition,
      border-color $transition;

    &--clickable {
      cursor: pointer;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        border-color: #d0d0d0;
        .task-card__action {
          opacity: 1;
        }
      }
    }
    &--qa {
      border-left: 3px solid $color-qa;
    }
    &--done {
      opacity: 0.75;
      .task-card__title {
        color: #888;
        text-decoration: line-through;
        text-decoration-color: #ddd;
      }
    }

    &__project {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #aaa;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    &__proj-icon {
      font-size: 13px;
    }
    &__title {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    &__footer {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    &__time {
      font-size: 12px;
      color: #bbb;
      flex: 1;
    }
    &__action {
      font-size: 12px;
      color: var(--el-color-primary);
      font-weight: 500;
      opacity: 0;
      transition: opacity $transition;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 2px;

      .action-icon {
        font-size: 14px;
        transition: transform $transition;
      }

      &:hover .action-icon {
        transform: translateX(2px);
      }
    }
  }
</style>
