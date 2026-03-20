<template>
  <div class="sidebar-wrapper">
    <!-- Logo 区域 -->
    <div class="logo-box">
      <img src="@/assets/logo.png" alt="logo" />
      <transition name="fade">
        <span v-if="!isCollapse" class="logo-title">Todo Think</span>
      </transition>
    </div>

    <!-- 菜单列表 -->
    <el-scrollbar class="menu-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :default-openeds="defaultOpeneds"
        :collapse="isCollapse"
        :collapse-transition="false"
        mode="vertical"
        class="sidebar-menu"
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

// 获取所有菜单的 path，用于默认展开
const defaultOpeneds = computed(() => {
  return routes.value
    .filter((item) => item.children && item.children.length > 0)
    .map((item) => item.path);
});
</script>

<style scoped lang="scss">
.sidebar-wrapper {
  height: 100%;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .logo-box {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.2);
    color: #fff;
    overflow: hidden;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;

    img {
      width: 32px;
      height: 32px;
      transition: all 0.3s ease;
    }

    .logo-title {
      margin-left: 12px;
      font-weight: 600;
      white-space: nowrap;
      font-size: 16px;
      letter-spacing: 0.5px;
    }

    &:hover img {
      transform: scale(1.1);
    }
  }

  .menu-scrollbar {
    flex: 1;
    overflow-y: auto;

    :deep(.el-scrollbar__wrap) {
      padding: 8px 0;
    }
  }

  :deep(.sidebar-menu) {
    border: none;
    background-color: transparent;
    width: 100% !important;

    .el-menu-item,
    .el-sub-menu__title {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      transition: all 0.3s ease;
      height: 40px;
      line-height: 40px;
      margin: 4px 8px;
      border-radius: 6px;
      padding-left: 20px !important;

      &:hover {
        background-color: rgba(91, 141, 238, 0.2) !important;
        color: #fff;
      }
    }

    .el-menu-item.is-active {
      background: linear-gradient(90deg, #5b8dee 0%, #6b9eff 100%) !important;
      color: #fff !important;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(91, 141, 238, 0.3);

      &:hover {
        background: linear-gradient(90deg, #4a7fdd 0%, #5b8dee 100%) !important;
      }
    }

    .el-sub-menu {
      &.is-opened > .el-sub-menu__title {
        background-color: rgba(91, 141, 238, 0.15) !important;
        color: #fff;
      }
    }

    .el-sub-menu__title {
      padding-right: 20px !important;

      &:hover {
        background-color: rgba(91, 141, 238, 0.2) !important;
      }
    }

    .el-menu-item-group__title {
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      padding-left: 20px !important;
      margin-top: 8px;
      margin-bottom: 4px;
    }

    .el-menu--inline {
      background-color: transparent;

      .el-menu-item {
        padding-left: 40px !important;
        color: rgba(255, 255, 255, 0.6);

        &:hover {
          background-color: rgba(91, 141, 238, 0.15) !important;
          color: rgba(255, 255, 255, 0.9);
        }

        &.is-active {
          background: linear-gradient(
            90deg,
            #5b8dee 0%,
            #6b9eff 100%
          ) !important;
          color: #fff !important;
        }
      }
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
