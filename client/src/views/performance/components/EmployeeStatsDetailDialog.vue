<template>
  <ArtDialog
    v-model="innerVisible"
    :title="titleText"
    width="720px"
    max-height="calc(100vh - 120px)"
    destroy-on-close
  >
    <div v-if="stat" class="esd">
      <div class="esd-hero">
        <div class="esd-hero__tier" :class="`is-${(stat.compositeTier ?? 'C').toLowerCase()}`">
          <span class="esd-hero__tier-label">综合档位</span>
          <span class="esd-hero__tier-val">{{ stat.compositeTier ?? '—' }}</span>
        </div>
        <div class="esd-hero__score">
          <span class="esd-hero__score-label">综合效能分</span>
          <span class="esd-hero__score-val">{{ stat.compositeScore ?? '—' }}</span>
        </div>
      </div>

      <section class="esd-panel">
        <h3 class="esd-panel__title">主责产出</h3>
        <div class="esd-kv">
          <div class="esd-kv__item">
            <span class="esd-kv__k">完成任务</span>
            <span class="esd-kv__v">{{ stat.totalTasks }}</span>
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">预估 / 实际工时</span>
            <span class="esd-kv__v"
              >{{ (stat.totalEstimatedHours ?? 0).toFixed(1) }}h / {{ (stat.totalActualHours ?? 0).toFixed(1) }}h</span
            >
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">Bug 数</span>
            <span class="esd-kv__v">{{ stat.totalBugCount }}</span>
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">一次通过率</span>
            <span class="esd-kv__v">{{ stat.firstPassRate }}%</span>
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">周期中位数</span>
            <span class="esd-kv__v">{{ stat.medianLeadTimeDays ?? '—' }} 天</span>
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">准时率</span>
            <span class="esd-kv__v">{{ stat.onTimeRate ?? '—' }}%</span>
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">工时准确率</span>
            <span class="esd-kv__v">{{ stat.hoursAccuracyAvg ?? '—' }}%</span>
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">验收打回次数</span>
            <span class="esd-kv__v">{{ stat.qaRejectCount ?? 0 }}</span>
          </div>
        </div>
      </section>

      <section class="esd-panel">
        <h3 class="esd-panel__title">投入与角色</h3>
        <div class="esd-kv">
          <div class="esd-kv__item">
            <span class="esd-kv__k">登记工时</span>
            <span class="esd-kv__v">{{ stat.workLogHours ?? 0 }}h</span>
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">协作完成参与</span>
            <span class="esd-kv__v">{{ stat.coAssigneeCompletedCount ?? 0 }}</span>
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">验收任务数</span>
            <span class="esd-kv__v">{{ stat.testerCompletedCount ?? 0 }}</span>
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">在制 WIP</span>
            <span class="esd-kv__v">{{ stat.wipCount ?? 0 }}</span>
          </div>
          <div class="esd-kv__item">
            <span class="esd-kv__k">总积分</span>
            <span class="esd-kv__v">{{ stat.totalPoints ?? 0 }}</span>
          </div>
        </div>
      </section>

      <section v-if="stat.subScores" class="esd-panel">
        <h3 class="esd-panel__title">维度子分（队内归一）</h3>
        <div class="esd-bars">
          <div v-for="(lab, key) in subLabels" :key="key" class="esd-bar-row">
            <span class="esd-bar-row__l">{{ lab }}</span>
            <ElProgress
              :percentage="(stat.subScores as any)[key] ?? 0"
              :stroke-width="10"
              :color="progressColor"
            />
          </div>
        </div>
      </section>
    </div>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { computed, watch, ref } from 'vue';
  import { ElProgress } from 'element-plus';
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

  const titleText = computed(() => {
    const u = props.stat?.user;
    if (!u) return '成员绩效详情';
    const name = u.nickName || u.userName || '成员';
    return `${name} · 绩效详情`;
  });

  const subLabels: Record<string, string> = {
    throughput: '产出',
    quality: '质量',
    punctuality: '准时',
    speed: '速度',
    stability: '稳定（少打回）'
  };

  function progressColor(p: number) {
    if (p >= 75) return '#67c23a';
    if (p >= 50) return '#409eff';
    if (p >= 35) return '#e6a23c';
    return '#f56c6c';
  }
</script>

<style scoped lang="scss">
  .esd {
    padding: 4px 0 8px;
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

  .esd-hero__tier.is-s {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.18), rgba(64, 158, 255, 0.06));
    border-color: rgba(103, 194, 58, 0.35);
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
    margin: 0 0 10px;
    color: var(--el-text-color-primary);
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
    gap: 12px;
  }

  .esd-bar-row__l {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }
</style>
