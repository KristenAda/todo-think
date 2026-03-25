<template>
  <div class="performance-wrapper">
    <div class="page-header">
      <div class="header-left">
        <art-svg-icon icon="mdi:chart-bar" style="font-size:22px;color:var(--el-color-primary)" />
        <span class="page-title">研发效能统计</span>
        <span class="page-sub">基于已完成任务的绩效数据分析</span>
      </div>
      <div class="header-right">
        <el-select v-model="filterProjectId" placeholder="全部项目" clearable style="width:200px" @change="loadStats">
          <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-button :loading="loading" @click="loadStats">刷新</el-button>
      </div>
    </div>

    <!-- 汇总卡片 -->
    <div class="summary-cards">
      <div class="s-card">
        <div class="s-icon" style="background:#e8f4fd"><art-svg-icon icon="mdi:account-group" style="color:#409eff;font-size:26px" /></div>
        <div class="s-info"><div class="s-val">{{ stats.length }}</div><div class="s-label">参与人数</div></div>
      </div>
      <div class="s-card">
        <div class="s-icon" style="background:#e8f9f0"><art-svg-icon icon="mdi:check-decagram" style="color:#67c23a;font-size:26px" /></div>
        <div class="s-info"><div class="s-val">{{ totalTasks }}</div><div class="s-label">总完成任务</div></div>
      </div>
      <div class="s-card">
        <div class="s-icon" style="background:#fff8e6"><art-svg-icon icon="mdi:clock-check" style="color:#e6a23c;font-size:26px" /></div>
        <div class="s-info"><div class="s-val">{{ totalHours }}h</div><div class="s-label">总实际工时</div></div>
      </div>
      <div class="s-card">
        <div class="s-icon" style="background:#fef0f0"><art-svg-icon icon="mdi:bug" style="color:#f56c6c;font-size:26px" /></div>
        <div class="s-info"><div class="s-val">{{ totalBugs }}</div><div class="s-label">总Bug数</div></div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title">预估 vs 实际工时对比</div>
        <div ref="hoursChartRef" class="chart-box"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Bug 密度 & 一次通过率</div>
        <div ref="bugChartRef" class="chart-box"></div>
      </div>
    </div>

    <!-- 明细表格 -->
    <div class="table-card">
      <div class="table-title">个人绩效明细</div>
      <el-table v-loading="loading" :data="stats" stripe border>
        <el-table-column label="成员" width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" :src="row.user.avatar ?? undefined">{{ initials(row.user) }}</el-avatar>
              <span>{{ row.user.nickName || row.user.userName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="totalTasks" label="完成任务" width="100" align="center" sortable />
        <el-table-column label="预估工时" width="100" align="center" sortable :sort-method="(a,b) => a.totalEstimatedHours - b.totalEstimatedHours">
          <template #default="{ row }">{{ row.totalEstimatedHours.toFixed(1) }}h</template>
        </el-table-column>
        <el-table-column label="实际工时" width="100" align="center" sortable :sort-method="(a,b) => a.totalActualHours - b.totalActualHours">
          <template #default="{ row }">{{ row.totalActualHours.toFixed(1) }}h</template>
        </el-table-column>
        <el-table-column label="工时偏差" width="110" align="center">
          <template #default="{ row }">
            <span :class="row.totalActualHours > row.totalEstimatedHours ? 'text-danger' : 'text-success'">
              {{ (row.totalActualHours - row.totalEstimatedHours).toFixed(1) }}h
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="totalBugCount" label="Bug数" width="90" align="center" sortable />
        <el-table-column label="一次通过率" width="120" align="center" sortable :sort-method="(a,b) => a.firstPassRate - b.firstPassRate">
          <template #default="{ row }">
            <el-progress :percentage="row.firstPassRate" :stroke-width="8" :color="passRateColor(row.firstPassRate)" />
          </template>
        </el-table-column>
        <el-table-column label="综合评级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="gradeTagType(row)" size="small">{{ grade(row) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { fetchPerformanceStats, fetchProjectList } from '@/api/task';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer]);

const loading = ref(false);
const stats = ref<Api.Task.PerformanceStat[]>([]);
const projectList = ref<Api.Task.SimpleProject[]>([]);
const filterProjectId = ref<number | undefined>(undefined);
const hoursChartRef = ref<HTMLElement | null>(null);
const bugChartRef = ref<HTMLElement | null>(null);
let hoursChart: echarts.ECharts | null = null;
let bugChart: echarts.ECharts | null = null;

const totalTasks = computed(() => stats.value.reduce((s, r) => s + r.totalTasks, 0));
const totalHours = computed(() => stats.value.reduce((s, r) => s + r.totalActualHours, 0).toFixed(1));
const totalBugs = computed(() => stats.value.reduce((s, r) => s + r.totalBugCount, 0));

function initials(u: Api.Task.SimpleUser) { return (u.nickName || u.userName)?.[0]?.toUpperCase() ?? '?'; }
function passRateColor(rate: number) { return rate >= 80 ? '#67c23a' : rate >= 50 ? '#e6a23c' : '#f56c6c'; }
function grade(row: Api.Task.PerformanceStat) {
  if (row.firstPassRate >= 80 && row.totalBugCount === 0) return 'S';
  if (row.firstPassRate >= 60) return 'A';
  if (row.firstPassRate >= 40) return 'B';
  return 'C';
}
function gradeTagType(row: Api.Task.PerformanceStat) {
  const g = grade(row);
  return g === 'S' ? 'success' : g === 'A' ? '' : g === 'B' ? 'warning' : 'danger';
}

async function loadStats() {
  loading.value = true;
  try {
    const res = await fetchPerformanceStats(filterProjectId.value);
    if (res.data?.code === 200) { stats.value = res.data.data; }
  } finally { loading.value = false; await nextTick(); renderCharts(); }
}

async function loadProjects() {
  const res = await fetchProjectList();
  if (res.data?.code === 200) projectList.value = res.data.data;
}

function renderCharts() {
  const names = stats.value.map(s => s.user.nickName || s.user.userName);

  // 工时图
  if (hoursChartRef.value) {
    if (!hoursChart) hoursChart = echarts.init(hoursChartRef.value);
    hoursChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['预估工时', '实际工时'] },
      grid: { left: 40, right: 20, bottom: 40, top: 40 },
      xAxis: { type: 'category', data: names, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '小时' },
      series: [
        { name: '预估工时', type: 'bar', data: stats.value.map(s => +s.totalEstimatedHours.toFixed(1)), itemStyle: { color: '#409eff' } },
        { name: '实际工时', type: 'bar', data: stats.value.map(s => +s.totalActualHours.toFixed(1)), itemStyle: { color: '#67c23a' } },
      ],
    });
  }

  // Bug / 通过率图
  if (bugChartRef.value) {
    if (!bugChart) bugChart = echarts.init(bugChartRef.value);
    bugChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Bug数', '一次通过率(%)'] },
      grid: { left: 40, right: 60, bottom: 40, top: 40 },
      xAxis: { type: 'category', data: names, axisLabel: { rotate: 30 } },
      yAxis: [
        { type: 'value', name: 'Bug数' },
        { type: 'value', name: '通过率(%)', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
      ],
      series: [
        { name: 'Bug数', type: 'bar', data: stats.value.map(s => s.totalBugCount), itemStyle: { color: '#f56c6c' } },
        { name: '一次通过率(%)', type: 'bar', yAxisIndex: 1, data: stats.value.map(s => s.firstPassRate), itemStyle: { color: '#e6a23c' } },
      ],
    });
  }
}

