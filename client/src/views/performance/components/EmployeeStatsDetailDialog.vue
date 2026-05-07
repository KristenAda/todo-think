<template>
  <ArtDialog
    v-model="innerVisible"
    :title="titleText"
    width="1040px"
    max-height="calc(100vh - 100px)"
    destroy-on-close
  >
    <div v-if="stat" class="esd">
      <div class="esd__split" :class="{ 'esd__split--solo': !stat.subScores }">
        <div class="esd__left">
          <div class="esd-hero">
            <div class="esd-hero__tier" :class="`is-${tierHeroSuffix}`">
              <span class="esd-hero__tier-label">绩效评级</span>
              <div v-if="displayTier" class="esd-hero__tier-icon">
                <RankIcon :tier="displayTier" :size="52" />
              </div>
              <span v-else class="esd-hero__tier-val">—</span>
            </div>
            <div class="esd-hero__score">
              <span class="esd-hero__score-label">综合得分</span>
              <span class="esd-hero__score-val">{{ stat.compositeScore ?? '—' }}</span>
            </div>
          </div>

          <section class="esd-panel">
            <h3 class="esd-panel__title">交付表现</h3>
            <p class="esd-panel__hint">
              统计期内已完成验收、<strong>计入考核口径</strong>的任务汇总；主要负责人与协作人均纳入样本，与列表一致。
            </p>
            <div class="esd-kv">
              <div class="esd-kv__item">
                <span class="esd-kv__k">计入考核任务数</span>
                <span class="esd-kv__v">{{ stat.totalTasks }}</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">主责任务数</span>
                <span class="esd-kv__v">{{ stat.mainResponsibleTasks ?? 0 }}</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">预估 / 实际工时（汇总）</span>
                <span class="esd-kv__v"
                  >{{ (stat.totalEstimatedHours ?? 0).toFixed(1) }}h /
                  {{ (stat.totalActualHours ?? 0).toFixed(1) }}h</span
                >
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">关联 Bug 数</span>
                <span class="esd-kv__v">{{ stat.totalBugCount }}</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">首通率</span>
                <span class="esd-kv__v">{{ stat.firstPassRate }}%</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">交付周期中位数</span>
                <span class="esd-kv__v">{{ stat.medianLeadTimeDays ?? '—' }} 天</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">按期交付率</span>
                <span class="esd-kv__v">{{ stat.onTimeRate ?? '—' }}%</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">工时估算准确率</span>
                <span class="esd-kv__v">{{ stat.hoursAccuracyAvg ?? '—' }}%</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">验收返工次数</span>
                <span class="esd-kv__v">{{ stat.qaRejectCount ?? 0 }}</span>
              </div>
            </div>
          </section>

          <section class="esd-panel">
            <h3 class="esd-panel__title">协作与在办明细</h3>
            <p class="esd-panel__hint">
              「在办任务」仅统计由您担任<strong>主要负责人</strong>的未结办事项；其余指标为全局口径。
            </p>
            <div class="esd-kv">
              <div class="esd-kv__item">
                <span class="esd-kv__k">提报总工时</span>
                <span class="esd-kv__v">{{ stat.workLogHours ?? 0 }}h</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">协作完成的任务数</span>
                <span class="esd-kv__v">{{ stat.coAssigneeCompletedCount ?? 0 }}</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">参与验收的次数</span>
                <span class="esd-kv__v">{{ stat.testerCompletedCount ?? 0 }}</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">处理中任务（主要负责人）</span>
                <span class="esd-kv__v">{{ stat.wipCount ?? 0 }}</span>
              </div>
              <div class="esd-kv__item">
                <span class="esd-kv__k">积分合计</span>
                <span class="esd-kv__v">{{ stat.totalPoints ?? 0 }}</span>
              </div>
            </div>
          </section>
        </div>

        <aside v-if="stat.subScores" class="esd__right">
          <div class="esd-aside-card">
            <h3 class="esd-aside-card__title">五维得分</h3>
            <p class="esd-panel__hint esd-aside-card__hint">
              同组相对分位值（0～100）：反映各项指标在统计范围内的相对排名百分比，非原始任务得分。
            </p>
            <div class="esd-bars">
              <div v-for="key in perfKeys" :key="key" class="esd-bar-row">
                <span class="esd-bar-row__l">{{ perfLabels[key] }}</span>
                <ElProgress
                  :percentage="(stat.subScores as Record<string, number>)[key] ?? 0"
                  :stroke-width="12"
                  :color="progressColor"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { computed, watch, ref } from 'vue';
  import { ElProgress } from 'element-plus';
  import RankIcon from '@/components/core/base/rank-icon/index.vue';
  import type { RankIconTier } from '@/components/core/base/rank-icon/types';
  import {
    compositeTierHeroClassSuffix,
    PERF_SUB_SCORE_KEYS,
    PERF_SUB_SCORE_LABEL
  } from '@/enums/modules/performanceEnum';
  defineOptions({ name: 'EmployeeStatsDetailDialog' });

  const props = defineProps<{
    visible: boolean;
    stat: Api.Task.PerformanceStat | null;
  }>();

  const emit = defineEmits<{
    'update:visible': [boolean];
  }>();

  const innerVisible = ref(props.visible);
  watch(
    () => props.visible,
    (v) => {
      innerVisible.value = v;
    }
  );
  watch(innerVisible, (v) => emit('update:visible', v));

  const tierHeroSuffix = computed(() =>
    compositeTierHeroClassSuffix(props.stat?.compositeTier ?? 'C')
  );

  const displayTier = computed<RankIconTier | null>(() => {
    const t = props.stat?.compositeTier;
    return t ? (t as RankIconTier) : null;
  });

  const titleText = computed(() => {
    const u = props.stat?.user;
    if (!u) return '成员绩效详情';
    const name = u.nickName || u.userName || '成员';
    return `${name} · 绩效详情`;
  });

  const perfKeys = PERF_SUB_SCORE_KEYS;
  const perfLabels = PERF_SUB_SCORE_LABEL;

  function progressColor(p: number) {
    if (p >= 75) return '#67c23a';
    if (p >= 50) return '#409eff';
    if (p >= 35) return '#e6a23c';
    return '#f56c6c';
  }
