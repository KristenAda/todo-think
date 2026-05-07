/**
 * 预取懒加载页面 chunk，与菜单悬停/即将点击配合，缩短首进该页等待
 */
import type { AppRouteRecord } from '@/types/router';
import { componentLoader } from '@/router/core/ComponentLoader';

function walkPrefetch(item: AppRouteRecord): void {
  if (item.meta?.link && !item.meta?.isIframe) {
    return;
  }
  if (typeof item.component === 'string' && item.component) {
    componentLoader.prefetch(item.component);
  }
  item.children?.forEach(walkPrefetch);
}

/**
 * 预取该菜单项及其子树对应的所有视图（用于父级 SubMenu 悬停等）
 */
export function prefetchMenuRouteChunks(item: AppRouteRecord): void {
  walkPrefetch(item);
}
