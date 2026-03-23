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
  background-color: var(--bg-primary);
  overflow: hidden;

  .sidebar-container {
    transition: width var(--transition-normal);
    width: $sideBarWidth !important;
    height: 100%;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1001;
    overflow: hidden;
    background: linear-gradient(135deg, var(--sidebar-bg-start) 0%, var(--sidebar-bg-end) 100%);
    box-shadow: var(--shadow-md);
    flex-shrink: 0;
  }

  .main-container {
    flex: 1;
    min-height: 100%;
    margin-left: $sideBarWidth;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: margin-left var(--transition-normal);
    width: calc(100% - #{$sideBarWidth});
    background-color: #ffffff;
  }

  .fixed-header {
    position: sticky;
    top: 0;
    right: 0;
    z-index: 9;
    width: 100%;
    background-color: var(--bg-white);
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;
  }

  &.hideSidebar {
    .sidebar-container {
      width: $hideSideBarWidth !important;
    }
    .main-container {
      margin-left: $hideSideBarWidth;
      width: calc(100% - #{$hideSideBarWidth});
    }
  }
}
</style>
