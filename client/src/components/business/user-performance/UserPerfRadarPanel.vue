<!-- 个人中心等：段位 + 五维雷达（队内相对分 0–100） -->
<template>
  <div class="uprp uc-card">
    <div class="uprp__header">
      <div class="uprp__title-row">
        <div class="uprp__title">
          <art-svg-icon icon="mdi:chart-areaspline" class="uprp__title-icon" />
          <span>人员画像</span>
        </div>
      </div>
    </div>

    <div class="uprp__body">
      <div v-if="loading" class="uprp__loading">
        <span class="uprp__sk-ring"></span>
      </div>
      <template v-else-if="stat">
        <div class="uprp__hero">
          <div class="uprp__hero-badge">
            <RankIcon :tier="resolvedTier" :size="44" />
          </div>
          <div class="uprp__hero-text">
            <div class="uprp__score-line">
              综合得分 <b>{{ stat.compositeScore ?? 0 }}</b>
              <template v-if="stat.totalTasks != null">
                <span class="uprp__dot">·</span>
                计入样本 <b>{{ stat.totalTasks }}</b> 条
              </template>
            </div>
            <p class="uprp__hint">雷达图对比五项能力维度的相对强弱；分值越高，该项相对表现越好。</p>
          </div>
        </div>
        <div ref="chartRef" class="uprp__chart" />
      </template>
      <div v-else class="uprp__empty">
        <art-svg-icon icon="mdi:chart-donut" class="uprp__empty-icon" />
        <p>暂无队内绩效样本</p>
        <p class="uprp__empty-hint">在完成主要负责人事项并纳入统计范围后，将展示段位与五维画像。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
  import { echarts, type EChartsOption } from '@/plugins/echarts';
  import RankIcon from '@/components/core/base/rank-icon/index.vue';
  import type { RankIconTier } from '@/components/core/base/rank-icon/types';
  import { PERF_SUB_SCORE_KEYS, PERF_SUB_SCORE_LABEL } from '@/enums/modules/performanceEnum';
  import { useMyPerformanceSnapshot } from '@/hooks/business/useMyPerformanceSnapshot';

  defineOptions({ name: 'UserPerfRadarPanel' });

  const { stat, loading } = useMyPerformanceSnapshot();

  const resolvedTier = computed<RankIconTier>(() => {
    const t = stat.value?.compositeTier;
    if (
      t === 'C' ||
      t === 'B' ||
      t === 'A' ||
      t === 'S-' ||
      t === 'S' ||
      t === 'S+' ||
      t === 'SS' ||
      t === 'SSS'
    ) {
      return t;
    }
    return 'C';
  });

  const chartRef = ref<HTMLDivElement | null>(null);
  let chartInst: ReturnType<typeof echarts.init> | null = null;
  let ro: ResizeObserver | null = null;

  function readCssVar(name: string, fallback: string): string {
    if (typeof document === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function buildOption(): EChartsOption {
    const sub = stat.value?.subScores;
    const values = PERF_SUB_SCORE_KEYS.map((k) =>
      Math.max(0, Math.min(100, Math.round(Number(sub?.[k] ?? 0))))
    );
    const primary = readCssVar('--el-color-primary', '#409eff');
    const textMuted = readCssVar('--el-text-color-secondary', '#909399');
    const borderLight = readCssVar('--el-border-color-lighter', '#ebeef5');
    const fillSoft = readCssVar('--el-fill-color-blank', '#ffffff');

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: readCssVar('--el-bg-color-overlay', '#fff'),
        borderColor: readCssVar('--el-border-color-light', '#e4e7ed'),
        textStyle: {
          color: readCssVar('--el-text-color-primary', '#303133'),
          fontSize: 12
        },
        formatter: (params: unknown) => {
          const p = params as {
            seriesType?: string;
            value?: number[];
            data?: { value?: number[] };
          };
          const vals = p.value ?? p.data?.value;
          if (p.seriesType !== 'radar' || !vals?.length) return '';
          const lines = PERF_SUB_SCORE_KEYS.map((key, i) => {
            const label = PERF_SUB_SCORE_LABEL[key];
            const val = vals[i];
            return `${label}：${val}`;
          });
          return `<div style="font-weight:600;margin-bottom:6px">五维能力</div>${lines.join('<br/>')}`;
        }
      },
      radar: {
        shape: 'polygon',
        radius: '62%',
        center: ['50%', '52%'],
        axisName: {
          formatter: (label?: string) => {
            const key = label ?? '';
            const idx = PERF_SUB_SCORE_KEYS.findIndex((k) => PERF_SUB_SCORE_LABEL[k] === key);
            const num = idx >= 0 ? values[idx] : 0;
            return `{dim|${key}}\n{val|${num}}`;
          },
          rich: {
            dim: {
              fontSize: 11,
              color: textMuted,
              lineHeight: 15,
              align: 'center'
            },
            val: {
              fontSize: 13,
              fontWeight: 700,
              color: primary,
              lineHeight: 18,
              align: 'center'
            }
          }
        },
        splitNumber: 4,
        axisLine: { lineStyle: { color: borderLight } },
        splitLine: { lineStyle: { color: borderLight } },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(148,163,184,0.06)', 'rgba(148,163,184,0.02)']
          }
        },
        indicator: PERF_SUB_SCORE_KEYS.map((k) => ({
          name: PERF_SUB_SCORE_LABEL[k],
          max: 100
        }))
      },
      series: [
        {
          type: 'radar',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: primary,
            shadowBlur: 8,
            shadowColor: `${primary}44`
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${primary}55` },
                { offset: 1, color: `${primary}12` }
              ]
            }
          },
          itemStyle: {
            color: primary,
            borderColor: fillSoft,
            borderWidth: 2
          },
          data: [{ value: values, name: '相对能力' }]
        }
      ]
    };
  }

  function disposeChart() {
    ro?.disconnect();
    ro = null;
    chartInst?.dispose();
    chartInst = null;
  }

  function renderChart() {
    const el = chartRef.value;
    if (!el || !stat.value) return;
    disposeChart();
    chartInst = echarts.init(el);
    chartInst.setOption(buildOption(), true);
    ro = new ResizeObserver(() => chartInst?.resize());
    ro.observe(el);
  }

  watch([stat, loading], async () => {
    await nextTick();
    if (loading.value || !stat.value) {
      disposeChart();
      return;
    }
    renderChart();
  });

  onMounted(async () => {
    await nextTick();
    if (!loading.value && stat.value) renderChart();
  });

  onUnmounted(() => disposeChart());
</script>

<style scoped lang="scss">
  .uprp {
    background: var(--default-box-color);
    border-radius: 12px;
    border: 1px solid var(--art-card-border);
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
  }

  .uprp__header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--art-card-border);
  }

  .uprp__title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .uprp__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .uprp__title-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  .uprp__body {
    flex: 1;
    min-height: 196px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-sizing: border-box;
  }

  .uprp__hero {
    display: flex;
    align-items: stretch;
    gap: 10px;
    padding: 0;
  }

  .uprp__hero-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 48px;
  }

  .uprp__hero-text {
    display: flex;
    flex-direction: column;
    gap: 6px;
    justify-content: center;
    min-width: 0;
    flex: 1;
  }

  .uprp__score-line {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.45;
    text-align: left;

    b {
      color: var(--el-text-color-primary);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  }

  .uprp__dot {
    opacity: 0.45;
    margin: 0 4px;
  }

  .uprp__hint {
    margin: 0;
    padding: 0;
    font-size: 11px;
    line-height: 1.45;
    color: var(--el-text-color-secondary);
    text-align: left;
  }

  .uprp__chart {
    flex: 1;
    width: 100%;
    min-width: 0;
    min-height: 168px;
  }

  .uprp__loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 168px;
  }

  .uprp__sk-ring {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 3px solid var(--el-fill-color-light);
    border-top-color: var(--el-color-primary-light-5);
    animation: uprp-spin 0.85s linear infinite;
  }

  @keyframes uprp-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .uprp__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 16px 12px;
    min-height: 168px;
    color: var(--el-text-color-secondary);
    font-size: 14px;

    p {
      margin: 0;
    }
  }

  .uprp__empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
    opacity: 0.35;
    color: var(--el-color-primary);
  }

  .uprp__empty-hint {
    margin-top: 8px !important;
    font-size: 12px;
    line-height: 1.5;
    max-width: 280px;
    opacity: 0.85;
  }
</style>
