<!-- 顶栏头像下拉内的段位摘要 -->
<template>
  <div class="tier-snippet" aria-live="polite">
    <div v-if="loading" class="tier-snippet__loading">
      <span class="tier-snippet__sk"></span>
      <span class="tier-snippet__sk tier-snippet__sk--wide"></span>
    </div>
    <template v-else-if="stat">
      <div class="tier-snippet__row">
        <RankIcon :tier="resolvedTier" :size="44" />
        <div class="tier-snippet__meta">
          <span class="tier-snippet__label">队内绩效</span>
          <span class="tier-snippet__score">综合分 {{ stat.compositeScore ?? 0 }}</span>
        </div>
      </div>
    </template>
    <div v-else class="tier-snippet__empty">暂无队内绩效样本</div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import RankIcon from '@/components/core/base/rank-icon/index.vue';
  import type { RankIconTier } from '@/components/core/base/rank-icon/types';
  import { useMyPerformanceSnapshot } from '@/hooks/business/useMyPerformanceSnapshot';

  defineOptions({ name: 'UserPerfTierSnippet' });

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
</script>

<style scoped lang="scss">
  .tier-snippet {
    margin: 10px 0 14px;
    padding: 0;
  }

  .tier-snippet__loading {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tier-snippet__sk {
    display: block;
    height: 14px;
    border-radius: 4px;
    background: linear-gradient(
      90deg,
      var(--el-fill-color-light) 0%,
      var(--el-fill-color) 50%,
      var(--el-fill-color-light) 100%
    );
    background-size: 200% 100%;
    animation: tier-sk 1.2s ease-in-out infinite;

    &--wide {
      width: 85%;
      height: 12px;
    }
  }

  @keyframes tier-sk {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .tier-snippet__row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .tier-snippet__meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }

  .tier-snippet__label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--el-text-color-secondary);
    line-height: 1.2;
  }

  .tier-snippet__score {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary);
    line-height: 1.2;
  }

  .tier-snippet__empty {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.45;
  }
</style>
