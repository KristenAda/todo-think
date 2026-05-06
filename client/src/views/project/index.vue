<template>
  <div class="project-page">
    <div class="project-page__toolbar">
      <div class="toolbar__filters">
        <el-input
          v-model="query.name"
          placeholder="搜索项目名称..."
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix><art-svg-icon icon="mdi:magnify" /></template>
        </el-input>
        <el-select
          v-model="query.status"
          placeholder="全部状态"
          clearable
          style="width: 160px"
          @change="handleSearch"
        >
          <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value">
            <span class="status-option"
              ><art-svg-icon :icon="s.icon" :style="{ color: s.color }" />{{ s.label }}</span
            >
          </el-option>
        </el-select>
      </div>
      <el-button type="primary" class="toolbar__create-btn" @click="openCreateDialog">
        <art-svg-icon icon="mdi:plus-circle" style="margin-right: 6px" />新建项目
      </el-button>
    </div>

    <div class="project-page__content">
      <div v-if="loading" class="project-grid">
        <div v-for="n in 8" :key="n" class="project-card project-card--skeleton"
          ><el-skeleton :rows="4" animated
        /></div>
      </div>

      <div v-else-if="!projectList.length" class="empty-state">
        <art-svg-icon icon="mdi:folder-open-outline" class="empty-state__icon" />
        <p>暂无项目，点击「新建项目」开始</p>
      </div>

      <transition-group v-else name="card-list" tag="div" class="project-grid">
        <div
          v-for="proj in projectList"
          :key="proj.id"
          class="project-card"
          @mouseenter="hoveredId = proj.id"
          @mouseleave="hoveredId = null"
        >
          <div class="project-card__header">
            <div class="project-card__name">{{ proj.name }}</div>
            <div class="project-card__status">
              <el-tag
                class="project-card__status-tag"
                :color="getStatus(proj.status).bg"
                :style="{ color: getStatus(proj.status).color, border: 'none' }"
                size="small"
              >
                <art-svg-icon
                  :icon="getStatus(proj.status).icon"
                  style="margin-right: 3px; vertical-align: -2px"
                />
                {{ getStatus(proj.status).label }}
              </el-tag>
            </div>
          </div>
          <div class="project-card__progress">
            <el-progress
              :percentage="getProgressPercent(proj.status)"
              :show-text="false"
              :stroke-width="4"
              :color="PROJECT_PRIMARY"
            />
          </div>
          <div class="project-card__desc">{{ proj.description || '暂无描述' }}</div>
          <div class="project-card__meta">
            <div class="meta-item">
              <art-svg-icon icon="mdi:account-outline" class="meta-item__icon" />
              <span>{{ proj.manager.nickName || proj.manager.userName }}</span>
            </div>
            <div class="meta-item">
              <art-svg-icon icon="mdi:format-list-bulleted-square" class="meta-item__icon" />
              <span>{{ proj._count.tasks }} 个任务</span>
            </div>
            <div class="meta-item" v-if="proj.startDate || proj.endDate">
              <art-svg-icon icon="mdi:calendar-clock-outline" class="meta-item__icon" />
              <span>{{ formatProjectDate(proj.startDate) }} ~ {{ formatProjectDate(proj.endDate) }}</span>
            </div>
          </div>
          <div
            class="project-card__actions"
            :class="{ 'project-card__actions--visible': hoveredId === proj.id }"
          >
            <el-button link type="primary" @click.stop="openEditDialog(proj)">
              <art-svg-icon icon="mdi:pencil" style="margin-right: 3px" /> 编辑
            </el-button>
            <el-popconfirm title="确认删除该项目？" @confirm="handleDelete(proj.id)">
              <template #reference>
                <el-button link type="danger"
                  ><art-svg-icon icon="mdi:trash-can" style="margin-right: 3px" /> 删除</el-button
                >
              </template>
            </el-popconfirm>
          </div>
        </div>
      </transition-group>
    </div>

    <div class="project-page__pagination custom-pagination center" v-if="total > 0">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[12, 24, 48]"
        layout="total, prev, pager, next, sizes, jumper"
        background
        @size-change="loadProjects"
        @current-change="loadProjects"
      />
    </div>

    <ProjectFormDialog
      v-model="dialogVisible"
      :mode="projectDialogMode"
      :initial-project="projectDialogSource"
      @success="loadProjects"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, nextTick } from 'vue';
  import { ElMessage } from 'element-plus';
  import {
    fetchProjectPage,
    fetchProjectDelete,
    type ProjectItem,
    type ProjectStatus
  } from '@/api/project';
  import ProjectFormDialog from './components/ProjectFormDialog.vue';
  import { formatDate } from '@/utils/date';
  const PROJECT_PRIMARY = 'var(--theme-color)';

  const STATUS_OPTIONS = [
    {
      value: 'PLANNING',
      label: '计划中',
      icon: 'mdi:clock-outline',
      color: '#909399',
      bg: '#f4f4f5',
      progress: '20%'
    },
    {
      value: 'ACTIVE',
      label: '进行中',
      icon: 'mdi:play-circle-outline',
      color: 'var(--theme-color)',
      bg: 'rgba(22, 93, 255, 0.12)',
      progress: '60%'
    },
    {
      value: 'COMPLETED',
      label: '已完成',
      icon: 'mdi:check-circle-outline',
      color: '#409eff',
      bg: '#ecf5ff',
      progress: '100%'
    },
    {
      value: 'SUSPENDED',
      label: '已搁置',
      icon: 'mdi:pause-circle-outline',
      color: '#e6a23c',
      bg: '#fdf6ec',
      progress: '40%'
    }
  ] as const;

  function getStatus(s: string) {
    return STATUS_OPTIONS.find((o) => o.value === s) ?? STATUS_OPTIONS[0];
  }
  function getProgressPercent(status: string) {
    const raw = getStatus(status).progress;
    return Number(raw.replace('%', '')) || 0;
  }
  function formatProjectDate(d: string | null) {
    if (!d) return '未设置';
    return formatDate(d) || '未设置';
  }

  const loading = ref(false);
  const dialogVisible = ref(false);
  const projectDialogMode = ref<'create' | 'edit'>('create');
  const projectDialogSource = ref<ProjectItem | null>(null);
  const hoveredId = ref<number | null>(null);
  const projectList = ref<ProjectItem[]>([]);
  const total = ref(0);

  const query = reactive({
    page: 1,
    pageSize: 12,
    name: '',
    status: undefined as ProjectStatus | undefined
  });

  async function loadProjects() {
    loading.value = true;
    try {
      const res = await fetchProjectPage({ ...query, name: query.name || undefined });
      if (res) {
        projectList.value = res.list;
        total.value = res.total;
      }
    } finally {
      loading.value = false;
    }
  }

  function handleSearch() {
    query.page = 1;
    loadProjects();
  }

  function openCreateDialog() {
    projectDialogMode.value = 'create';
    projectDialogSource.value = null;
    dialogVisible.value = false;
    nextTick(() => {
      dialogVisible.value = true;
    });
  }

  function openEditDialog(proj: ProjectItem) {
    projectDialogMode.value = 'edit';
    projectDialogSource.value = proj;
    dialogVisible.value = false;
    nextTick(() => {
      dialogVisible.value = true;
    });
  }

  async function handleDelete(id: number) {
    await fetchProjectDelete(id);
    ElMessage.success('已删除');
    loadProjects();
  }

  onMounted(() => {
    loadProjects();
  });
