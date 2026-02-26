import { defineStore } from 'pinia';
import piniaPersistConfig from '@/stores/helper/persist';

/**
 * 授权信息 Store
 * 适配 Todo-Think RBAC 体系，管理用户信息、JWT Token 及权限标识
 */
export const useAuthorityStore = defineStore({
  id: 'authority',
  state: () => ({
    // 1. 登录用户信息对象 (对应后端 SysUser 模型)
    loginInfo: {} as Record<string, any>,

    // 2. 认证令牌 (JWT)
    authToken: '',

    // 3. 用户按钮权限标识集合 (例如: ['sys:user:add', '*'])
    permissions: [] as string[],
  }),

  getters: {
    // 快捷判断是否已登录
    isLoggedIn: (state) => !!state.authToken,
  },

  actions: {
    /**
     * 设置 AuthorityState 的通用方法
     * 保持与 globalStore 的 setGlobalState 逻辑一致
     */
    setAuthorityState(...args: [string, any]) {
      this.$patch({ [args[0]]: args[1] });
    },

    /**
     * 判断是否拥有特定权限
     * @param perm 权限标识字符串
     */
    hasPermission(perm: string) {
      // 假设超级管理员拥有 '*' 权限标识
      return this.permissions.includes('*') || this.permissions.includes(perm);
    },

    /**
     * 清空所有授权信息 (退出登录、Token 失效时调用)
     */
    clearAuthorityInfo() {
      this.$patch({
        loginInfo: {},
        authToken: '',
        permissions: [],
      });
      // 这里的持久化插件会自动处理 localStorage/sessionStorage 的清理
    },

    /**
     * 彻底登出并重定向
     */
    async logout() {
      this.clearAuthorityInfo();
      // 强制跳转回登录页，清空路由状态
      window.location.replace('/login');
    },
  },

  // 使用你项目统一的持久化配置，Key 建议保持 sip- 前缀风格
  persist: piniaPersistConfig('todo-think-authority', [
    'loginInfo',
    'authToken',
    'permissions',
  ]),
});
