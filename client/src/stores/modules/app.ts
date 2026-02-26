import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', () => {
  // 侧边栏状态
  const sidebar = ref({
    opened: true, // 默认展开
    withoutAnimation: false,
  });

  // 切换侧边栏
  const toggleSideBar = () => {
    sidebar.value.opened = !sidebar.value.opened;
    sidebar.value.withoutAnimation = false;
  };

  const closeSideBar = (withoutAnimation: boolean) => {
    sidebar.value.opened = false;
    sidebar.value.withoutAnimation = withoutAnimation;
  };

  return {
    sidebar,
    toggleSideBar,
    closeSideBar,
  };
});