</script>

<style scoped lang="scss">
  $card-radius: 12px;
  $card-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  $card-shadow-hover: 0 8px 28px rgba(0, 0, 0, 0.14);
  $transition: 0.3s ease;
  /* 主容器：固定高度，flex列布局 */
  .project-page {
    padding: 20px;
    height: 100%; /* 关键：固定满高 */
    box-sizing: border-box;
    background: var(--art-main-bg-color);
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden; /* 防止页面整体滚动 */
  }

  /* 顶部工具栏：禁止压缩 */
  .project-page__toolbar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    background: var(--default-box-color);
    padding: 14px 20px;
    border-radius: $card-radius;
    box-shadow: none;
    .toolbar__filters {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }

    .toolbar__filters :deep(.el-input),
    .toolbar__filters :deep(.el-select) {
      --el-component-size: 38px;
    }

    .toolbar__filters :deep(.el-input__wrapper),
    .toolbar__filters :deep(.el-select__wrapper) {
      min-height: 38px;
    }

    .toolbar__create-btn {
      display: flex;
      align-items: center;
      padding: 0 20px;
      height: 38px;
      font-size: 14px;
      border-radius: 8px;
    }
  }

  .status-option {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* 中间内容区：占满剩余空间，独立滚动 */
  .project-page__content {
    flex: 1;
    overflow-y: auto;
    min-height: 0; /* 兼容部分浏览器flex嵌套滚动失效的问题 */
    padding: 2px; /* 给卡片悬浮阴影留点空间，防裁剪 */
    margin: -2px; /* 抵消 padding 带来的偏差 */

    /* 美化滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  .project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .project-card {
    background: var(--default-box-color);
    border-radius: $card-radius;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    cursor: default;
    transition:
      transform $transition,
      box-shadow $transition;
    position: relative;
    overflow: hidden;
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
    }
    &--skeleton {
      min-height: 200px;
    }
    &__progress {
      margin: 4px 0 10px;

      :deep(.el-progress-bar__outer) {
        border-radius: 999px;
        background-color: rgba(15, 23, 42, 0.06);
      }

      :deep(.el-progress-bar__inner) {
        border-radius: 999px;
      }
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    &__name {
      font-size: 16px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      flex: 1;
      line-height: 1.35;
      word-break: break-all;
    }
    &__status {
      flex-shrink: 0;
    }
    &__status-tag {
      :deep(.el-tag__content) {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
    }
    &__desc {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      line-height: 1.55;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 40px;
    }
    &__meta {
      display: flex;
      align-items: center;
      gap: 14px 18px;
      flex-wrap: wrap;
    }
    &__actions {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
      opacity: 0.78;
      transition: opacity $transition;
      padding-top: 6px;
      border-top: 1px solid var(--art-card-border);
      &--visible {
        opacity: 1;
      }
    }
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
    &__icon {
      color: var(--el-text-color-secondary);
      font-size: 15px;
      flex-shrink: 0;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    color: var(--el-text-color-placeholder);
    height: 100%;
    &__icon {
      font-size: 72px;
      margin-bottom: 16px;
    }
    p {
      font-size: 15px;
    }
  }

  /* 底部固定分页：禁止压缩 */
  .project-page__pagination {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    background: transparent;
    padding: 4px 0 2px;
    border-radius: 0;
    box-shadow: none;

    :deep(.el-select) {
      width: 102px !important;
    }

    :deep(.el-pagination) {
      .btn-prev,
      .btn-next {
        color: var(--el-text-color-regular);
        background-color: var(--default-box-color);
        border: 1px solid var(--el-border-color);
        transition: border-color 0.15s;

        &:hover:not(.is-disabled) {
          color: var(--theme-color);
          border-color: var(--theme-color);
        }
      }

      li {
        box-sizing: border-box;
        font-weight: 400 !important;
        color: var(--el-text-color-regular);
        background-color: var(--default-box-color);
        border: 1px solid var(--el-border-color);
        transition: border-color 0.15s;

        &.is-active {
          font-weight: 400;
          color: #fff;
          background-color: var(--theme-color);
          border: 1px solid var(--theme-color);
        }

        &:hover:not(.is-disabled) {
          border-color: var(--theme-color);
        }
      }
    }
  }

  /* Vue 动画组 */
  .card-list-enter-active {
    transition: all 0.4s ease;
  }
  .card-list-leave-active {
    transition: all 0.3s ease;
    position: absolute;
  }
  .card-list-enter-from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  .card-list-leave-to {
    opacity: 0;
    transform: scale(0.9);
  }
  .card-list-move {
    transition: transform 0.4s ease;
  }
</style>
