<template>
  <div class="header-navbar">
    <div class="header-left">
      <el-icon class="fold-btn" @click="toggleSidebar">
        <component :is="isCollapse ? 'Expand' : 'Fold'" />
      </el-icon>

      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-for="item in breadcrumbList" :key="item.path">
          {{ item.meta?.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header-right">
      <el-dropdown>
        <div class="user-info">
          <el-avatar :size="30" icon="UserFilled" />
          <span class="nickname">管理员</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>修改密码</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout"
              >退出登录</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGlobalStore } from '@/stores/modules/global';
import { useAuthorityStore } from '@/stores/authority';

const route = useRoute();
const globalStore = useGlobalStore();
const authorityStore = useAuthorityStore();

const isCollapse = computed(() => globalStore.isCollapse);

const breadcrumbList = computed(() => {
  // 过滤出带 title 的路由节点
  return route.matched.filter(
    (item) => item.meta && item.meta.title && item.path !== '/',
  );
});

const toggleSidebar = () => {
  globalStore.isCollapse = !globalStore.isCollapse;
};

const handleLogout = () => {
  /* Logout Logic */
  authorityStore.logout();
};
</script>

<style scoped lang="scss">
.header-navbar {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  .header-left {
    display: flex;
    align-items: center;
    .fold-btn {
      font-size: 20px;
      cursor: pointer;
      margin-right: 15px;
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      .nickname {
        margin-left: 8px;
        font-size: 14px;
      }
    }
  }
}
</style>
