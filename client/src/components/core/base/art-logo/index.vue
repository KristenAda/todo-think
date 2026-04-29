<template>
  <div class="flex-cc art-logo-root">
    <!-- 资源来自 public/logo.svg，尺寸由 logoStyle 控制 -->
    <img class="art-logo-img" :src="logoSrc" alt="Todo Think" :style="logoStyle" decoding="async" />
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtLogo' });

  interface Props {
    /** logo 边长（正方形） */
    size?: number | string;
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 36
  });

  /** 与 vite.config base 一致，避免子路径部署时 404 */
  const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

  const logoStyle = computed(() => {
    const n =
      typeof props.size === 'number' ? props.size : Number.parseFloat(String(props.size)) || 36;
    return {
      width: `${n}px`,
      height: `${n}px`,
      objectFit: 'contain' as const
    };
  });
</script>

<style scoped lang="scss">
  .art-logo-img {
    display: block;
    flex-shrink: 0;
  }
</style>
