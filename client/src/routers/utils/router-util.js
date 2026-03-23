import { useAuthorityStore } from '@/stores/authority';
import NProgress from '@/configs/nprogress';
import useAxiosAbortStore from '@/stores/base/axios-abort';
import { menuToRoutes } from './menu-to-routes';

// 路由白名单：不需要 Token 也能访问的页面
const whiteList = ['/login', '/404', '/401'];

/**
 * 路由守卫核心函数，用于在路由跳转前进行 Token 和权限校验
 * @param to 目标路由
 * @param from 来源路由
 * @param next 路由导航函数
 * @param router Vue Router 实例
 */
export const beforeEachUtil = async (to, from, next, router) => {
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
      // ★★★ 动态路由加载逻辑 ★★★
      // eslint-disable-next-line no-lonely-if
      if (!authorityStore.routesLoaded) {
        try {
          // 1. 调用后端 /sys/menu/tree 获取用户菜单树
          const { getUserMenuTreeApi } = await import('@/apis/modules/auth');
          const menuTree = await getUserMenuTreeApi();

          // 2. 转换菜单树为路由对象
          const dynamicRoutes = menuToRoutes(menuTree);

          // 3. 逐个添加动态路由
          for (const route of dynamicRoutes) {
            router.addRoute(route);
          }

          // 4. 添加 404 catch-all 路由（必须在最后）
          router.addRoute({
            path: '/:pathMatch(.*)*',
            redirect: '/404',
            meta: { hidden: true },
          });

          // 5. 标记路由已加载
          authorityStore.setRoutesLoaded(true);

          // 6. 重新导航到目标路由（加上 replace: true）
          next({ ...to, replace: true });
        } catch (err) {
          console.error('加载动态路由失败:', err);
          // 加载失败时清空登录状态，重定向到登录页
          authorityStore.clearAuthorityInfo();
          next('/login');
          NProgress.done();
        }
      } else {
        // 路由已加载，直接放行
        next();
      }
    }
  } else if (whiteList.includes(to.path)) {
    next(); // 在白名单内，直接放行
  } else {
    // 不在白名单，携带原来的目标路径重定向到登录页
    next(`/login?redirect=${to.path}`);
    NProgress.done();
  }
};