</script>

<style scoped lang="scss">
  .esd {
    padding: 2px 0 4px;
  }

  .esd__split {
    display: flex;
    align-items: flex-start;
    gap: 28px;
  }

  .esd__split--solo .esd__left {
    max-width: 100%;
  }

  .esd__left {
    flex: 1;
    min-width: 0;
  }

  .esd__right {
    width: 300px;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    align-self: flex-start;
  }

  .esd-aside-card {
    padding: 16px 18px;
    border-radius: 12px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  }

  .esd-aside-card__title {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 8px;
    color: var(--el-text-color-primary);
  }

  .esd-aside-card__hint {
    margin-bottom: 16px;
  }

  .esd-hero {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
  }

  .esd-hero__tier,
  .esd-hero__score {
    flex: 1;
    border-radius: 12px;
    padding: 16px 18px;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.12), rgba(103, 194, 58, 0.08));
    border: 1px solid rgba(64, 158, 255, 0.2);
  }

  .esd-hero__tier.is-a {
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.14), rgba(121, 187, 255, 0.08));
    border-color: rgba(64, 158, 255, 0.28);
  }
  .esd-hero__tier.is-b {
    background: linear-gradient(135deg, rgba(230, 162, 60, 0.14), rgba(245, 208, 132, 0.08));
    border-color: rgba(230, 162, 60, 0.35);
  }
  .esd-hero__tier.is-s-minus,
  .esd-hero__tier.is-s {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.18), rgba(64, 158, 255, 0.06));
    border-color: rgba(103, 194, 58, 0.35);
  }
  .esd-hero__tier.is-s-plus {
    background: linear-gradient(135deg, rgba(82, 196, 26, 0.2), rgba(144, 238, 144, 0.1));
    border-color: rgba(82, 196, 26, 0.42);
  }
  .esd-hero__tier.is-ss {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.22), rgba(103, 194, 58, 0.12));
    border-color: rgba(212, 175, 55, 0.45);
  }
  .esd-hero__tier.is-triple-s {
    background: linear-gradient(135deg, rgba(245, 108, 108, 0.14), rgba(212, 175, 55, 0.18));
    border-color: rgba(212, 175, 55, 0.55);
  }
  .esd-hero__tier.is-c {
    background: linear-gradient(135deg, rgba(245, 108, 108, 0.12), rgba(230, 162, 60, 0.06));
    border-color: rgba(245, 108, 108, 0.25);
  }

  .esd-hero__tier-label,
  .esd-hero__score-label {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }

  .esd-hero__tier-icon {
    display: flex;
    align-items: center;
    min-height: 52px;
  }

  .esd-hero__tier-val {
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--el-color-primary);
  }

  .esd-hero__score-val {
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .esd-panel {
    margin-bottom: 18px;
  }

  .esd-panel__title {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 6px;
    color: var(--el-text-color-primary);
  }

  .esd-panel__hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.55;
    margin: 0 0 12px;
  }

  .esd-panel__hint strong {
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  .esd-kv {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 16px;
  }

  .esd-kv__item {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    font-size: 13px;
  }

  .esd-kv__k {
    color: var(--el-text-color-secondary);
  }

  .esd-kv__v {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .esd-bars {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .esd-bar-row__l {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }

  @media (max-width: 960px) {
    .esd__split {
      flex-direction: column;
    }
    .esd__right {
      width: 100%;
      position: static;
    }
  }
</style>
