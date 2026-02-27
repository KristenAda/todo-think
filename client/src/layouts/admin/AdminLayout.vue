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
import { computed } from 'vue';
import { useGlobalStore } from '@/stores/modules/global';
import { Sidebar, Header, AppMain } from './components';

const globalStore = useGlobalStore();

// 通过 globalStore 统一控制侧边栏折叠
const classObj = computed(() => ({
  hideSidebar: globalStore.isCollapse,
  openSidebar: !globalStore.isCollapse,
}));
</script>

<style lang="scss" scoped>
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
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  }

  &.hideSidebar {
    .sidebar-container {
      width: $hideSideBarWidth !important;
    }
    .main-container {
      margin-left: $hideSideBarWidth;
    }
  }
}
</style>
