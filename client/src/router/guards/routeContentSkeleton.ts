import type { RouteLocationNormalized, Router } from 'vue-router';
import { nextTick } from 'vue';
import {
  ROUTE_CONTENT_SKELETON_ENABLED,
  forceHideRouteContentSkeleton,
  scheduleHideRouteContentSkeleton,
  tryShowRouteContentSkeleton
} from '@/utils/router/routeContentSkeleton';

/**
 * 目标是否为带侧栏/顶栏的主壳（存在 ArtPageContent 内容区）
 */
function usesMainShell(to: RouteLocationNormalized): boolean {
  const p = to.path;
  if (p === '/login' || p.startsWith('/auth/')) return false;
  if (p === '/403' || p === '/500') return false;
  if (to.name === 'Exception404') return false;
  return true;
}

function shouldShowRouteSkeleton(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): boolean {
  if (to.meta?.hideRouteSkeleton) return false;
  if (from.fullPath === to.fullPath) return false;
  if (!usesMainShell(to)) return false;
  // 首次进入 SPA（例如刷新落在业务页）不再叠骨架，避免与首屏竞争
  if (from.matched.length === 0) return false;
  return true;
}

/**
 * 须在 setupBeforeEachGuard 之后注册，以便主守卫若 next(false) 时本守卫不会误显示骨架
 */
export function setupRouteContentSkeletonGuard(router: Router): void {
  if (!ROUTE_CONTENT_SKELETON_ENABLED) {
    return;
  }

  router.beforeEach((to, from) => {
    if (shouldShowRouteSkeleton(to, from)) {
      tryShowRouteContentSkeleton();
    }
  });

  router.beforeResolve(() => {
    nextTick(() => {
      scheduleHideRouteContentSkeleton();
    });
  });

  router.onError(() => {
    forceHideRouteContentSkeleton();
  });
}
