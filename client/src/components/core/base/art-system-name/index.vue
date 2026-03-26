<!-- 系统名称艺术字组件 -->
<template>
  <span class="art-system-name" :class="[`art-system-name--${size}`]">
    <span class="art-system-name__text">{{ name }}</span>
  </span>
</template>

<script setup lang="ts">
  import AppConfig from '@/config';

  defineOptions({ name: 'ArtSystemName' });

  interface Props {
    /** 尺寸：sm / md / lg */
    size?: 'sm' | 'md' | 'lg';
  }

  withDefaults(defineProps<Props>(), {
    size: 'md'
  });

  const name = AppConfig.systemInfo.name;
</script>

<style lang="scss" scoped>
  .art-system-name {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;

    &__text {
      font-weight: 700;
      letter-spacing: 0.06em;
      background: linear-gradient(
        120deg,
        var(--main-color) 0%,
        color-mix(in srgb, var(--main-color) 60%, #a78bfa) 40%,
        color-mix(in srgb, var(--main-color) 40%, #f0abfc) 70%,
        color-mix(in srgb, var(--main-color) 55%, #818cf8) 100%
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      background-size: 200% auto;
      animation: art-name-shine 4s linear infinite;
      /* 精致的文字阴影（通过 filter 实现，兼容渐变文字）*/
      filter: drop-shadow(0 1px 4px color-mix(in srgb, var(--main-color) 30%, transparent));
      transition: filter 0.3s ease, letter-spacing 0.3s ease;
    }

    /* 尺寸变体 */
    &--sm &__text {
      font-size: 15px;
      letter-spacing: 0.04em;
    }

    &--md &__text {
      font-size: 17px;
    }

    &--lg &__text {
      font-size: 22px;
      letter-spacing: 0.08em;
    }

    /* hover 时光晕增强 */
    &:hover &__text {
      letter-spacing: 0.1em;
      filter: drop-shadow(0 2px 8px color-mix(in srgb, var(--main-color) 50%, transparent));
    }
  }

  @keyframes art-name-shine {
    0% {
      background-position: 0% center;
    }

    100% {
      background-position: 200% center;
    }
  }
</style>
