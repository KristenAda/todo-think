<template>
  <div class="project-page art-full-height">
    <header class="project-header">
      <div class="toolbar-left">
        <div class="search-wrapper">
          <art-svg-icon icon="mdi:magnify" class="search-icon" />
          <input v-model="query.name" placeholder="搜索项目..." @keyup.enter="handleSearch" />
        </div>
        <el-select
          v-model="query.status"
          class="status-select"
          placeholder="全部状态"
          clearable
          @change="handleSearch"
        >
          <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value">
            <div class="status-option">
              <span class="status-dot" :style="{ backgroundColor: s.dotColor }"></span>
              {{ s.label }}
            </div>
          </el-option>
        </el-select>
      </div>

      <el-button type="primary" class="create-btn" @click="openCreateDialog">
        <art-svg-icon icon="mdi:plus" />
        <span>新建项目</span>
      </el-button>
    </header>

    <div class="project-content">
      <div v-if="loading" class="grid-layout">
        <div v-for="n in 8" :key="n" class="skeleton-card">
          <el-skeleton animated :rows="3" />
        </div>
      </div>

      <div v-else-if="!projectList.length" class="empty-holder">
        <art-svg-icon icon="mdi:folder-open-outline" />
        <p>没有找到相关项目</p>
      </div>

      <transition-group v-else name="list-fade" tag="div" class="grid-layout">
        <div v-for="proj in projectList" :key="proj.id" class="item-card">
          <div class="item-card__surface">
            <div class="card-progress-stack">
              <div class="card-progress-head">
                <span class="card-progress-label">阶段健康度</span>
                <span
                  class="card-progress-value"
                  :style="{ color: getStatus(proj.status).percentText }"
                >
                  {{ getProgressPercent(proj.status) }}%
                </span>
              </div>
              <div
                class="card-progress"
                role="progressbar"
                :aria-valuenow="getProgressPercent(proj.status)"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`阶段健康度 ${getProgressPercent(proj.status)}%`"
              >
                <div
                  class="progress-inner"
                  :style="{
                    width: getProgressPercent(proj.status) + '%',
                    backgroundColor: getStatus(proj.status).barFill,
                    '--bar-glow': getStatus(proj.status).barFill
                  }"
                ></div>
              </div>
            </div>

            <div class="card-main">
              <div class="card-title-row">
                <h3 class="title">{{ proj.name }}</h3>
                <span class="badge" :style="badgeStyle(proj.status)">
                  <span
                    class="dot dot--breathing"
                    :style="{ backgroundColor: getStatus(proj.status).dotColor }"
                  ></span>
                  {{ getStatus(proj.status).label }}
                </span>
              </div>

              <p v-if="proj.description" class="description">
                {{ proj.description }}
              </p>

              <div class="meta-grid">
                <div class="meta-item">
                  <art-svg-icon icon="mdi:account-circle-outline" />
                  <span>{{ proj.manager.nickName || proj.manager.userName }}</span>
                </div>
                <div class="meta-item">
                  <art-svg-icon icon="mdi:checkbox-marked-circle-outline" />
                  <span>{{ proj._count.tasks }} 任务</span>
                </div>
                <div v-if="proj.startDate || proj.endDate" class="meta-item full-width">
                  <art-svg-icon icon="mdi:clock-outline" />
                  <span
                    >{{ formatProjectDate(proj.startDate) }} -
                    {{ formatProjectDate(proj.endDate) }}</span
                  >
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button class="footer-btn edit" @click.stop="openEditDialog(proj)">
                <art-svg-icon icon="mdi:pencil-outline" /> 编辑
              </button>
              <el-popconfirm title="确定删除吗？" @confirm="handleDelete(proj.id)">
                <template #reference>
                  <button class="footer-btn delete">
                    <art-svg-icon icon="mdi:trash-can-outline" /> 删除
                  </button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <footer class="project-footer" v-if="total > 0">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next, sizes"
        @size-change="loadProjects"
        @current-change="loadProjects"
      />
    </footer>

    <ProjectFormDialog
      v-model="dialogVisible"
      :mode="projectDialogMode"
      :initial-project="projectDialogSource"
      @success="loadProjects"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue';
  import { ElMessage } from 'element-plus';
  import {
    fetchProjectPage,
    fetchProjectDelete,
    type ProjectItem,
    type ProjectStatus
  } from '@/api/project';
  import ProjectFormDialog from './components/ProjectFormDialog.vue';
  import { formatDate } from '@/utils/date';
  import { PROJECT_STATUS_UI } from '@/enums/modules/projectEnum';

  const STATUS_OPTIONS = PROJECT_STATUS_UI;

  const query = reactive({
    page: 1,
    pageSize: 12,
    name: '',
    status: undefined as ProjectStatus | undefined
  });
  const loading = ref(false);
  const projectList = ref<ProjectItem[]>([]);
  const total = ref(0);
  const dialogVisible = ref(false);
  const projectDialogMode = ref<'create' | 'edit'>('create');
  const projectDialogSource = ref<ProjectItem | null>(null);

  const getStatus = (s: string) => STATUS_OPTIONS.find((o) => o.value === s) ?? STATUS_OPTIONS[0];
  const getProgressPercent = (s: string) => getStatus(s).progressPercent;
  const formatProjectDate = (d: string | null) => (d ? formatDate(d) : '--');
  const badgeStyle = (s: string) => {
    const meta = getStatus(s);
    return { color: meta.badgeTextColor, backgroundColor: meta.badgeBg };
  };

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

  const handleSearch = () => {
    query.page = 1;
    loadProjects();
  };

  const openCreateDialog = () => {
    projectDialogMode.value = 'create';
    projectDialogSource.value = null;
    dialogVisible.value = true;
  };

  const openEditDialog = (proj: ProjectItem) => {
    projectDialogMode.value = 'edit';
    projectDialogSource.value = proj;
    dialogVisible.value = true;
  };

  async function handleDelete(id: number) {
    await fetchProjectDelete(id);
    ElMessage.success('项目已移除');
    loadProjects();
  }

  onMounted(loadProjects);
