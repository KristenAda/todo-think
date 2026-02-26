<template>
  <div :class="classObj" class="app-wrapper">
    <Sidebar class="sidebar-container" />

    <div class="main-container">
      <div class="fixed-header">
        <Header />
      </div>

      <AppMain />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/modules/app';
import { Sidebar, Header, AppMain } from './components';

const appStore = useAppStore();

const classObj = computed(() => ({
  hideSidebar: !appStore.sidebar.opened,
  openSidebar: appStore.sidebar.opened,
  withoutAnimation: appStore.sidebar.withoutAnimation,
}));
</script>

<style lang="scss" scoped>
// 定义 CSS 变量方便维护
$sideBarWidth: 210px;
$hideSideBarWidth: 64px;

.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;

  .sidebar-container {
    transition: width 0.28s;
    width: $sideBarWidth !important;
    height: 100%;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1001;
    overflow: hidden;
    background-color: #304156;
  }

  .main-container {
    flex: 1;
    min-height: 100%;
    transition: margin-left 0.28s;
    margin-left: $sideBarWidth;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .fixed-header {
    position: sticky;
    top: 0;
    right: 0;
    z-index: 9;
    width: 100%;
    transition: width 0.28s;
  }

  // 折叠后的样式覆盖
  &.hideSidebar {
    .sidebar-container {
      width: $hideSideBarWidth !important;
    }
    .main-container {
      margin-left: $hideSideBarWidth;
    }
  }

  // 适配移动端或取消动画（可选）
  &.withoutAnimation {
    .sidebar-container,
    .main-container {
      transition: none;
    }
  }
}
</style>
