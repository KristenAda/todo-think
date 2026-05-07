<template>
  <div class="pdc-grid">
    <div class="pdc-card pdc-card--modern pdc-card--rank">
      <div class="pdc-card__title-row">
        <span class="pdc-card__title">综合得分</span>
        <span class="pdc-card__badge">按分数从高到低</span>
      </div>
      <div ref="rankRef" class="pdc-card__chart" />
    </div>
    <div class="pdc-card pdc-card--modern pdc-card--hours">
      <div class="pdc-card__title-row">
        <span class="pdc-card__title">预估 vs 实际工时</span>
        <span class="pdc-card__badge pdc-card__badge--hours">双柱对比</span>
      </div>
      <div ref="hoursRef" class="pdc-card__chart" />
    </div>
    <div class="pdc-card pdc-card--span2 pdc-card--modern pdc-card--heatmap">
      <div class="pdc-card__head">
        <div class="pdc-card__head-inner">
          <div class="pdc-card__title-row">
            <span class="pdc-card__title">五维对比热力图</span>
            <span class="pdc-card__badge pdc-card__badge--soft">0–100</span>
          </div>
          <p class="pdc-card__hint">
            同组相对分位值（0～100）：色阶表示统计范围内相对排名，非原始任务得分。
          </p>
        </div>
      </div>
      <div ref="heatmapRef" class="pdc-card__chart pdc-card__chart--heatmap" :style="{ height: heatmapHeightPx + 'px' }" />
    </div>
    <div class="pdc-card pdc-card--modern pdc-card--type">
      <div class="pdc-card__title-row">
        <span class="pdc-card__title">完成事项类型分布</span>
        <span class="pdc-card__badge">主要负责人完成</span>
      </div>
      <div ref="typeRef" class="pdc-card__chart pdc-card__chart--tall" />
    </div>
    <div class="pdc-card pdc-card--modern pdc-card--pace">
      <div class="pdc-card__title-row">
        <span class="pdc-card__title">交付周期与按期交付</span>
        <span class="pdc-card__badge pdc-card__badge--pace">双轴 · 柱线</span>
      </div>
      <p class="pdc-card__hint pdc-card__hint--compact">
        柱状：交付周期中位数（天） · 折线：按期交付率（%），成员顺序与综合得分排名一致。
      </p>
      <div ref="paceRef" class="pdc-card__chart pdc-card__chart--tall" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
  import * as echarts from 'echarts/core';
  import { BarChart, HeatmapChart, LineChart } from 'echarts/charts';
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
    LineChart,
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
  const paceRef = ref<HTMLElement | null>(null);

  let chRank: echarts.ECharts | null = null;
  let chHours: echarts.ECharts | null = null;
  let chHeatmap: echarts.ECharts | null = null;
  let chType: echarts.ECharts | null = null;
  let chPace: echarts.ECharts | null = null;

  const primary = '#409eff';
  const green = '#67c23a';
  const warn = '#e6a23c';

  /** 深色悬浮卡片风格 tooltip，适配浅色卡片上的图表 */
  const tooltipModernDark = {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderColor: 'rgba(148, 163, 184, 0.38)',
    borderWidth: 1,
    padding: [10, 14],
    textStyle: { color: '#f1f5f9', fontSize: 12 }
  };

  /** 排行横条：靠前偏亮青、靠后偏海蓝/青绿（无紫系） */
  function rankBarGradient(index: number, total: number) {
    const t = total <= 1 ? 0 : index / (total - 1);
    const c1 = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: '#7dd3fc' },
      { offset: 0.45, color: '#22d3ee' },
      { offset: 1, color: '#0891b2' }
    ]);
    const c2 = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: '#a5f3fc' },
      { offset: 0.5, color: '#38bdf8' },
      { offset: 1, color: '#0284c7' }
    ]);
    return t < 0.35 ? c2 : c1;
  }

  /** 每项横向条形：青 / 绿 / 琥珀 / 红 / 蓝系渐变（无紫） */
  const TYPE_GRADIENT_STOPS: [string, string][] = [
    ['#bae6fd', '#0369a1'],
    ['#a7f3d0', '#047857'],
    ['#fde68a', '#b45309'],
    ['#fecaca', '#b91c1c'],
    ['#99f6e4', '#0f766e'],
    ['#fed7aa', '#c2410c'],
    ['#cffafe', '#0e7490']
  ];

  function typeBarGradient(index: number) {
    const [light, deep] = TYPE_GRADIENT_STOPS[index % TYPE_GRADIENT_STOPS.length];
    return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: light },
      { offset: 1, color: deep }
    ]);
  }

  const heatmapHeightPx = computed(() => {
    const n = Math.max(1, props.allStats.length);
    return Math.min(640, Math.max(312, 72 + n * 26));
  });

  function disposeAll() {
    chRank?.dispose();
    chHours?.dispose();
    chHeatmap?.dispose();
    chType?.dispose();
    chPace?.dispose();
    chRank = chHours = chHeatmap = chType = chPace = null;
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
      const nRows = rows.length;
      chRank.setOption({
        animationDurationUpdate: 520,
        animationEasingUpdate: 'cubicOut',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
            shadowStyle: { color: 'rgba(14, 165, 233, 0.1)' }
          },
          ...tooltipModernDark,
          formatter: (params: unknown) => {
            const list = Array.isArray(params) ? params : [params];
            const it = list[0] as {
              axisValue?: string;
              data?: number | { value?: number };
              marker?: string;
            };
            const raw = it.data;
            let v = 0;
            if (typeof raw === 'number') v = raw;
            else if (raw && typeof raw === 'object' && 'value' in raw)
              v = Number((raw as { value: number }).value);
            return `${it.axisValue ?? ''}<br/>${it.marker ?? ''}综合得分 <b>${v}</b>`;
          }
        },
        grid: { left: 4, right: 36, top: 10, bottom: 10, containLabel: true },
        xAxis: {
          type: 'value',
          max: 100,
          splitNumber: 5,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: {
            lineStyle: { color: 'rgba(148, 163, 184, 0.35)', type: [4, 4] }
          }
        },
        yAxis: {
          type: 'category',
          data: names,
          inverse: true,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            width: 76,
            overflow: 'truncate',
            color: '#334155',
            fontSize: 12,
            fontWeight: 500
          }
        },
        series: [
          {
            name: '得分',
            type: 'bar',
            data: rows.map((s, i) => ({
              value: s.compositeScore ?? 0,
              itemStyle: {
                borderRadius: [0, 10, 10, 0],
                shadowBlur: 10,
                shadowColor: 'rgba(8, 145, 178, 0.28)',
                shadowOffsetY: 2,
                color: rankBarGradient(i, Math.max(1, nRows))
              }
            })),
            barMaxWidth: 20,
            label: {
              show: nRows <= 16,
              position: 'right',
              distance: 6,
              formatter: '{c}',
              fontSize: 11,
              fontWeight: 600,
              color: '#64748b'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 16,
                shadowColor: 'rgba(2, 132, 199, 0.38)'
              }
            }
          }
        ]
      });
    }

    if (hoursRef.value) {
      if (!chHours) chHours = echarts.init(hoursRef.value);
      chHours.setOption({
        animationDurationUpdate: 480,
        animationEasingUpdate: 'cubicOut',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(59, 130, 246, 0.06)' } },
          ...tooltipModernDark
        },
        legend: {
          top: 2,
          right: 8,
          data: ['预估工时', '实际工时'],
          itemWidth: 12,
          itemHeight: 10,
          textStyle: { color: '#64748b', fontSize: 11 }
        },
        grid: { left: 8, right: 12, bottom: names.length > 5 ? 52 : 40, top: 32, containLabel: true },
        xAxis: {
          type: 'category',
          data: names,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            rotate: names.length > 5 ? 28 : 0,
            interval: 0,
            color: '#475569',
            fontSize: 11
          }
        },
        yAxis: {
          type: 'value',
          name: '小时',
          nameTextStyle: { color: '#94a3b8', fontSize: 11, fontWeight: 500 },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: {
            lineStyle: { color: 'rgba(148, 163, 184, 0.35)', type: [4, 4] }
          }
        },
        series: [
          {
            name: '预估工时',
            type: 'bar',
            barGap: '12%',
            barMaxWidth: 22,
            data: rows.map((s) => +(s.totalEstimatedHours ?? 0).toFixed(1)),
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              shadowBlur: 6,
              shadowColor: 'rgba(59, 130, 246, 0.2)',
              color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                { offset: 0, color: '#93c5fd' },
                { offset: 1, color: primary }
              ])
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(59, 130, 246, 0.35)'
              }
            }
          },
          {
            name: '实际工时',
            type: 'bar',
            barMaxWidth: 22,
            data: rows.map((s) => +(s.totalActualHours ?? 0).toFixed(1)),
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              shadowBlur: 6,
              shadowColor: 'rgba(34, 197, 94, 0.22)',
              color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                { offset: 0, color: '#86efac' },
                { offset: 1, color: green }
              ])
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(34, 197, 94, 0.38)'
              }
            }
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
        animationDurationUpdate: 480,
        animationEasingUpdate: 'cubicOut',
        tooltip: {
          position: 'top',
          ...tooltipModernDark,
          formatter: (p: { data?: [number, number, number] }) => {
            const d = p.data;
            if (!d) return '';
            const [xi, yi, val] = d;
            const person = rows[yi]?.user.nickName || rows[yi]?.user.userName || '—';
            const dim = dimLabels[xi] ?? '—';
            return `<span style="opacity:.85">${person}</span><br/><b>${dim}</b> · ${val}`;
          }
        },
        /** bottom 预留：X 轴标签 + 与底部色阶条的安全间距（色条为横向：itemWidth×itemHeight） */
        grid: { left: 4, right: 8, top: 14, bottom: 108, containLabel: true },
        xAxis: {
          type: 'category',
          data: dimLabels,
          axisLine: { show: false },
          axisTick: { show: false },
          splitArea: { show: false },
          axisLabel: {
            interval: 0,
            fontSize: 11,
            color: '#475569',
            fontWeight: 500,
            margin: 10
          }
        },
        yAxis: {
          type: 'category',
          data: heatmapYNames.length ? heatmapYNames : ['—'],
          axisLine: { show: false },
          axisTick: { show: false },
          splitArea: { show: false },
          axisLabel: { fontSize: 11, color: '#475569' }
        },
        visualMap: {
          min: 0,
          max: 100,
          show: rows.length > 0,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: 14,
          /**
           * ECharts continuous + orient:horizontal 会对色条做 90° 旋转，
           * 故 itemSize 与肉眼「横向长条」的长/厚是反过来的：需「小×大」才能得到底部长条。
           * （误设为 大×小 会在图区中间出现又细又高的竖条。）
           */
          itemWidth: 20,
          itemHeight: 220,
          borderRadius: 8,
          padding: [6, 12, 4, 12],
          text: ['高', '低'],
          textStyle: { color: '#64748b', fontSize: 11 },
          /**
           * 色阶协调：背景与卡片为浅中性冷灰，正文/边框多为 slate。
           * 热力图避免高饱和深蓝（抢主按钮与标题），亦不用深绿。
           * 策略：低值偏浅灰蓝 → 中段粉蓝（贴近主色浅色氛围）→ 高值雾蓝灰（降饱和，与 secondary 文字同属冷静色系）。
           */
          inRange: {
            color: [
              '#fafbfc',
              '#f4f6f9',
              '#eef2f6',
              '#e5ecf3',
              '#dae6f0',
              '#cadcec',
              '#b8d1e6',
              '#a5c5df',
              '#93b8d7',
              '#82abcf',
              '#739fc7',
              '#6793be',
              '#5c87b4'
            ]
          }
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
              textBorderColor: 'rgba(255,255,255,0.95)',
              textBorderWidth: 2
            },
            itemStyle: {
              borderRadius: 8,
              borderColor: 'rgba(255, 255, 255, 0.96)',
              borderWidth: 2
            },
            emphasis: {
              disabled: false,
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(91, 126, 158, 0.32)',
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 2
              }
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
        animationDurationUpdate: 520,
        animationEasingUpdate: 'cubicOut',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
            shadowStyle: { color: 'rgba(14, 165, 233, 0.08)' }
          },
          ...tooltipModernDark,
          formatter: (params: unknown) => {
            const list = Array.isArray(params) ? params : [params];
            const it = list[0] as { axisValue?: string; marker?: string; data?: number };
            if (!it?.axisValue) return '';
            return `${it.marker ?? ''}<b>${it.axisValue}</b><br/><span style="opacity:.9">完成数 ${it.data ?? 0}</span>`;
          }
        },
        grid: { left: 4, right: 32, top: 8, bottom: 8, containLabel: true },
        xAxis: {
          type: 'value',
          name: '完成数',
          nameLocation: 'middle',
          nameGap: 30,
          nameTextStyle: { color: '#94a3b8', fontSize: 11, fontWeight: 500 },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: {
            lineStyle: { color: 'rgba(148, 163, 184, 0.35)', type: [4, 4] }
          }
        },
        yAxis: {
          type: 'category',
          data: typeEntries.map((e) => e.label),
          inverse: true,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            fontSize: 12,
            width: 92,
            overflow: 'truncate',
            color: '#334155',
            fontWeight: 500
          }
        },
        series: [
          {
            type: 'bar',
            data: typeEntries.map((e, i) => ({
              value: e.value,
              itemStyle: {
                borderRadius: [0, 10, 10, 0],
                shadowBlur: 8,
                shadowColor: 'rgba(15, 23, 42, 0.08)',
                shadowOffsetY: 2,
                color: typeBarGradient(i)
              }
            })),
            barMaxWidth: 18,
            label: {
              show: typeEntries.length > 0 && typeEntries.length <= 12,
              position: 'right',
              distance: 6,
              formatter: '{c}',
              fontSize: 11,
              fontWeight: 600,
              color: '#64748b'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 14,
                shadowColor: 'rgba(2, 132, 199, 0.26)'
              }
            }
          }
        ]
      });
    }

    if (paceRef.value) {
      if (!chPace) chPace = echarts.init(paceRef.value);
      const nMem = rows.length;
      const bottomPad = nMem > 8 ? 68 : nMem > 5 ? 52 : 40;
      chPace.setOption({
        animationDurationUpdate: 480,
        animationEasingUpdate: 'cubicOut',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross', crossStyle: { color: 'rgba(148, 163, 184, 0.45)' } },
          ...tooltipModernDark,
          formatter: (params: unknown) => {
            const list = (Array.isArray(params) ? params : [params]) as Array<{
              axisValue?: string;
              marker?: string;
              seriesName?: string;
              value?: number | string;
            }>;
            if (!list.length) return '';
            const head = list[0]?.axisValue ?? '';
            let html = `<div style="font-weight:600;margin-bottom:6px">${head}</div>`;
            for (const it of list) {
              let v: number | string = it.value ?? '';
              if (typeof v === 'number' && it.seriesName === '按期交付率') v = Math.round(v);
              html += `${it.marker ?? ''}${it.seriesName ?? ''} <b>${v}</b><br/>`;
            }
            return html;
          }
        },
        legend: {
          left: 0,
          top: 0,
          orient: 'horizontal',
          data: ['交付周期中位数', '按期交付率'],
          itemWidth: 12,
          itemHeight: 10,
          itemGap: 20,
          textStyle: { color: '#64748b', fontSize: 11 }
        },
        /** 图例在左上，plot 区下移；右侧多留空给次轴名称「%」与刻度，避免与图例挤占 */
        grid: { left: 50, right: 56, top: 48, bottom: bottomPad, containLabel: false },
        xAxis: {
          type: 'category',
          data: names,
          axisTick: { alignWithLabel: true },
          axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.45)' } },
          axisLabel: {
            rotate: nMem > 6 ? 28 : 0,
            fontSize: 11,
            color: '#64748b',
            interval: 0,
            hideOverlap: true
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '天',
            nameLocation: 'end',
            nameGap: 8,
            nameTextStyle: { color: '#94a3b8', fontSize: 11, fontWeight: 500 },
            axisLabel: { color: '#64748b', fontSize: 11 },
            splitLine: {
              lineStyle: { color: 'rgba(148, 163, 184, 0.35)', type: [4, 4] }
            }
          },
          {
            type: 'value',
            name: '%',
            max: 100,
            min: 0,
            position: 'right',
            nameLocation: 'end',
            nameGap: 12,
            alignTicks: true,
            minInterval: 1,
            nameTextStyle: { color: '#94a3b8', fontSize: 11, fontWeight: 500 },
            axisLabel: {
              color: '#64748b',
              fontSize: 11,
              margin: 2,
              formatter: (v: number | string) => {
                const n = Number(v);
                return Number.isFinite(n) ? String(Math.round(n)) : String(v);
              }
            },
            splitLine: { show: false }
          }
        ],
        series: [
          {
            name: '交付周期中位数',
            type: 'bar',
            yAxisIndex: 0,
            data: rows.map((s) => Number(s.medianLeadTimeDays ?? 0)),
            barMaxWidth: 32,
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                { offset: 0, color: '#bae6fd' },
                { offset: 1, color: '#0369a1' }
              ])
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 12,
                shadowColor: 'rgba(3, 105, 161, 0.35)'
              }
            }
          },
          {
            name: '按期交付率',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            symbol: 'circle',
            symbolSize: 9,
            showSymbol: nMem <= 14,
            data: rows.map((s) => Number(s.onTimeRate ?? 0)),
            lineStyle: { width: 2.5, color: '#10b981' },
            itemStyle: {
              color: '#059669',
              borderColor: '#fff',
              borderWidth: 2
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                { offset: 0, color: 'rgba(16, 185, 129, 0.22)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
              ])
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
    chPace?.resize();
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
    border-radius: 14px;
    padding: 14px 16px 12px;
    box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.04),
      0 8px 24px rgba(15, 23, 42, 0.06);
    border: 1px solid rgba(148, 163, 184, 0.18);
    transition:
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .pdc-card--modern {
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      border-radius: 14px 14px 0 0;
      pointer-events: none;
    }

    &:hover {
      border-color: rgba(148, 163, 184, 0.28);
      box-shadow:
        0 4px 12px rgba(15, 23, 42, 0.06),
        0 16px 40px rgba(15, 23, 42, 0.08);
    }
  }

  .pdc-card--rank::before {
    background: linear-gradient(90deg, #22d3ee, #0ea5e9, #14b8a6);
  }

  /* 与热力图色阶同属柔雾蓝系，避免亮青/深蓝条抢镜 */
  .pdc-card--heatmap::before {
    background: linear-gradient(90deg, #a8c9e8, #8eb6da, #6d9bc4);
  }

  .pdc-card--type::before {
    background: linear-gradient(90deg, #2dd4bf, #14b8a6, #f59e0b);
  }

  .pdc-card--hours::before {
    background: linear-gradient(90deg, #3b82f6, #22c55e);
  }

  .pdc-card--pace::before {
    background: linear-gradient(90deg, #06b6d4, #0ea5e9, #14b8a6);
  }

  .pdc-card__title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .pdc-card__badge {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
    padding: 3px 10px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.14), rgba(45, 212, 191, 0.1));
    border: 1px solid rgba(14, 165, 233, 0.28);
  }

  .pdc-card--heatmap .pdc-card__badge--soft {
    background: rgba(91, 126, 158, 0.1);
    border-color: rgba(91, 126, 158, 0.22);
    color: #5c6f82;
  }

  .pdc-card--type .pdc-card__badge {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(45, 212, 191, 0.1));
    border-color: rgba(217, 119, 6, 0.28);
    color: #b45309;
  }

  .pdc-card__badge--hours {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.14), rgba(34, 197, 94, 0.1));
    border-color: rgba(59, 130, 246, 0.28);
    color: #1d4ed8;
  }

  .pdc-card__badge--pace {
    background: rgba(6, 182, 212, 0.12);
    border-color: rgba(8, 145, 178, 0.3);
    color: #0e7490;
  }

  .pdc-card__hint--compact {
    margin: 0 0 8px;
    font-size: 11px;
    line-height: 1.45;
    color: var(--el-text-color-secondary);
  }

  .pdc-card__head {
    margin-bottom: 8px;
  }

  .pdc-card__head-inner {
    min-width: 0;
  }

  .pdc-card__title {
    font-weight: 700;
    font-size: 14px;
    letter-spacing: -0.01em;
    color: var(--el-text-color-primary);
    margin-bottom: 0;
  }

  .pdc-card__hint {
    margin: 6px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  .pdc-card__chart {
    height: 280px;
  }

  .pdc-card__chart--tall {
    height: 320px;
    min-height: 300px;
  }

  .pdc-card__chart--heatmap {
    min-height: 300px;
  }
</style>
