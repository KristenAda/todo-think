<template>
  <div class="performance-wrapper art-full-height">
    <div class="page-header">
      <div class="header-left">
        <art-svg-icon
          icon="mdi:chart-bar"
          style="font-size: 22px; color: var(--el-color-primary)"
        />
        <span class="page-title">研发效能统计</span>
        <span class="page-sub">基于已完成任务的绩效数据分析</span>
      </div>
      <div class="header-right">
        <el-select
          v-model="filterProjectId"
          placeholder="全部项目"
          clearable
          style="width: 200px"
          @change="onProjectChange"
        >
          <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-button :loading="loading" @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 汇总卡片 -->
    <div class="summary-cards">
      <div class="s-card">
        <div class="s-icon" style="background: #e8f4fd">
          <art-svg-icon icon="mdi:account-group" style="color: #409eff; font-size: 26px" />
        </div>
        <div class="s-info">
          <div class="s-val">{{ allStats.length }}</div>
          <div class="s-label">参与人数</div>
        </div>
      </div>
      <div class="s-card">
        <div class="s-icon" style="background: #e8f9f0">
          <art-svg-icon icon="mdi:check-decagram" style="color: #67c23a; font-size: 26px" />
        </div>
        <div class="s-info">
          <div class="s-val">{{ totalTasks }}</div>
          <div class="s-label">总完成任务</div>
        </div>
      </div>
      <div class="s-card">
        <div class="s-icon" style="background: #fff8e6">
          <art-svg-icon icon="mdi:clock-check" style="color: #e6a23c; font-size: 26px" />
        </div>
        <div class="s-info">
          <div class="s-val">{{ totalHours }}h</div>
          <div class="s-label">总实际工时</div>
        </div>
      </div>
      <div class="s-card">
        <div class="s-icon" style="background: #fef0f0">
          <art-svg-icon icon="mdi:bug" style="color: #f56c6c; font-size: 26px" />
        </div>
        <div class="s-info">
          <div class="s-val">{{ totalBugs }}</div>
          <div class="s-label">总Bug数</div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title">预估 vs 实际工时对比</div>
        <div ref="hoursChartRef" class="chart-box"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Bug 密度 &amp; 一次通过率</div>
        <div ref="bugChartRef" class="chart-box"></div>
      </div>
    </div>

    <!-- 明细表格 -->
    <ElCard class="art-table-card detail-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <span class="table-section-title">个人绩效明细</span>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick, h } from 'vue';
  import { ElTag, ElProgress, ElAvatar } from 'element-plus';
  import { fetchPerformanceStats, fetchProjectList } from '@/api/task';
  import { useTable } from '@/hooks/core/useTable';
  import * as echarts from 'echarts/core';
  import { BarChart } from 'echarts/charts';
  import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';

  echarts.use([BarChart, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer]);

  defineOptions({ name: 'Performance' });

  type PerformanceStat = Api.Task.PerformanceStat;
  type SimpleUser = Api.Task.SimpleUser;

  const filterProjectId = ref<number | undefined>(undefined);
  const projectList = ref<Api.Task.SimpleProject[]>([]);
  const hoursChartRef = ref<HTMLElement | null>(null);
  const bugChartRef = ref<HTMLElement | null>(null);
  let hoursChart: echarts.ECharts | null = null;
  let bugChart: echarts.ECharts | null = null;

  // 全量数据：用于图表和汇总卡片
  const allStats = ref<PerformanceStat[]>([]);

  const totalTasks = computed(() => allStats.value.reduce((s, r) => s + r.totalTasks, 0));
  const totalHours = computed(() =>
    allStats.value.reduce((s, r) => s + r.totalActualHours, 0).toFixed(1)
  );
  const totalBugs = computed(() => allStats.value.reduce((s, r) => s + r.totalBugCount, 0));

  function initials(u: SimpleUser) {
    return (u.nickName || u.userName)?.[0]?.toUpperCase() ?? '?';
  }

  function passRateColor(rate: number) {
    return rate >= 80 ? '#67c23a' : rate >= 50 ? '#e6a23c' : '#f56c6c';
  }

  function grade(row: PerformanceStat) {
    if (row.firstPassRate >= 80 && row.totalBugCount === 0) return 'S';
    if (row.firstPassRate >= 60) return 'A';
    if (row.firstPassRate >= 40) return 'B';
    return 'C';
  }

  function gradeTagType(row: PerformanceStat): 'success' | 'primary' | 'warning' | 'danger' {
    const g = grade(row);
    return g === 'S' ? 'success' : g === 'A' ? 'primary' : g === 'B' ? 'warning' : 'danger';
  }

  // ==================== useTable ====================
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
      apiParams: {
        page: 1,
        pageSize: 10
      },

      // 后端用 page/pageSize，而非默认的 current/size
      paginationKey: { current: 'page', size: 'pageSize' },
      immediate: false,
      columnsFactory: () => [
        {
          prop: 'user',
          label: '成员',
          minWidth: 180,
          formatter: (row: PerformanceStat) => {
            const displayName = row.user.nickName || row.user.userName;
            return h('div', { class: 'user-cell' }, [
              h(ElAvatar, { size: 28, src: row.user.avatar ?? undefined }, () =>
                initials(row.user)
              ),
              h('span', {}, displayName)
            ]);
          }
        },
        {
          prop: 'totalTasks',
          label: '完成任务',
          width: 150,
          align: 'center',
          sortable: true
        },
        {
          prop: 'totalEstimatedHours',
          label: '预估工时',
          width: 150,
          align: 'center',
          sortable: true,
          formatter: (row: PerformanceStat) => `${row.totalEstimatedHours.toFixed(1)}h`
        },
        {
          prop: 'totalActualHours',
          label: '实际工时',
          width: 150,
          align: 'center',
          sortable: true,
          formatter: (row: PerformanceStat) => `${row.totalActualHours.toFixed(1)}h`
        },
        {
          prop: 'hoursDiff',
          label: '工时偏差',
          width: 150,
          align: 'center',
          formatter: (row: PerformanceStat) => {
            const diff = row.totalActualHours - row.totalEstimatedHours;
            const cls = diff > 0 ? 'text-danger' : 'text-success';
            return h('span', { class: cls }, `${diff.toFixed(1)}h`);
          }
        },
        {
          prop: 'totalBugCount',
          label: 'Bug数',
          width: 150,
          align: 'center',
          sortable: true
        },
        {
          prop: 'firstPassRate',
          label: '一次通过率',
          width: 150,
          align: 'center',
          sortable: true,
          formatter: (row: PerformanceStat) =>
            h(ElProgress, {
              percentage: row.firstPassRate,
              strokeWidth: 8,
              color: passRateColor(row.firstPassRate)
            })
        },
        {
          prop: 'grade',
          label: '综合评级',
          width: 100,
          align: 'center',
          formatter: (row: PerformanceStat) =>
            h(ElTag, { type: gradeTagType(row), size: 'small' }, () => grade(row))
        }
      ]
    },
    hooks: {
      onSuccess: () => {
        // 数据加载成功后更新图表（使用当前分页数据）
        nextTick(() => renderCharts());
      }
    }
  });

  /** 加载全量数据（用于图表和汇总卡片） */
  async function loadAllStats() {
    const result = await fetchPerformanceStats({
      page: 1,
      pageSize: 1000,
      projectId: filterProjectId.value
    });
    allStats.value = result.list;
    await nextTick();
    renderCharts();
  }

  async function loadProjects() {
    const list = await fetchProjectList();
    projectList.value = list;
  }

  /** 切换项目时同步搜索参数并重新加载 */
  async function onProjectChange() {
    (searchParams as Record<string, unknown>).projectId = filterProjectId.value;
    await Promise.all([refreshData(), loadAllStats()]);
  }

  function renderCharts() {
    const names = allStats.value.map((s) => s.user.nickName || s.user.userName);

    if (hoursChartRef.value) {
      if (!hoursChart) hoursChart = echarts.init(hoursChartRef.value);
      hoursChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['预估工时', '实际工时'] },
        grid: { left: 40, right: 20, bottom: 40, top: 40 },
        xAxis: { type: 'category', data: names, axisLabel: { rotate: 30 } },
        yAxis: { type: 'value', name: '小时' },
        series: [
          {
            name: '预估工时',
            type: 'bar',
            data: allStats.value.map((s) => +s.totalEstimatedHours.toFixed(1)),
            itemStyle: { color: '#409eff' }
          },
          {
            name: '实际工时',
            type: 'bar',
            data: allStats.value.map((s) => +s.totalActualHours.toFixed(1)),
            itemStyle: { color: '#67c23a' }
          }
        ]
      });
    }

    if (bugChartRef.value) {
      if (!bugChart) bugChart = echarts.init(bugChartRef.value);
      bugChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['Bug数', '一次通过率(%)'] },
        grid: { left: 40, right: 60, bottom: 40, top: 40 },
        xAxis: { type: 'category', data: names, axisLabel: { rotate: 30 } },
        yAxis: [
          { type: 'value', name: 'Bug数' },
          {
            type: 'value',
            name: '通过率(%)',
            min: 0,
            max: 100,
            axisLabel: { formatter: '{value}%' }
          }
        ],
        series: [
          {
            name: 'Bug数',
            type: 'bar',
            data: allStats.value.map((s) => s.totalBugCount),
            itemStyle: { color: '#f56c6c' }
          },
          {
            name: '一次通过率(%)',
            type: 'bar',
            yAxisIndex: 1,
            data: allStats.value.map((s) => s.firstPassRate),
            itemStyle: { color: '#e6a23c' }
          }
        ]
      });
    }
  }

  onMounted(() => {
    loadProjects();
    // searchParams 初始化项目过滤
    (searchParams as Record<string, unknown>).projectId = filterProjectId.value;
    Promise.all([getData(), loadAllStats()]);
  });
</script>

<style scoped lang="scss">
  .performance-wrapper {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--art-main-bg-color, #fff);
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .page-title {
      font-size: 18px;
      font-weight: 700;
    }

    .page-sub {
      font-size: 13px;
      color: #999;
    }

    .header-right {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .s-card {
    background: var(--art-main-bg-color, #fff);
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    gap: 16px;

    .s-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .s-val {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
    }

    .s-label {
      font-size: 13px;
      color: #999;
      margin-top: 4px;
    }
  }

  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .chart-card {
    background: var(--art-main-bg-color, #fff);
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .chart-title {
      font-weight: 600;
      margin-bottom: 12px;
    }

    .chart-box {
      height: 280px;
    }
  }

  .detail-table-card {
    flex: 1;
    min-height: 480px;

    :deep(.el-card__body) {
      min-height: 420px;
    }
  }

  .table-section-title {
    font-weight: 600;
    font-size: 15px;
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .text-danger {
    color: #f56c6c;
    font-weight: 600;
  }

  .text-success {
    color: #67c23a;
    font-weight: 600;
  }
</style>
