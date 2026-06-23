<template>
  <div class="perf-dashboard art-full-height">
    <header class="perf-header perf-panel">
      <div class="perf-header__left">
        <div class="perf-header__icon-wrap">
          <art-svg-icon icon="mdi:chart-timeline-variant" class="perf-header__icon" />
        </div>
        <div class="perf-header__title-wrap">
          <h1 class="perf-header__title">研发效能统计</h1>
          <p class="perf-header__sub">{{ heroSubtitle }}</p>
        </div>
      </div>
      <div class="perf-header__toolbar">
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
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 300px"
          @change="onFilterChange"
        />
        <el-button type="primary" :loading="loading" @click="refreshAll">查询</el-button>
      </div>
    </header>

    <section class="perf-kpi-shell" aria-label="统计范围内汇总指标">
      <div class="perf-kpi-strip">
        <article
          v-for="card in kpiCards"
          :key="card.key"
          class="premium-kpi-card"
          :style="{ '--kpi-accent': card.accent }"
        >
          <div class="premium-kpi-card__inner">
            <header class="premium-kpi-card__meta">
              <span class="premium-kpi-card__label">{{ card.label }}</span>
              <div class="premium-kpi-card__icon-wrap">
                <art-svg-icon :icon="card.icon" class="premium-kpi-card__icon" aria-hidden="true" />
              </div>
            </header>
            <div class="premium-kpi-card__data">
              <p class="premium-kpi-card__value">{{ card.value }}</p>
            </div>
          </div>

          <div class="premium-kpi-card__watermark">
            <art-svg-icon :icon="card.icon" aria-hidden="true" />
          </div>
        </article>
      </div>
    </section>

    <div class="perf-charts">
      <PerformanceDashboardCharts :all-stats="allStats" :summary="summary" />
    </div>

    <ElCard class="perf-table-card art-table-card" shadow="never">
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
  import { ref, computed, onMounted, h, resolveComponent } from 'vue';
  import { ElProgress, ElImage } from 'element-plus';
  import { fetchPerformanceStats, fetchProjectList } from '@/api/task';
  import { useTable } from '@/hooks/core/useTable';
  import { defaultResponseAdapter } from '@/utils/table/tableUtils';
  import type { ApiResponse } from '@/utils/table/tableCache';
  import PerformanceDashboardCharts from './components/PerformanceDashboardCharts.vue';
  import EmployeeStatsDetailDialog from './components/EmployeeStatsDetailDialog.vue';
  import RankIcon from '@/components/core/base/rank-icon/index.vue';
  import ArtTableRowActions from '@/components/core/forms/art-table-row-actions/index.vue';
  import type { RankIconTier } from '@/components/core/base/rank-icon/types';

  defineOptions({ name: 'Performance' });

  type PerformanceStat = Api.Task.PerformanceStat;

  const filterProjectId = ref<number | undefined>(undefined);
  const periodRange = ref<[string, string] | null>(null);
  const projectList = ref<Api.Task.SimpleProject[]>([]);
  const allStats = ref<PerformanceStat[]>([]);
  const summary = ref<Api.Task.PerformanceStatsSummary | null>(null);
  const detailVisible = ref(false);
  const detailStat = ref<PerformanceStat | null>(null);

  const heroSubtitle = computed(() => {
    const pr = periodRange.value;
    if (pr?.[0] && pr?.[1])
      return `本期统计：${pr[0].slice(0, 10)} — ${pr[1].slice(0, 10)} · 绩效评级按得分区间划分`;
    return '绩效评级基于综合得分的绝对区间判定，非团队内横向排名。';
  });

  const kpiCards = computed(() => {
    const s = summary.value?.totals;
    const headcountForAvg = (s?.headcount ?? allStats.value.length) || 0;
    const completed = s?.completedTasks ?? 0;
    const avgDeliverPerPerson =
      headcountForAvg > 0 ? Math.round((completed / headcountForAvg) * 10) / 10 : '—';
    return [
      {
        key: 'head',
        label: '参与人数',
        value: s?.headcount ?? allStats.value.length,
        icon: 'mdi:account-group',
        accent: '#409EFF' // Element Primary
      },
      {
        key: 'done',
        label: '交付任务数',
        value: s?.completedTasks ?? 0,
        icon: 'mdi:check-decagram',
        accent: '#67C23A' // Element Success
      },
      {
        key: 'avgDone',
        label: '人均交付任务数',
        value: avgDeliverPerPerson,
        icon: 'mdi:chart-box-outline',
        accent: '#14b8a6'
      },
      {
        key: 'wl',
        label: '实际投入工时 (h)',
        value: s?.totalWorkLogHours ?? 0,
        icon: 'mdi:clock-outline',
        accent: '#E6A23C' // Element Warning
      },
      {
        key: 'pt',
        label: '总积分',
        value: s?.totalPoints ?? 0,
        icon: 'mdi:star-circle',
        accent: '#ca8a04' // 琥珀强调积分（避免紫系）
      },
      {
        key: 'rej',
        label: '验收不通过 (次)',
        value: s?.totalQaRejects ?? 0,
        icon: 'mdi:undo-variant',
        accent: '#F56C6C' // Element Danger
      },
      {
        key: 'avg',
        label: '人均综合分',
        value: s?.avgCompositeScore ?? '—',
        icon: 'mdi:speedometer',
        accent: '#73767A' // Element Info
      },
      {
        key: 'ot',
        label: '整体按期交付率 (%)',
        value: s?.avgOnTimeRate ?? '—',
        icon: 'mdi:calendar-check',
        accent: '#00DDCB' // A cool teal for time
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
        minWidth: 256,
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
                h(ColorAvatar, {
                  name: displayName || '?',
                  gender: row.user.userGender ?? '',
                  size: 36
                })
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
        label: '综合得分',
        minWidth: 116,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true,
        formatter: (row: PerformanceStat) => row.compositeScore ?? '—'
      },
      {
        prop: 'compositeTier',
        label: '绩效评级',
        minWidth: 132,
        align: 'center',
        showOverflowTooltip: true,
        formatter: (row: PerformanceStat) => {
          const t = (row.compositeTier ?? 'C') as RankIconTier;
          return h('div', { class: 'perf-tier-cell' }, [h(RankIcon, { tier: t, size: 40 })]);
        }
      },
      {
        prop: 'totalTasks',
        label: '计入考核任务数',
        minWidth: 168,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true
      },
      {
        prop: 'mainResponsibleTasks',
        label: '主责任务数',
        minWidth: 120,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true,
        formatter: (row: PerformanceStat) => row.mainResponsibleTasks ?? 0
      },
      {
        prop: 'firstPassRate',
        label: '首通率',
        minWidth: 156,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true,
        formatter: (row: PerformanceStat) =>
          h(ElProgress, {
            percentage: row.firstPassRate,
            strokeWidth: 8,
            color:
              row.firstPassRate >= 80 ? '#67c23a' : row.firstPassRate >= 50 ? '#e6a23c' : '#f56c6c'
          })
      },
      {
        prop: 'medianLeadTimeDays',
        label: '交付周期中位数',
        showOverflowTooltip: true,
        minWidth: 172,
        align: 'center',
        sortable: true,
        formatter: (row: PerformanceStat) =>
          row.medianLeadTimeDays != null ? `${row.medianLeadTimeDays} 天` : '—'
      },
      {
        prop: 'onTimeRate',
        label: '按期交付率',
        minWidth: 156,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true,
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
        prop: 'hoursAccuracyAvg',
        label: '工时估算准确率',
        minWidth: 164,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true,
        formatter: (row: PerformanceStat) =>
          row.hoursAccuracyAvg != null ? `${row.hoursAccuracyAvg}%` : '—'
      },
      {
        prop: 'qaRejectCount',
        label: '验收返工次数',
        minWidth: 148,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true
      },
      {
        prop: 'workLogHours',
        label: '提报总工时',
        minWidth: 132,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true,
        formatter: (row: PerformanceStat) => `${row.workLogHours ?? 0}h`
      },
      {
        prop: 'coAssigneeCompletedCount',
        label: '协作完成的任务数',
        minWidth: 188,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true
      },
      {
        prop: 'testerCompletedCount',
        label: '参与验收的次数',
        minWidth: 164,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true
      },
      {
        prop: 'wipCount',
        label: '处理中任务（主要负责人）',
        minWidth: 236,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true
      },
      {
        prop: 'totalPoints',
        label: '积分合计',
        minWidth: 108,
        align: 'center',
        sortable: true,
        showOverflowTooltip: true
      },
      {
        prop: '_actions',
        label: '操作',
        width: 96,
        align: 'center',
        fixed: 'right',
        formatter: (row: PerformanceStat) =>
          h(ArtTableRowActions, {
            items: [{ key: 'detail', label: '详情', onClick: () => openDetail(row) }]
          })
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
    loadProjects();
    applySearchParams();
    void Promise.all([getData(), loadAllStats()]);
  });
</script>

<style scoped lang="scss">
  /* 基础布局：大块之间仅用同一 gap，避免与其它全局 margin 叠加以致参差不齐 */
  .perf-dashboard {
    --perf-section-gap: 24px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: var(--perf-section-gap);
    box-sizing: border-box;
    min-height: 100%;
    // background-color: var(--el-bg-color-page);
  }

  /* 抵消全局 `.art-table-card { margin-top: 12px }`，否则图表→表格会比其它相邻区块多出一段间距 */
  .perf-dashboard > .perf-table-card.art-table-card {
    margin-top: 0;
  }

  /* 统一面板基础样式 (顶部操作栏使用) */
  .perf-panel {
    background-color: var(--el-bg-color-overlay);
    border-radius: 12px; /* 更圆润的大气感 */
    border: 1px solid var(--el-border-color-light);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03); /* 细腻的阴影 */
  }

  /* ========== 顶部操作栏 ========== */
  .perf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 24px;
    padding: 20px 24px;
    flex-shrink: 0;
  }

  .perf-header__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .perf-header__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  .perf-header__icon {
    font-size: 28px;
  }

  .perf-header__title-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .perf-header__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.2;
  }

  .perf-header__sub {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .perf-header__toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  /* KPI：不再套整块 perf-panel，与图表区同宽（仅继承 .perf-dashboard 左右 padding） */
  .perf-kpi-shell {
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    background: transparent;
    border: none;
    box-shadow: none;
    border-radius: 0;
  }

  .perf-kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .premium-kpi-card {
    min-width: 0;
    width: 100%;
    background-color: var(--el-fill-color-blank);
    border-radius: 12px;
    border: 1px solid var(--el-border-color);
    position: relative;
    overflow: hidden; /* 裁剪水印图标 */
    transition:
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.05),
      0 6px 14px rgba(15, 23, 42, 0.06);
    box-sizing: border-box;
    cursor: default;

    /* 极轻微的背景渐变纹理 */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--kpi-accent) 4%, transparent) 0%,
        rgba(255, 255, 255, 0) 100%
      );
      opacity: 0.6;
      z-index: 1;
    }

    &:hover {
      transform: translateY(-4px);
      border-color: color-mix(in srgb, var(--kpi-accent) 32%, var(--el-border-color));
      box-shadow:
        0 2px 6px rgba(15, 23, 42, 0.06),
        0 14px 28px -10px color-mix(in srgb, var(--kpi-accent) 22%, rgba(15, 23, 42, 0.18));

      .premium-kpi-card__watermark {
        opacity: 0.12;
        transform: rotate(-5deg) scale(1.05);
      }
    }
  }

  /* 内部内容布局 */
  .premium-kpi-card__inner {
    position: relative;
    z-index: 2; /* 浮于纹理之上 */
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: 100%;
    box-sizing: border-box;
  }

  .premium-kpi-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .premium-kpi-card__label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.5px;
  }

  .premium-kpi-card__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background-color: color-mix(in srgb, var(--kpi-accent) 12%, transparent);
    color: var(--kpi-accent);
    flex-shrink: 0;
  }

  .premium-kpi-card__icon {
    font-size: 16px;
  }

  .premium-kpi-card__data {
    display: flex;
    align-items: flex-end;
  }

  .premium-kpi-card__value {
    margin: 0;
    font-size: 32px; /* 更醒目的大数字 */
    font-weight: 800; /* 更厚实的字重 */
    color: var(--el-text-color-primary);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    font-family: var(--el-font-family); /* 确保使用 Element 标准字体，看起来专业序列 */
  }

  /* 背景水印图标 (炫酷感核心) */
  .premium-kpi-card__watermark {
    position: absolute;
    bottom: -15px;
    right: -10px;
    font-size: 90px;
    color: var(--kpi-accent);
    opacity: 0.06; /* 极轻微的显示 */
    transform: rotate(-10deg);
    transition: all 0.3s ease-in-out;
    z-index: 0; /* 在最底层 */

    :deep(.art-svg-icon) {
      fill: currentColor;
    }
  }

  /* ========== 图表与表格 ========== */
  .perf-charts {
    flex-shrink: 0;
  }

  .perf-table-card {
    flex: 1;
    min-height: 480px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-light);
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  }

  .perf-table-title {
    font-weight: 600;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  /* 修复表格内部撑开问题 */
  .perf-table-card :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
    min-height: 0;
  }

  /* 表头样式微调，保持专业留白 */
  .perf-table-card :deep(.perf-art-table .el-table__header th.el-table__cell) {
    background: var(--el-fill-color-light);
  }

  .perf-table-card :deep(.perf-art-table .el-table__header th.el-table__cell .cell) {
    white-space: normal;
    line-height: 1.38;
    word-break: keep-all;
    padding: 12px 10px;
    font-size: 13px;
    font-weight: 600;
  }

  .perf-table-card :deep(.perf-art-table .el-table__body td.el-table__cell .cell) {
    padding: 10px;
    font-size: 13px;
  }

  /* 成员信息列 */
  :deep(.perf-member-cell) {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  :deep(.perf-member-cell__text) {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  :deep(.perf-member-cell__name) {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  :deep(.perf-member-cell__email) {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.perf-tier-cell) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
  }
</style>