onMounted(() => { loadProjects(); loadStats(); });
</script>

<style scoped lang="scss">
.performance-wrapper { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--art-main-bg-color, #fff); padding: 16px 20px; border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  .header-left { display: flex; align-items: center; gap: 10px; }
  .page-title { font-size: 18px; font-weight: 700; }
  .page-sub { font-size: 13px; color: #999; }
  .header-right { display: flex; gap: 10px; align-items: center; }
}
.summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.s-card {
  background: var(--art-main-bg-color, #fff); border-radius: 10px; padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06); display: flex; align-items: center; gap: 16px;
  .s-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .s-val { font-size: 28px; font-weight: 700; line-height: 1; }
  .s-label { font-size: 13px; color: #999; margin-top: 4px; }
}
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card {
  background: var(--art-main-bg-color, #fff); border-radius: 8px; padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  .chart-title { font-weight: 600; margin-bottom: 12px; }
  .chart-box { height: 280px; }
}
.table-card {
  background: var(--art-main-bg-color, #fff); border-radius: 8px; padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  .table-title { font-weight: 600; margin-bottom: 14px; font-size: 15px; }
}
.user-cell { display: flex; align-items: center; gap: 8px; }
.text-danger { color: #f56c6c; font-weight: 600; }
.text-success { color: #67c23a; font-weight: 600; }
</style>
