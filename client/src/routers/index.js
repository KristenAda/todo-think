import { createRouter, createWebHistory } from 'vue-router';
import NProgress from '@/configs/nprogress';
import { beforeEachUtil, applyCustomAliases } from './utils/router-util';

import baseRouters from './modules/base';
import personaRouters from './modules/persona';
import digitalPerformanceRouters from './modules/digital-performance';

const routes = [
  ...baseRouters,
  ...personaRouters,
  ...digitalPerformanceRouters,
];
const routesWithAliases = applyCustomAliases(routes);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routesWithAliases,
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
  console.log('router.onError', handler);
});

/**
 * @description 路由跳转结束
 * */
router.afterEach(() => {
  NProgress.done();
});

export default router;
