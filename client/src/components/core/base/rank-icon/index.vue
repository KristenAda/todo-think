<template>
  <span
    class="rank-icon"
    :class="[
      `rank-icon--tier-${tierSuffix}`,
      { 'rank-icon--float': needsFloat },
      { 'rank-icon--holo': needsHolo }
    ]"
    :style="{ '--rank-icon-size': sizeCss }"
    role="img"
    :aria-label="`绩效段位 ${resolvedTier}`"
  >
    <img class="rank-icon__img" :src="src" alt="" draggable="false" />
  </span>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import rankA from '@/assets/ranks/rank-A.webp';
  import rankB from '@/assets/ranks/rank-B.webp';
  import rankC from '@/assets/ranks/rank-C.webp';
  import rankS from '@/assets/ranks/rank-S.webp';
  import rankSMinus from '@/assets/ranks/rank-S-.webp';
  import rankSPlus from '@/assets/ranks/rank-S+.webp';
  import rankSS from '@/assets/ranks/rank-SS.webp';
  import rankSSS from '@/assets/ranks/rank-SSS.webp';
  import { compositeTierHeroClassSuffix } from '@/enums/modules/performanceEnum';
  import type { RankIconTier } from './types';

  defineOptions({ name: 'RankIcon' });

  /** 各段位 webp 由 Vite 解析为静态 URL */
  const RANK_SRC = {
    C: rankC,
    B: rankB,
    A: rankA,
    'S-': rankSMinus,
    S: rankS,
    'S+': rankSPlus,
    SS: rankSS,
    SSS: rankSSS
  } as const satisfies Record<RankIconTier, string>;

  const props = withDefaults(
    defineProps<{
      /** 绩效档位 */
      tier: RankIconTier;
      /**
       * 正方形占位边长（与设计稿接近 1:1 的徽章一致；素材若略偏竖/横会在框内留白）。
       * 默认 32 → 32×32。
       */
      size?: number | string;
    }>(),
    {
      size: 32
    }
  );

  const resolvedTier = computed<RankIconTier>(() => {
    const t = props.tier;
    if (t in RANK_SRC) return t;
    return 'C';
  });

  const src = computed(() => RANK_SRC[resolvedTier.value]);

  const tierSuffix = computed(() => compositeTierHeroClassSuffix(resolvedTier.value));

  const needsFloat = computed(() => ['S', 'S+', 'SS', 'SSS'].includes(resolvedTier.value));

  const needsHolo = computed(() => ['SS', 'SSS'].includes(resolvedTier.value));

  const sizeCss = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size));
</script>

<style scoped lang="scss">
  .rank-icon {
    --rank-icon-size: 32px;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--rank-icon-size);
    height: var(--rank-icon-size);
    vertical-align: middle;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: visible;
  }

  .rank-icon__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
    pointer-events: none;
    display: block;
    border-radius: inherit;
  }

  .rank-icon--float {
    animation: rank-icon-float 3s ease-in-out infinite;
  }

  @keyframes rank-icon-float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-2px);
    }
  }

  /* SS / SSS：极轻的全息扫光，叠加在图标上方 */
  .rank-icon--holo.rank-icon--tier-ss::after,
  .rank-icon--holo.rank-icon--tier-triple-s::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    mix-blend-mode: soft-light;
    opacity: 0.55;
    background: linear-gradient(
      118deg,
      transparent 0%,
      transparent 38%,
      rgba(255, 255, 255, 0.55) 47%,
      rgba(200, 230, 255, 0.35) 50.5%,
      transparent 62%,
      transparent 100%
    );
    background-size: 220% 100%;
    background-position: 100% 50%;
    animation: rank-icon-holo 5.5s ease-in-out infinite;
  }

  @keyframes rank-icon-holo {
    0% {
      background-position: 120% 50%;
      opacity: 0.38;
    }
    45% {
      opacity: 0.52;
    }
    100% {
      background-position: -30% 50%;
      opacity: 0.38;
    }
  }
</style>
