<template>
  <div class="pdc-grid">
    <div class="pdc-card">
      <div class="pdc-card__title">综合效能分排名</div>
      <div ref="rankRef" class="pdc-card__chart" />
    </div>
    <div class="pdc-card">
      <div class="pdc-card__title">预估 vs 实际工时</div>
      <div ref="hoursRef" class="pdc-card__chart" />
    </div>
    <div class="pdc-card pdc-card--span2">
      <div class="pdc-card__head">
        <div>
          <div class="pdc-card__title">维度子分热力图</div>
          <p class="pdc-card__hint">行：成员；列：产出/质量/准时/速度/稳定（队内归一 0–100），颜色越深分越高</p>
        </div>
      </div>
      <div ref="heatmapRef" class="pdc-card__chart pdc-card__chart--heatmap" :style="{ height: heatmapHeightPx + 'px' }" />
    </div>
    <div class="pdc-card">
      <div class="pdc-card__title">完成事项类型分布</div>
      <div ref="typeRef" class="pdc-card__chart" />
    </div>
    <div class="pdc-card">
      <div class="pdc-card__title">交付周期 vs 准时率</div>
      <div ref="scatterRef" class="pdc-card__chart" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
  import * as echarts from 'echarts/core';
  import { BarChart, HeatmapChart, ScatterChart } from 'echarts/charts';
  import {
    TooltipComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
    VisualMapComponent
  } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';
  import { PERF_SUB_SCORE_KEYS, PERF_SUB_SCORE_LABEL, taskTypeLabel } from '@/enums/modules/performanceEnum';

  echarts.use([
    BarChart,
    HeatmapChart,
    ScatterChart,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
    VisualMapComponent,
    CanvasRenderer
  ]);

  defineOptions({ name: 'PerformanceDashboardCharts' });

  const props = defineProps<{
    allStats: Api.Task.PerformanceStat[];
    summary: Api.Task.PerformanceStatsSummary | null;
  }>();

  const rankRef = ref<HTMLElement | null>(null);
  const hoursRef = ref<HTMLElement | null>(null);
  const heatmapRef = ref<HTMLElement | null>(null);
  const typeRef = ref<HTMLElement | null>(null);
  const scatterRef = ref<HTMLElement | null>(null);

  let chRank: echarts.ECharts | null = null;
  let chHours: echarts.ECharts | null = null;
  let chHeatmap: echarts.ECharts | null = null;
  let chType: echarts.ECharts | null = null;
  let chScatter: echarts.ECharts | null = null;

  const primary = '#409eff';
  const green = '#67c23a';
  const warn = '#e6a23c';

  const heatmapHeightPx = computed(() => {
    const n = Math.max(1, props.allStats.length);
    return Math.min(560, Math.max(260, 56 + n * 24));
  });

  function disposeAll() {
    chRank?.dispose();
    chHours?.dispose();
    chHeatmap?.dispose();
    chType?.dispose();
    chScatter?.dispose();
    chRank = chHours = chHeatmap = chType = chScatter = null;
  }

  function shortName(s: Api.Task.PerformanceStat) {
    const n = s.user.nickName || s.user.userName || '?';
    return n.length > 8 ? `${n.slice(0, 7)}…` : n;
  }

  function renderAll() {
    const rows = [...props.allStats].sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0));
    const names = rows.map((s) => s.user.nickName || s.user.userName || '?');
    const heatmapYNames = rows.map(shortName);

    if (rankRef.value) {
      if (!chRank) chRank = echarts.init(rankRef.value);
      chRank.setOption({
        animationDurationUpdate: 420,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 8, right: 24, top: 16, bottom: 8, containLabel: true },
        xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { type: 'dashed' } } },
        yAxis: { type: 'category', data: names, inverse: true, axisLabel: { width: 72, overflow: 'truncate' } },
        series: [
          {
            name: '综合分',
            type: 'bar',
            data: rows.map((s) => s.compositeScore ?? 0),
            barMaxWidth: 22,
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#79bbff' },
                { offset: 1, color: primary }
              ])
            }
          }
        ]
      });
    }

    if (hoursRef.value) {
      if (!chHours) chHours = echarts.init(hoursRef.value);
      chHours.setOption({
        animationDurationUpdate: 420,
        tooltip: { trigger: 'axis' },
        legend: { top: 4, data: ['预估工时', '实际工时'], itemWidth: 12, itemHeight: 10 },
        grid: { left: 48, right: 16, bottom: 48, top: 36 },
        xAxis: {
          type: 'category',
          data: names,
          axisLabel: { rotate: names.length > 5 ? 28 : 0, interval: 0 }
        },
        yAxis: { type: 'value', name: '小时' },
        series: [
          {
            name: '预估工时',
            type: 'bar',
            barMaxWidth: 28,
            data: rows.map((s) => +(s.totalEstimatedHours ?? 0).toFixed(1)),
            itemStyle: { borderRadius: [4, 4, 0, 0], color: primary }
          },
          {
            name: '实际工时',
            type: 'bar',
            barMaxWidth: 28,
            data: rows.map((s) => +(s.totalActualHours ?? 0).toFixed(1)),
            itemStyle: { borderRadius: [4, 4, 0, 0], color: green }
          }
        ]
      });
    }

    const dimLabels = PERF_SUB_SCORE_KEYS.map((k) => PERF_SUB_SCORE_LABEL[k]);
    const heatData: [number, number, number][] = [];
    rows.forEach((row, yi) => {
      PERF_SUB_SCORE_KEYS.forEach((key, xi) => {
        heatData.push([xi, yi, Math.round(row.subScores?.[key] ?? 0)]);
      });
    });

    if (heatmapRef.value) {
      if (!chHeatmap) chHeatmap = echarts.init(heatmapRef.value);
      const showCellLabel = rows.length <= 12 && rows.length > 0;
      chHeatmap.setOption({
        animationDurationUpdate: 420,
        tooltip: {
          position: 'top',
          formatter: (p: { data?: [number, number, number] }) => {
            const d = p.data;
            if (!d) return '';
            const [xi, yi, val] = d;
            const person = rows[yi]?.user.nickName || rows[yi]?.user.userName || '—';
            const dim = dimLabels[xi] ?? '—';
            return `${person}<br/>${dim}：${val}`;
          }
        },
        grid: { left: 8, right: 12, top: 8, bottom: 56, containLabel: true },
        xAxis: {
          type: 'category',
          data: dimLabels,
          splitArea: { show: true },
          axisLabel: { interval: 0, fontSize: 11 }
        },
        yAxis: {
          type: 'category',
          data: heatmapYNames.length ? heatmapYNames : ['—'],
          splitArea: { show: true },
          axisLabel: { fontSize: 11 }
        },
        visualMap: {
          min: 0,
          max: 100,
          show: rows.length > 0,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: 4,
          itemWidth: 14,
          itemHeight: 120,
          // 浅色阶到中等蓝，避免近黑底；格内数字深色 + 白描边，在各明度上可读
          inRange: {
            color: ['#f8fafc', '#e0f2fe', '#bfdbfe', '#7dd3fc', '#38bdf8']
          },
          text: ['高', '低']
        },
        series: [
          {
            name: '子分',
            type: 'heatmap',
            data: heatData,
            label: {
              show: showCellLabel,
              fontSize: 11,
              fontWeight: 700,
              color: '#0f172a',
              textBorderColor: '#ffffff',
              textBorderWidth: 2
            },
            itemStyle: {
              borderColor: 'rgba(255,255,255,0.55)',
              borderWidth: 0.5
            },
            emphasis: {
              itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.25)' }
            }
          }
        ]
      });
    }

    const tb = props.summary?.tasksByType ?? {};
    const typeEntries = Object.entries(tb)
      .map(([k, v]) => ({ code: k, label: taskTypeLabel(k), value: v }))
      .sort((a, b) => b.value - a.value);
    if (typeRef.value) {
      if (!chType) chType = echarts.init(typeRef.value);
      chType.setOption({
        animationDurationUpdate: 420,
        tooltip: {
          trigger: 'axis',
          formatter: (params: unknown) => {
            const list = Array.isArray(params) ? params : [params];
            const it = list[0] as { axisValue?: string; marker?: string; data?: number };
            if (!it?.axisValue) return '';
            return `${it.marker ?? ''}${it.axisValue}<br/>完成数：${it.data ?? ''}`;
          }
        },
        grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true },
        xAxis: {
          type: 'value',
          name: '完成数',
          nameLocation: 'middle',
          nameGap: 28,
          nameTextStyle: { fontSize: 11 },
          splitLine: { lineStyle: { type: 'dashed' } }
        },
        yAxis: {
          type: 'category',
          data: typeEntries.map((e) => e.label),
          inverse: true,
          axisLabel: { fontSize: 11, width: 88, overflow: 'truncate' }
        },
        series: [
          {
            type: 'bar',
            data: typeEntries.map((e) => e.value),
            barMaxWidth: 22,
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: warn },
                { offset: 1, color: primary }
              ])
            }
          }
        ]
      });
    }

    if (scatterRef.value) {
      if (!chScatter) chScatter = echarts.init(scatterRef.value);
      chScatter.setOption({
        animationDurationUpdate: 420,
        tooltip: {
          formatter: (p: any) => {
            const d = p.data as number[];
            return `${p.marker}${p.data?.[2] ?? ''}<br/>周期: ${d[0]} 天<br/>准时率: ${d[1]}%`;
          }
        },
        grid: { left: 48, right: 16, top: 24, bottom: 40 },
        xAxis: {
          type: 'value',
          name: '周期(天)',
          nameLocation: 'middle',
          nameGap: 28,
          splitLine: { lineStyle: { type: 'dashed' } }
        },
        yAxis: {
          type: 'value',
          name: '准时率%',
          max: 100,
          splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: [
          {
            type: 'scatter',
            symbolSize: (val: unknown) => {
              const d = val as number[];
              const tasks = typeof d[3] === 'number' ? d[3] : 0;
              return Math.min(28, 10 + tasks * 1.2);
            },
            data: rows.map((s) => [
              s.medianLeadTimeDays ?? 0,
              s.onTimeRate ?? 0,
              s.user.nickName || s.user.userName,
              s.totalTasks
            ]),
            itemStyle: {
              shadowBlur: 12,
              shadowColor: 'rgba(64,158,255,0.35)',
              color: primary
            }
          }
        ]
      });
    }
  }

  function onResize() {
    chRank?.resize();
    chHours?.resize();
    chHeatmap?.resize();
    chType?.resize();
    chScatter?.resize();
  }

  watch(
    () => [props.allStats, props.summary, heatmapHeightPx.value] as const,
    () => {
      nextTick(() => {
        renderAll();
        onResize();
      });
    },
    { deep: true }
  );

  onMounted(() => {
    nextTick(() => renderAll());
    window.addEventListener('resize', onResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    disposeAll();
  });
</script>

<style scoped lang="scss">
  .pdc-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .pdc-card--span2 {
    grid-column: 1 / -1;
  }

  @media (max-width: 1100px) {
    .pdc-grid {
      grid-template-columns: 1fr;
    }

    .pdc-card--span2 {
      grid-column: auto;
    }
  }

  .pdc-card {
    background: var(--art-main-bg-color, #fff);
    border-radius: 12px;
    padding: 14px 16px 10px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(64, 158, 255, 0.08);
  }

  .pdc-card__head {
    margin-bottom: 6px;
  }

  .pdc-card__title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .pdc-card__hint {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--el-text-color-secondary);
  }

  .pdc-card__chart {
    height: 280px;
  }

  .pdc-card__chart--heatmap {
    height: 280px;
  }
</style>
