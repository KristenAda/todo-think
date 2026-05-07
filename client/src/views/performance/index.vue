<template>
  <div class="perf art-full-height" :class="{ 'perf--entered': pageEntered }">
    <div class="perf-hero">
      <div class="perf-hero__bg" aria-hidden="true" />
      <div class="perf-hero__bg-shimmer" aria-hidden="true" />
      <div class="perf-hero__inner">
        <div class="perf-hero__left">
          <div class="perf-hero__icon-wrap">
            <art-svg-icon icon="mdi:chart-timeline-variant" class="perf-hero__icon" />
          </div>
          <div>
            <h1 class="perf-hero__title">研发效能驾驶舱</h1>
            <p class="perf-hero__sub">{{ heroSubtitle }}</p>
          </div>
        </div>
        <div class="perf-hero__toolbar">
          <el-select
            v-model="filterProjectId"
            placeholder="全部项目"
            clearable
            style="width: 200px"
            @change="onFilterChange"
          >
            <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-date-picker
            v-model="periodRange"
            type="daterange"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            range-separator="至"
            start-placeholder="账期开始"
            end-placeholder="账期结束"
            style="width: 300px"
            @change="onFilterChange"
          />
          <el-button type="primary" :loading="loading" @click="refreshAll">刷新</el-button>
        </div>
      </div>
    </div>

    <div class="perf-kpi-row">
      <div v-for="card in kpiCards" :key="card.key" class="perf-kpi">
        <div class="perf-kpi__icon" :style="{ background: card.iconBg }">
          <art-svg-icon :icon="card.icon" class="perf-kpi__svg" />
        </div>
        <div class="perf-kpi__body">
          <div class="perf-kpi__val">{{ card.value }}</div>
          <div class="perf-kpi__lab">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <div class="perf-section perf-section--charts">
      <PerformanceDashboardCharts :all-stats="allStats" :summary="summary" />
    </div>

    <ElCard class="perf-section perf-section--table perf-table-card art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshAll">
        <template #left>
          <span class="perf-table-title">成员绩效明细</span>
        </template>
      </ArtTableHeader>
      <ArtTable
        class="perf-art-table"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <EmployeeStatsDetailDialog v-model:visible="detailVisible" :stat="detailStat" />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick, h, resolveComponent } from 'vue';
  import { ElTag, ElProgress, ElImage, ElButton } from 'element-plus';
  import { fetchPerformanceStats, fetchProjectList } from '@/api/task';
  import { useTable } from '@/hooks/core/useTable';
  import { defaultResponseAdapter } from '@/utils/table/tableUtils';
  import type { ApiResponse } from '@/utils/table/tableCache';
  import PerformanceDashboardCharts from './components/PerformanceDashboardCharts.vue';
  import EmployeeStatsDetailDialog from './components/EmployeeStatsDetailDialog.vue';
  import { COMPOSITE_TIER_META } from '@/enums/modules/performanceEnum';

  defineOptions({ name: 'Performance' });

  type PerformanceStat = Api.Task.PerformanceStat;

  const filterProjectId = ref<number | undefined>(undefined);
  const periodRange = ref<[string, string] | null>(null);
  const projectList = ref<Api.Task.SimpleProject[]>([]);
  const allStats = ref<PerformanceStat[]>([]);
  const summary = ref<Api.Task.PerformanceStatsSummary | null>(null);
  const detailVisible = ref(false);
  const detailStat = ref<PerformanceStat | null>(null);

  /** 首屏入场动画：下一帧再点亮，避免首 paint 与动画抢帧 */
  const pageEntered = ref(false);

  function tierTagType(t: string): 'success' | 'primary' | 'warning' | 'danger' | 'info' {
    const m = COMPOSITE_TIER_META[t as keyof typeof COMPOSITE_TIER_META];
    return m?.elTag ?? 'info';
  }

  const heroSubtitle = computed(() => {
    const pr = periodRange.value;
    if (pr?.[0] && pr?.[1])
      return `当前账期：${pr[0].slice(0, 10)} — ${pr[1].slice(0, 10)} · 队内相对排名`;
    return '筛选项目与账期后，综合分与档位为队内相对比较';
  });

  const kpiCards = computed(() => {
    const s = summary.value?.totals;
    return [
      {
        key: 'head',
        label: '参与人数',
        value: s?.headcount ?? allStats.value.length,
        icon: 'mdi:account-group',
        iconBg: 'linear-gradient(135deg,#e8f4fd,#dbeafe)'
      },
      {
        key: 'done',
        label: '主责完成数',
        value: s?.completedTasks ?? 0,
        icon: 'mdi:check-decagram',
        iconBg: 'linear-gradient(135deg,#e8f9f0,#d1fae5)'
      },
      {
        key: 'wl',
        label: '登记工时(h)',
        value: s?.totalWorkLogHours ?? 0,
        icon: 'mdi:clock-outline',
        iconBg: 'linear-gradient(135deg,#fff8e6,#fef3c7)'
      },
      {
        key: 'pt',
        label: '总积分',
        value: s?.totalPoints ?? 0,
        icon: 'mdi:star-circle',
        iconBg: 'linear-gradient(135deg,#eef9ff,#e0f2fe)'
      },
      {
        key: 'rej',
        label: '验收打回(次)',
        value: s?.totalQaRejects ?? 0,
        icon: 'mdi:undo-variant',
        iconBg: 'linear-gradient(135deg,#fef0f0,#fee2e2)'
      },
      {
        key: 'avg',
        label: '平均综合分',
        value: s?.avgCompositeScore ?? '—',
        icon: 'mdi:speedometer',
        iconBg: 'linear-gradient(135deg,#f3e8ff,#ede9fe)'
      },
      {
        key: 'ot',
        label: '平均准时率%',
        value: s?.avgOnTimeRate ?? '—',
        icon: 'mdi:calendar-check',
        iconBg: 'linear-gradient(135deg,#ecfeff,#cffafe)'
      }
    ];
  });

  function applySearchParams() {
    const sp = searchParams as Record<string, unknown>;
    sp.projectId = filterProjectId.value;
    sp.startAt = periodRange.value?.[0];
    sp.endAt = periodRange.value?.[1];
  }

  function perfResponseAdapter(raw: unknown): ApiResponse<PerformanceStat> {
    if (raw && typeof raw === 'object' && 'summary' in raw) {
      summary.value = (raw as Api.Task.PerformanceStatsPageData).summary ?? null;
    }
    return defaultResponseAdapter(raw);
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    searchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    getData
  } = useTable({
    core: {
      apiFn: fetchPerformanceStats,
      apiParams: { page: 1, pageSize: 10 },
      paginationKey: { current: 'page', size: 'pageSize' },
      immediate: false,
      columnsFactory: () => buildColumns()
    },
    transform: {
      // PageResult 与 useTable 基于 PaginatedResponse 的推断不一致
      responseAdapter: perfResponseAdapter as typeof defaultResponseAdapter
    }
  });

  function buildColumns() {
    const cols: import('@/types/component').ColumnOption<PerformanceStat>[] = [
      {
        type: 'index',
        label: '序号',
        width: 64,
        fixed: 'left',
        align: 'center',
        showOverflowTooltip: true
      },
      {
        prop: 'user',
        label: '成员',
        minWidth: 220,
        fixed: 'left',
        showOverflowTooltip: true,
        formatter: (row: PerformanceStat) => {
          const ColorAvatar = resolveComponent('ColorAvatar');
          const displayName = row.user.nickName || row.user.userName;
          const avatarNode = row.user.avatar
            ? h(ElImage, {
                class: 'size-9 rounded-full flex-shrink-0',
                src: row.user.avatar,
                previewSrcList: [row.user.avatar],
                previewTeleported: true,
                fit: 'cover'
              })
            : h('div', { class: 'size-9 rounded-full overflow-hidden flex-shrink-0' }, [
                h(ColorAvatar, { name: displayName || '?', gender: '', size: 36 })
              ]);
          return h('div', { class: 'perf-member-cell' }, [
            h('div', { class: 'perf-member-cell__avatar' }, [avatarNode]),
            h('div', { class: 'perf-member-cell__text' }, [
              h('span', { class: 'perf-member-cell__name' }, displayName),
              h('span', { class: 'perf-member-cell__email' }, row.user.userEmail ?? '')
            ])
          ]);
        }
      },
      {
        prop: 'compositeScore',
        label: '综合效能分',
        width: 128,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true,
        formatter: (row: PerformanceStat) => row.compositeScore ?? '—'
      },
      {
        prop: 'compositeTier',
        label: '综合档位',
        minWidth: 96,
        align: 'center',
        formatter: (row: PerformanceStat) => {
          const t = row.compositeTier ?? 'C';
          const meta = COMPOSITE_TIER_META[t as keyof typeof COMPOSITE_TIER_META];
          return h(
            ElTag,
            { type: tierTagType(t), size: 'small', effect: 'dark' },
            () => meta?.label ?? t
          );
        }
      },
      {
        prop: 'totalTasks',
        label: '主责完成任务',
        minWidth: 130,
        align: 'center',
        sortable: true
      },
      {
        prop: 'medianLeadTimeDays',
        label: '交付周期中位(天)',
        minWidth: 150,
        align: 'center',
        sortable: true
      },
      {
        prop: 'onTimeRate',
        label: '准时率',
        minWidth: 132,
        align: 'center',
        sortable: true,
        formatter: (row: PerformanceStat) =>
          h(ElProgress, {
            percentage: row.onTimeRate ?? 0,
            strokeWidth: 8,
            color:
              (row.onTimeRate ?? 0) >= 80
                ? '#67c23a'
                : (row.onTimeRate ?? 0) >= 60
                  ? '#409eff'
                  : '#f56c6c'
          })
      },
      {
        prop: 'firstPassRate',
        label: '一次通过率',
        minWidth: 132,
        align: 'center',
        sortable: true,
        formatter: (row: PerformanceStat) =>
          h(ElProgress, {
            percentage: row.firstPassRate,
            strokeWidth: 8,
            color:
              row.firstPassRate >= 80 ? '#67c23a' : row.firstPassRate >= 50 ? '#e6a23c' : '#f56c6c'
          })
      },
      {
        prop: 'hoursAccuracyAvg',
        label: '估时准确率',
        minWidth: 128,
        align: 'center',
        sortable: true,
        formatter: (row: PerformanceStat) =>
          row.hoursAccuracyAvg != null ? `${row.hoursAccuracyAvg}%` : '—'
      },
      {
        prop: 'qaRejectCount',
        label: '验收打回次数',
        minWidth: 130,
        align: 'center',
        sortable: true
      },
      {
        prop: 'wipCount',
        label: '在制 WIP',
        minWidth: 100,
        align: 'center',
        sortable: true
      },
      {
        prop: 'totalPoints',
        label: '总积分',
        minWidth: 88,
        align: 'center',
        sortable: true
      },
      {
        prop: 'workLogHours',
        label: '登记工时(h)',
        minWidth: 116,
        align: 'center',
        sortable: true,
        formatter: (row: PerformanceStat) => `${row.workLogHours ?? 0}`
      },
      {
        prop: 'coAssigneeCompletedCount',
        label: '协作参与次数',
        minWidth: 130,
        align: 'center',
        sortable: true
      },
      {
        prop: 'testerCompletedCount',
        label: '验收任务数',
        minWidth: 128,
        align: 'center',
        sortable: true
      },
      {
        prop: '_actions',
        label: '操作',
        width: 96,
        align: 'center',
        fixed: 'right',
        formatter: (row: PerformanceStat) =>
          h(
            ElButton,
            {
              type: 'primary',
              link: true,
              onClick: () => openDetail(row)
            },
            () => '详情'
          )
      }
    ];

    return cols;
  }

  function openDetail(row: PerformanceStat) {
    detailStat.value = row;
    detailVisible.value = true;
  }

  async function loadAllStats() {
    const raw = await fetchPerformanceStats({
      page: 1,
      pageSize: 1000,
      projectId: filterProjectId.value,
      startAt: periodRange.value?.[0],
      endAt: periodRange.value?.[1]
    });
    allStats.value = raw.list ?? [];
    summary.value = raw.summary ?? null;
  }

  async function loadProjects() {
    projectList.value = await fetchProjectList();
  }

  async function onFilterChange() {
    applySearchParams();
    await Promise.all([refreshData(), loadAllStats()]);
  }

  async function refreshAll() {
    applySearchParams();
    await Promise.all([refreshData(), loadAllStats()]);
  }

  onMounted(() => {
    void nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pageEntered.value = true;
        });
      });
    });
    loadProjects();
    applySearchParams();
    void Promise.all([getData(), loadAllStats()]);
  });
