<!-- 系统 logo：不规则有机形态 + 多色渐变叠层，无矩形底板；内联 SVG 避免加载问题 -->
<template>
  <div class="flex-cc art-logo-root">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="Todo Think"
      class="art-logo-svg"
      :style="logoStyle"
    >
      <defs>
        <linearGradient
          :id="`${uid}-a`"
          x1="4"
          y1="52"
          x2="56"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#fb923c" />
          <stop offset="0.35" stop-color="#f87171" />
          <stop offset="0.62" stop-color="#4ade80" />
          <stop offset="1" stop-color="#e879f9" />
        </linearGradient>
        <linearGradient
          :id="`${uid}-b`"
          x1="44"
          y1="4"
          x2="20"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#86efac" stop-opacity="0.95" />
          <stop offset="0.42" stop-color="#fdba74" stop-opacity="0.92" />
          <stop offset="1" stop-color="#d8b4fe" stop-opacity="0.9" />
        </linearGradient>
        <linearGradient :id="`${uid}-stroke`" x1="10" y1="36" x2="54" y2="24" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffffff" stop-opacity="0.96" />
          <stop offset="0.5" stop-color="#ffedd5" stop-opacity="0.78" />
          <stop offset="1" stop-color="#fef9c3" stop-opacity="0.62" />
        </linearGradient>
        <radialGradient :id="`${uid}-spark`" cx="50%" cy="40%" r="50%">
          <stop offset="0" stop-color="#fef9c3" />
          <stop offset="0.55" stop-color="#fdba74" />
          <stop offset="1" stop-color="#fb923c" stop-opacity="0.9" />
        </radialGradient>
        <filter
          :id="`${uid}-soft`"
          x="-12"
          y="-12"
          width="88"
          height="88"
          color-interpolation-filters="sRGB"
        >
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" flood-color="#c084fc" flood-opacity="0.2" />
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.8" flood-color="#431407" flood-opacity="0.08" />
        </filter>
      </defs>

      <g :filter="`url(#${uid}-soft)`">
        <!-- 主形态：不规则流体块 -->
        <path
          :fill="`url(#${uid}-a)`"
          d="M 21.2 51.8 C 9.5 45.2 6.8 30.4 13.6 19.2 C 19.8 9.2 33.4 5.5 44.2 11.8 C 55.6 18.6 60.2 32.5 55.4 43.6 C 51.2 53.4 40.8 58.6 30.6 56.4 C 26.8 55.6 23.8 54 21.2 51.8 Z"
        />
        <!-- 叠层气泡：打破对称 -->
        <path
          :fill="`url(#${uid}-b)`"
          d="M 47.5 9.2 C 56.2 8 62.8 16.5 60.4 26.2 C 58.4 34.8 49.6 39.2 41.8 35.6 C 34.6 32.2 32.4 22.8 36.8 15.6 C 39.4 11.4 43.2 9.6 47.5 9.2 Z"
        />
        <!-- 动感弧线：象征推进与思考流 -->
        <path
          :stroke="`url(#${uid}-stroke)`"
          fill="none"
          stroke-width="3.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M 14.5 33.5 C 22 26.5 28 24.5 34.8 27.2 C 40.2 29.2 45.5 28 50.8 24.8"
        />
        <!-- 高光点缀 -->
        <circle cx="51.5" cy="14.5" r="4.2" :fill="`url(#${uid}-spark)`" />
        <circle cx="18.5" cy="26" r="2.4" fill="#fb7185" opacity="0.95" />
        <circle cx="28" cy="46" r="1.8" fill="#86efac" opacity="0.75" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtLogo' });

  interface Props {
    /** logo 大小 */
    size?: number | string;
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 36
  });

  /** 同一页多个 Logo 时避免渐变 / 滤镜 id 冲突 */
  const uid = `tt-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const logoStyle = computed(() => {
    const n =
      typeof props.size === 'number' ? props.size : Number.parseFloat(String(props.size)) || 36;
    return { width: `${n}px`, height: `${n}px` };
  });
</script>

<style scoped lang="scss">
  .art-logo-svg {
    display: block;
    flex-shrink: 0;
  }
</style>
