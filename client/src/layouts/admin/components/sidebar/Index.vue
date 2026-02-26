<template>
  <div
    class="sidebar-wrapper"
    :style="{ width: isCollapse ? '64px' : '210px' }"
  >
    <div class="logo-box">
      <img src="@/assets/logo.png" alt="logo" />
      <span v-show="!isCollapse">Todo Think</span>
    </div>

    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
        router
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
// 后期这里改用 Pinia 管理
const globalStore = useGlobalStore();
const isCollapse = computed(() => globalStore.isCollapse);

const router = useRouter();
const route = useRoute();

const routes = computed(() => {
  console.log('router.options.routes :>> ', router.options.routes);
  return router.options.routes;
});
const activeMenu = computed(() => route.path);
</script>

<style scoped lang="scss">
.sidebar-wrapper {
  height: 100%;
  background-color: #304156;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .logo-box {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2b2f3a;
    color: #fff;
    img {
      width: 32px;
      height: 32px;
    }
    span {
      margin-left: 10px;
      font-weight: bold;
      white-space: nowrap;
    }
  }

  :deep(.el-menu) {
    border: none;
    background-color: transparent;
    width: 100% !important;
    .el-menu-item {
      color: #bfcbd9;
      &:hover {
        background-color: #263445;
      }
      &.is-active {
        color: #409eff;
        background-color: #1f2d3d;
      }
    }
  }
}
</style>
