import { ref } from 'vue';

/** 路由切换时右侧内容区骨架：改为 true 可重新开启 */
export const ROUTE_CONTENT_SKELETON_ENABLED = false;

/** 主布局（#app-content / ArtPageContent）内是否显示路由切换骨架 */
export const routeContentSkeletonVisible = ref(false);

const MIN_DISPLAY_MS = 80;

let shownAt = 0;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function tryShowRouteContentSkeleton(): void {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  routeContentSkeletonVisible.value = true;
  shownAt = Date.now();
}

/**
 * 在路由组件已解析后调用，带最短展示时间，避免极快 chunk 下骨架“闪一下”
 */
export function scheduleHideRouteContentSkeleton(): void {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  const elapsed = Date.now() - shownAt;
  const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
  hideTimer = setTimeout(() => {
    routeContentSkeletonVisible.value = false;
    hideTimer = null;
  }, wait);
}

export function forceHideRouteContentSkeleton(): void {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  routeContentSkeletonVisible.value = false;
}
