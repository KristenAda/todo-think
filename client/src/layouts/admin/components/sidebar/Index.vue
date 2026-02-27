<template>
  <div class="sidebar-wrapper">
    <div class="logo-box">
      <img src="@/assets/logo.png" alt="logo" />
      <transition name="fade">
        <span v-if="!isCollapse" class="logo-title">Todo Think</span>
      </transition>
    </div>

    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
      >
        <sidebar-item
          v-for="item in routes"
          :key="item.path"
          :item="item"
          :base-path="item.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { useGlobalStore } from '@/stores/modules/global';
import SidebarItem from './SidebarItem.vue';

const globalStore = useGlobalStore();
const isCollapse = computed(() => globalStore.isCollapse);

const router = useRouter();
const route = useRoute();

const routes = computed(() => router.options.routes);
const activeMenu = computed(() => route.path);
</script>

<style scoped lang="scss">
.sidebar-wrapper {
  height: 100%;
  background-color: #304156;
  display: flex;
  flex-direction: column;

  .logo-box {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2b2f3a;
    color: #fff;
    overflow: hidden;

    img {
      width: 32px;
      height: 32px;
    }

    .logo-title {
      margin-left: 10px;
      font-weight: bold;
      white-space: nowrap;
    }
  }

  :deep(.el-menu) {
    border: none;
    background-color: transparent;
    width: 100% !important;

    .el-menu-item,
    .el-sub-menu__title {
      color: #bfcbd9;
    }

    .el-menu-item:hover,
    .el-sub-menu__title:hover {
      background-color: #263445;
    }

    .el-menu-item.is-active {
      color: #409eff;
      background-color: #1f2d3d;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.28s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