</script>

<style scoped lang="scss">
  .perf {
    padding: 16px 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
    min-height: 100%;
  }

  .perf-hero {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
    opacity: 0;
    transform: translateY(18px);
  }

  .perf--entered .perf-hero {
    animation: perfEnterHero 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .perf-section--charts,
  .perf-section--table {
    opacity: 0;
    transform: translateY(20px);
  }

  .perf--entered .perf-section--charts {
    animation: perfEnterSection 0.58s cubic-bezier(0.22, 1, 0.36, 1) 0.28s forwards;
  }

  .perf--entered .perf-section--table {
    animation: perfEnterSection 0.58s cubic-bezier(0.22, 1, 0.36, 1) 0.42s forwards;
  }

  @keyframes perfEnterHero {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes perfEnterKpi {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes perfEnterSection {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes perfHeroBgPulse {
    0%,
    100% {
      filter: saturate(1);
    }
    50% {
      filter: saturate(1.12);
    }
  }

  @keyframes perfHeroShimmer {
    0%,
    100% {
      background-position: 130% 0;
    }
    50% {
      background-position: -30% 0;
    }
  }

  @keyframes perfIconFloat {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-3px);
    }
  }

  @keyframes perfIconGlow {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(147, 197, 253, 0.35);
    }
    50% {
      box-shadow: 0 0 20px 2px rgba(147, 197, 253, 0.22);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .perf-hero,
    .perf-kpi,
    .perf-section--charts,
    .perf-section--table {
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }

    .perf-hero__bg,
    .perf-hero__bg-shimmer {
      animation: none !important;
    }

    .perf-hero__icon-wrap,
    .perf-hero__icon {
      animation: none !important;
    }

    .perf-kpi__val {
      transition: none;
    }

    .perf--entered .perf-kpi:hover .perf-kpi__val {
      transform: none;
    }
  }

  .perf-hero__bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(1200px 400px at 10% -20%, rgba(64, 158, 255, 0.35), transparent 55%),
      radial-gradient(900px 360px at 90% 0%, rgba(103, 194, 58, 0.22), transparent 50%),
      linear-gradient(135deg, #0f172a 0%, #1e293b 48%, #0f172a 100%);
    opacity: 0.96;
    animation: perfHeroBgPulse 14s ease-in-out infinite;
  }

  /* 轻微高光扫过，不挡操作 */
  .perf-hero__bg-shimmer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      105deg,
      transparent 38%,
      rgba(255, 255, 255, 0.07) 50%,
      transparent 62%
    );
    background-size: 220% 100%;
    animation: perfHeroShimmer 9s ease-in-out infinite;
    mix-blend-mode: overlay;
  }

  .perf-hero__inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 22px;
    color: #e2e8f0;
  }

  .perf-hero__left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .perf-hero__icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.18);
    animation: perfIconGlow 4s ease-in-out infinite;
  }

  .perf-hero__icon {
    font-size: 26px;
    color: #93c5fd;
    animation: perfIconFloat 4.5s ease-in-out infinite;
  }

  .perf-hero__title {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: #f8fafc;
  }

  .perf-hero__sub {
    margin: 6px 0 0;
    font-size: 13px;
    color: rgba(226, 232, 240, 0.78);
    max-width: 520px;
    line-height: 1.45;
  }

  .perf-hero__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .perf-hero__toolbar :deep(.el-input__wrapper),
  .perf-hero__toolbar :deep(.el-select__wrapper) {
    background: rgba(15, 23, 42, 0.35);
    box-shadow: none;
  }

  .perf-kpi-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 14px;
  }

  .perf-kpi {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--art-main-bg-color, #fff);
    border: 1px solid rgba(64, 158, 255, 0.12);
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
    backdrop-filter: blur(8px);
    opacity: 0;
    transform: translateY(16px);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .perf--entered .perf-kpi {
    animation: perfEnterKpi 0.52s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .perf--entered .perf-kpi:nth-child(1) {
    animation-delay: 0.08s;
  }
  .perf--entered .perf-kpi:nth-child(2) {
    animation-delay: 0.13s;
  }
  .perf--entered .perf-kpi:nth-child(3) {
    animation-delay: 0.18s;
  }
  .perf--entered .perf-kpi:nth-child(4) {
    animation-delay: 0.23s;
  }
  .perf--entered .perf-kpi:nth-child(5) {
    animation-delay: 0.28s;
  }
  .perf--entered .perf-kpi:nth-child(6) {
    animation-delay: 0.33s;
  }
  .perf--entered .perf-kpi:nth-child(7) {
    animation-delay: 0.38s;
  }
  .perf--entered .perf-kpi:nth-child(8) {
    animation-delay: 0.43s;
  }
  .perf--entered .perf-kpi:nth-child(9) {
    animation-delay: 0.48s;
  }
  .perf--entered .perf-kpi:nth-child(10) {
    animation-delay: 0.53s;
  }

  .perf-kpi:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
  }

  .perf-kpi__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .perf-kpi__svg {
    font-size: 22px;
    color: #409eff;
  }

  .perf-kpi__val {
    font-size: 22px;
    font-weight: 800;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .perf--entered .perf-kpi:hover .perf-kpi__val {
    transform: scale(1.04);
  }

  .perf-kpi__lab {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  .perf-table-card {
    flex: 1;
    min-height: 420px;
    border-radius: 14px;
    border: 1px solid rgba(64, 158, 255, 0.08);
    overflow-x: auto;
  }

  /* 表头：完整列名、单行、留白充足 */
  .perf-table-card :deep(.perf-art-table .el-table__header th.el-table__cell) {
    background: var(--el-fill-color-light);
  }

  .perf-table-card :deep(.perf-art-table .el-table__header th.el-table__cell .cell) {
    white-space: nowrap;
    line-height: 1.35;
    padding: 10px 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .perf-table-card :deep(.perf-art-table .el-table__body td.el-table__cell .cell) {
    padding: 8px 10px;
    font-size: 13px;
  }

  .perf-table-title {
    font-weight: 700;
    font-size: 15px;
  }

  :deep(.perf-member-cell) {
    display: flex;
    align-items: center;
    gap: 12px;
    line-height: 1.4;
  }

  :deep(.perf-member-cell__avatar) {
    flex-shrink: 0;
  }

  :deep(.perf-member-cell__text) {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  :deep(.perf-member-cell__name) {
    font-size: 13px;
    font-weight: 500;
  }

  :deep(.perf-member-cell__email) {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    word-break: break-all;
  }
</style>
