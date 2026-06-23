<!-- 统一空状态占位：内联 SVG，插画主色随 Element Plus 主题 -->
<template>
  <div
    class="art-empty"
    :class="{ 'is-compact': compact }"
    :style="{ '--art-empty-img-w': `${imageSize}px` }"
  >
    <div class="art-empty__figure" v-html="svgHtml" />
    <p v-if="description" class="art-empty__description">{{ description }}</p>
    <div v-if="$slots.default" class="art-empty__slot">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { ArtEmptyVariantType } from '@/enums/modules/artEmptyEnum';
  import { ArtEmptyVariant } from '@/enums/modules/artEmptyEnum';
  import { themeifyEmptySvg } from '@/utils/themeifyEmptySvg';

  import error404Raw from '@/assets/icons/empty/error_404.svg?raw';
  import favoritesEmptyRaw from '@/assets/icons/empty/favorites_empty.svg?raw';
  import noDataRaw from '@/assets/icons/empty/no_data.svg?raw';
  import noFollowRaw from '@/assets/icons/empty/no_follow.svg?raw';
  import noInfoRaw from '@/assets/icons/empty/no_info.svg?raw';
  import noLocationRaw from '@/assets/icons/empty/no_location.svg?raw';
  import noMessageRaw from '@/assets/icons/empty/no_message.svg?raw';
  import noNetworkRaw from '@/assets/icons/empty/no_network.svg?raw';
  import noOrdersRaw from '@/assets/icons/empty/no_orders.svg?raw';
  import noPermissionRaw from '@/assets/icons/empty/no_permission.svg?raw';
  import searchNoResultsRaw from '@/assets/icons/empty/search_no_results.svg?raw';
  import underConstructionRaw from '@/assets/icons/empty/under_construction.svg?raw';

  defineOptions({ name: 'ArtEmpty' });

  const VARIANT_RAW: Record<ArtEmptyVariantType, string> = {
    [ArtEmptyVariant.NO_MESSAGE]: noMessageRaw,
    [ArtEmptyVariant.NO_FOLLOW]: noFollowRaw,
    [ArtEmptyVariant.UNDER_CONSTRUCTION]: underConstructionRaw,
    [ArtEmptyVariant.NO_LOCATION]: noLocationRaw,
    [ArtEmptyVariant.NO_NETWORK]: noNetworkRaw,
    [ArtEmptyVariant.NO_DATA]: noDataRaw,
    [ArtEmptyVariant.NO_PERMISSION]: noPermissionRaw,
    [ArtEmptyVariant.NO_INFO]: noInfoRaw,
    [ArtEmptyVariant.FAVORITES_EMPTY]: favoritesEmptyRaw,
    [ArtEmptyVariant.NO_ORDERS]: noOrdersRaw,
    [ArtEmptyVariant.SEARCH_NO_RESULTS]: searchNoResultsRaw,
    [ArtEmptyVariant.ERROR_404]: error404Raw
  };

  const props = withDefaults(
    defineProps<{
      /** 文案 */
      description?: string;
      /** 插画宽度（px），高度按比例 */
      imageSize?: number;
      /** 与 empty 目录下 svg 文件名（不含后缀）对应 */
      variant?: ArtEmptyVariantType;
      /** 紧凑模式：减小内边距与说明字号 */
      compact?: boolean;
    }>(),
    {
      description: '',
      imageSize: 120,
      variant: ArtEmptyVariant.NO_DATA,
      compact: false
    }
  );

  const svgHtml = computed(() => themeifyEmptySvg(VARIANT_RAW[props.variant]));
</script>

<style scoped lang="scss">
  .art-empty {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 28px 20px;
    box-sizing: border-box;

    &.is-compact {
      padding: 14px 12px;

      .art-empty__description {
        margin-top: 10px;
        font-size: 13px;
      }

      .art-empty__slot {
        margin-top: 10px;
      }
    }
  }

  .art-empty__figure {
    position: relative;
    z-index: 1;
    line-height: 0;
    max-width: 100%;

    :deep(svg) {
      width: var(--art-empty-img-w);
      height: auto;
      display: block;
      max-width: 100%;
    }
  }

  .art-empty__description {
    position: relative;
    z-index: 1;
    margin: 18px 0 0;
    font-size: 14px;
    line-height: 1.55;
    color: var(--el-text-color-secondary);
    max-width: 320px;
  }

  .art-empty__slot {
    position: relative;
    z-index: 1;
    margin-top: 14px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
</style>
