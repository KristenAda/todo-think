import { createRouter, createWebHistory } from 'vue-router';
import NProgress from '@/configs/nprogress';
import { beforeEachUtil } from './utils/router-util';

// 引入模块路由
import baseRouters from './modules/base';
import systemRouters from './modules/system';

// 组合静态路由
// 注意：在标准 RBAC 中，业务模块(persona/digitalPerformance)后续应改为由后端动态下发，
// 只有 baseRouters(如 Login, 404) 会在这里静态注册。目前过渡期暂时保留拼接。
const routes = [...baseRouters, ...systemRouters];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes, // 直接使用 routes，不再套用 applyCustomAliases
  scrollBehavior() {
    return {
      el: '#app',
      top: 0,
      behavior: 'smooth',
    };
  },
});

// 注册前置路由守卫
router.beforeEach(async (to, from, next) => {
  await beforeEachUtil(to, from, next);
});

// 监听错误
router.onError((handler) => {
  NProgress.done();
  console.error('路由跳转异常:', handler);
});

// 路由跳转结束
router.afterEach(() => {
  NProgress.done();
});

export default router;
