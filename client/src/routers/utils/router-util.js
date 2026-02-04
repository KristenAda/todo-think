import { useAuthorityStore } from '@/stores/authority';
import NProgress from '@/configs/nprogress';
import useAxiosAbortStore from '@/stores/base/axios-abort';
import { PREFIX_A, PREFIX_B } from '@/configs/const/basic';

/**
 * 检查cookie中是否存在身份标识
 */
const checkCookieIsExistAuthInfo = () => {
  return false;
};

/**
 * 递归为所有路由追加固定格式的别名
 * @param {Array} routes 路由配置表
 */
export function applyCustomAliases(routes) {
  // 防护 1：确保传入的是数组，如果不是则直接返回空数组，防止 forEach/map 报错
  if (!Array.isArray(routes)) {
    console.warn('applyCustomAliases: routes is not an array', routes);
    return [];
  }

  return routes.map((route) => {
    // 防护 2：确保 route 对象存在且有 path 属性
    if (!route || typeof route.path !== 'string') return route;

    // 逻辑：拼接别名
    const originalPath = route.path.startsWith('/')
      ? route.path
      : `/${route.path}`;
    const targetAlias = `/${PREFIX_A}/${PREFIX_B}${originalPath}`.replace(
      /\/+/g,
      '/',
    );

    // 赋值别名
    if (route.alias) {
      const existing = Array.isArray(route.alias) ? route.alias : [route.alias];
      // 避免重复添加同一个别名
      if (!existing.includes(targetAlias)) {
        route.alias = [...existing, targetAlias];
      }
    } else {
      route.alias = targetAlias;
    }

    // 防护 3：递归处理子路由时，必须明确判断 children 是否为数组
    if (
      route.children &&
      Array.isArray(route.children) &&
      route.children.length > 0
    ) {
      route.children = applyCustomAliases(route.children);
    }

    return route;
  });
}

/**
 * 将登录信息保存到本地存储
 *
 * @param res 响应数据
 */
const saveLoginInfoToStore = (res) => {
  const useAuthority = useAuthorityStore();
  useAuthority.setLoginInfo(res.data.user);

  useAuthority.setAuthToken(res.data.token);
};

/**
 * 判断当前页面是否需要登录布局
 *
 * @returns 返回需要登录布局的页面类型数组，包括 'admin'、'mobile'、'front'
 */
const needLoginLayout = () => {
  return ['admin'];
};

/**
 * 路由守卫函数，用于在路由跳转前执行一系列逻辑判断
 *
 * @param to 目标路由对象
 * @param from 起始路由对象
 * @param next 路由跳转回调函数
 * @returns 无返回值，通过调用 next 函数实现路由跳转
 */
const beforeEachUtil = async (to, from, next) => {
  // if (!to.meta.notNeedProgress) {
  //   NProgress.start();
  // }
  useAxiosAbortStore().cancelAll(); // 取消所有请求
  next();
  // 存储全局参数
  // 去登录页或不需要验证的layout，放行
  // if (to.meta.isLogin || !needLoginLayout().some((f) => f === to.meta.layout)) {
  //   // 携带token
  //   if (to.meta.takeToken) {
  //     checkCookieIsExistAuthInfo();
  //   }
  //   next();
  // }
  // // 检查登录信息
  // next();
};

/**
 * 保存路由信息
 *
 * @param routers 路由信息数组
 * @returns 无返回值
 */
const saveRouters = (routers) => {
  const useAuthority = useAuthorityStore();
  useAuthority.setRouters(routers);
};

export { beforeEachUtil, saveLoginInfoToStore, saveRouters };
