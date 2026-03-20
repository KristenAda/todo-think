<template>
  <div class="header-navbar">
    <div class="header-left">
      <el-icon class="fold-btn" :title="isCollapse ? '展开菜单' : '收起菜单'" @click="toggleSidebar">
        <component :is="isCollapse ? 'Expand' : 'Fold'" />
      </el-icon>

      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-for="item in breadcrumbList" :key="item.path">
          {{ item.meta?.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header-right">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-dropdown-trigger">
          <el-avatar :size="40" :src="userAvatar" icon="UserFilled" />
          <div class="user-info-text">
            <div class="nickname">{{ userNickname }}</div>
            <div class="role">{{ userRole }}</div>
          </div>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>
              <span>修改密码</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Lock, SwitchButton, ArrowDown, Fold, Expand } from '@element-plus/icons-vue';
import { useGlobalStore } from '@/stores/modules/global';
import { useAuthorityStore } from '@/stores/authority';

const router = useRouter();
const route = useRoute();
const globalStore = useGlobalStore();
const authorityStore = useAuthorityStore();

const isCollapse = computed(() => globalStore.isCollapse);

const breadcrumbList = computed(() => {
  return route.matched.filter(
    (item) => item.meta && item.meta.title && item.path !== '/',
  );
});

const userNickname = computed(() => authorityStore.loginInfo?.nickname || '用户');
const userRole = computed(() => {
  const roles = authorityStore.loginInfo?.roles || [];
  return roles.length > 0 ? roles[0] : '普通用户';
});
const userAvatar = computed(() => authorityStore.loginInfo?.avatar || '');

const toggleSidebar = () => {
  globalStore.isCollapse = !globalStore.isCollapse;
};

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile/info');
      break;
    case 'password':
      router.push('/profile/password');
      break;
    case 'logout':
      authorityStore.logout();
      break;
  }
};
</script>

<style scoped lang="scss">
.header-navbar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: var(--bg-white);
  box-shadow: var(--shadow-sm);
  border-bottom: 1px solid var(--border-color);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;

    .fold-btn {
      font-size: 20px;
      cursor: pointer;
      color: var(--text-color-primary);
      transition: all 0.3s ease;
      padding: 4px;
      border-radius: 4px;

      &:hover {
        background-color: var(--fill-color-light);
        color: var(--color-primary);
      }
    }

    :deep(.breadcrumb) {
      .el-breadcrumb__item {
        color: var(--text-color-secondary);
        font-size: 14px;

        &:last-child {
          color: var(--text-color-primary);
          font-weight: 500;
        }
      }

      .el-breadcrumb__separator {
        color: var(--text-color-tertiary);
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;

    :deep(.el-dropdown) {
      width: 100%;
    }

    .user-dropdown-trigger {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background-color: var(--fill-color-light);
      }

      .user-info-text {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .nickname {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-color-primary);
        }

        .role {
          font-size: 12px;
          color: var(--text-color-secondary);
        }
      }

      .dropdown-icon {
        font-size: 14px;
        color: var(--text-color-tertiary);
        transition: transform 0.3s ease;
      }

      &:hover .dropdown-icon {
        transform: rotate(180deg);
        color: var(--color-primary);
      }
    }

    :deep(.el-dropdown-menu) {
      .el-dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        font-size: 14px;
        transition: all 0.3s ease;

        .el-icon {
          font-size: 16px;
        }

        &:hover {
          background-color: var(--fill-color-light);
          color: var(--color-primary);
        }
      }
    }
  }
}
</style>
