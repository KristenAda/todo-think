import { useAuthorityStore } from '@/stores/authority';
import NProgress from '@/configs/nprogress';
import useAxiosAbortStore from '@/stores/base/axios-abort';

// 路由白名单：不需要 Token 也能访问的页面
const whiteList = ['/login', '/404', '/401'];

/**
 * 路由守卫核心函数，用于在路由跳转前进行 Token 和权限校验
 */
export const beforeEachUtil = async (to, from, next) => {
  if (!to.meta?.notNeedProgress) {
    NProgress.start();
  }

  // 切换路由时，取消上一页未完成的请求
  useAxiosAbortStore().cancelAll();

  const authorityStore = useAuthorityStore();
  const hasToken = authorityStore.authToken;

  if (hasToken) {
    if (to.path === '/login') {
      // 已登录状态下访问登录页，直接跳转到首页
      next({ path: '/' });
      NProgress.done();
    } else {
      // TODO: 这里是动态路由的切入点。
      // 后续在这里判断 authorityStore.permissions 是否为空。
      // 若为空，则调用后端 /sys/menu/tree 接口拉取当前用户的菜单和权限，
      // 并通过 router.addRoute() 动态注入路由。

      // 目前先把骨架搭好，直接放行
      next();
    }
  } else if (whiteList.includes(to.path)) {
    next(); // 在白名单内，直接放行
  } else {
    // 不在白名单，携带原来的目标路径重定向到登录页
    next(`/login?redirect=${to.path}`);
    NProgress.done();
  }
};