</script>

<style scoped lang="scss">
  $primary: var(--theme-color, #3b82f6);
  $text-main: #0f172a;
  $text-sub: #64748b;
  $radius: 14px;
  $ease-out: cubic-bezier(0.22, 1, 0.36, 1);

  /* 允许阴影延伸到布局滚动层（#app-main），不在此层做 overflow 裁切 */
  .project-page {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: visible;
    padding: 28px 28px 24px;
    box-sizing: border-box;
    background-color: var(--art-main-bg-color, #fafbfc);

    &.art-full-height {
      height: auto;
      min-height: var(--art-full-height);
    }
  }

  /* 顶栏毛玻璃 2.0：轻浮于内容之上 */
  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    gap: 16px;
    padding: 14px 18px;
    margin-bottom: 28px;
    border-radius: $radius;
    border: 1px solid rgba(255, 255, 255, 0.72);
    background: rgba(255, 255, 255, 0.52);
    backdrop-filter: blur(22px) saturate(1.45);
    -webkit-backdrop-filter: blur(22px) saturate(1.45);
    box-shadow:
      0 1px 1px rgba(15, 23, 42, 0.03),
      0 10px 36px rgba(15, 23, 42, 0.06);

    .toolbar-left {
      display: flex;
      gap: 12px;
      flex: 1;
      align-items: center;
      flex-wrap: wrap;
      min-width: 0;

      .search-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        padding: 0 14px;
        width: min(280px, 100%);
        height: 40px;
        border-radius: 10px;
        border: 1px solid rgba(226, 232, 240, 0.85);
        background: rgba(248, 250, 252, 0.72);
        transition:
          border-color 0.22s ease,
          box-shadow 0.22s ease;

        &:focus-within {
          border-color: color-mix(in srgb, $primary 42%, #e2e8f0);
          box-shadow:
            0 0 0 3px color-mix(in srgb, $primary 14%, transparent),
            0 6px 18px rgba(15, 23, 42, 0.05);
        }

        .search-icon {
          color: #94a3b8;
          font-size: 18px;
          flex-shrink: 0;
        }

        input {
          border: none;
          outline: none;
          padding: 8px 6px;
          width: 100%;
          font-size: 14px;
          color: $text-main;
          background: transparent;
        }
      }

      .status-select {
        width: 168px;
      }

      :deep(.el-select__wrapper) {
        border-radius: 10px;
        height: 40px;
        border: 1px solid rgba(226, 232, 240, 0.85);
        background: rgba(248, 250, 252, 0.72);
        box-shadow: none !important;
        transition:
          border-color 0.22s ease,
          box-shadow 0.22s ease;

        &:hover {
          border-color: rgba(203, 213, 225, 0.95);
        }
      }
    }

    .create-btn {
      height: 40px;
      flex-shrink: 0;
      border-radius: 10px;
      padding: 0 20px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 14px color-mix(in srgb, $primary 22%, transparent);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 22px color-mix(in srgb, $primary 26%, transparent);
      }
    }
  }

  /* 状态选项 */
  .status-option {
    display: flex;
    align-items: center;
    gap: 8px;
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }

  /* 不在此处滚动：纵向滚动交给 #app-main，避免 overflow:auto 裁切阴影 */
  .project-content {
    flex: 1;
    min-height: 0;
    overflow: visible;
  }

  .grid-layout {
    position: relative;
    display: grid;
    gap: 24px;
    grid-template-columns: 1fr;

    @media (width >= 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (width >= 1024px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (width >= 1280px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @keyframes dot-breathe {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
      box-shadow: none;
    }

    50% {
      opacity: 0.72;
      transform: scale(1.18);
      box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 22%, transparent);
    }
  }

  /* 外层仅负责投影与圆角轮廓；overflow:hidden 会裁切自身 box-shadow，故移到内层 */
  .item-card {
    position: relative;
    z-index: 0;
    border-radius: $radius;
    border: 1px solid rgba(15, 23, 42, 0.06);
    box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.04),
      0 8px 28px rgba(15, 23, 42, 0.05);
    transition:
      transform 0.45s $ease-out,
      box-shadow 0.45s $ease-out,
      border-color 0.35s ease;

    &:hover {
      border-color: color-mix(in srgb, $primary 18%, rgba(15, 23, 42, 0.06));
      box-shadow:
        0 2px 4px rgba(15, 23, 42, 0.04),
        0 16px 44px rgba(15, 23, 42, 0.09);
    }

    &__surface {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-radius: inherit;
      background: var(--default-box-color, #fff);
    }

    .card-progress-stack {
      flex-shrink: 0;
      padding: 14px 18px 12px;
      /* 与卡片主体同一白底，仅用极淡主题色高光 + 细分割线区分区块，不再叠一层灰底 */
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
      background: linear-gradient(
        185deg,
        color-mix(in srgb, var(--theme-color, #3b82f6) 5%, var(--default-box-color, #ffffff)) 0%,
        var(--default-box-color, #ffffff) 62%
      );
    }

    .card-progress-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      gap: 12px;
    }

    .card-progress-label {
      font-size: 12px;
      font-weight: 600;
      line-height: 1.35;
      letter-spacing: 0;
      color: #334155;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .card-progress-value {
      flex-shrink: 0;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .card-progress {
      height: 6px;
      border-radius: 999px;
      /* 轨道用中性透明黑，在白底上不发青灰、不与页面灰底连成一片 */
      background: rgba(15, 23, 42, 0.075);
      overflow: hidden;

      .progress-inner {
        height: 100%;
        border-radius: 999px;
        transition: width 0.85s $ease-out;
        box-shadow: 0 0 12px color-mix(in srgb, var(--bar-glow, #64748b) 28%, transparent);
      }
    }

    .card-main {
      display: flex;
      flex: 1;
      flex-direction: column;
      padding: 18px 18px 16px;
      gap: 0;
    }

    .card-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;

      .title {
        margin: 0;
        padding-right: 8px;
        font-size: 16px;
        font-weight: 600;
        line-height: 1.35;
        color: $text-main;
        word-break: break-word;
      }

      .badge {
        display: inline-flex;
        flex-shrink: 0;
        align-items: center;
        gap: 6px;
        padding: 5px 11px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.65);
        font-size: 12px;
        font-weight: 500;
        line-height: 1;

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          color: inherit;
        }

        .dot--breathing {
          animation: dot-breathe 2.4s ease-in-out infinite;
        }
      }
    }

    .description {
      margin: 0 0 16px;
      font-size: 13px;
      line-height: 1.6;
      color: $text-sub;
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      line-clamp: 2;
      -webkit-line-clamp: 2;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: auto;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #64748b;

        svg {
          flex-shrink: 0;
          font-size: 15px;
          color: #94a3b8;
        }

        &.full-width {
          grid-column: span 2;
        }
      }
    }

    .card-footer {
      flex-shrink: 0;
      display: flex;
      gap: 10px;
      align-items: stretch;
      padding: 12px 18px 14px;
      border-top: 1px dashed rgba(15, 23, 42, 0.12);
      background: color-mix(
        in srgb,
        var(--el-fill-color-lighter, #fafafa) 82%,
        var(--default-box-color, #fff)
      );

      .footer-btn {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 9px 8px;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s ease;

        &.edit {
          color: $primary;

          &:hover {
            background: color-mix(in srgb, $primary 8%, transparent);
          }
        }

        &.delete {
          color: #ef4444;

          &:hover {
            background: rgba(254, 242, 242, 0.95);
          }
        }
      }
    }
  }

  /* 底部分页 */
  .project-footer {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  /* 列表动画 */
  .list-fade-enter-active,
  .list-fade-leave-active {
    transition: all 0.4s ease;
  }
  .list-fade-enter-from {
    opacity: 0;
    transform: scale(0.9);
  }
  .list-fade-leave-to {
    opacity: 0;
    transform: translateY(30px);
  }

  .empty-holder {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 100px 0;
    color: #94a3b8;
    svg {
      font-size: 64px;
      margin-bottom: 16px;
    }
  }

  .skeleton-card {
    background: #fff;
    padding: 24px;
    border-radius: $radius;
    height: 180px;
  }
</style>
