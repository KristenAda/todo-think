// client/src/routers/modules/base.ts
const BlankLayout = () => import('@/layouts/blank/Index.vue');
const baseRouters = [
  {
    // 使用一个虚拟的根路径来包裹这些基础页面
    path: '/base',
    component: BlankLayout,
    meta: {
      hidden: true,
    },
    // 将实际的页面作为 children，使用绝对路径 (以 '/' 开头)
    // 这样可以直接通过 /login 访问，同时又能复用 BlankLayout
    children: [
      {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/login/Index.vue'),
        meta: { title: '系统登录', notNeedAuth: true },
      },
      {
        path: '/401',
        name: '401',
        component: () => import('@/views/error/401.vue'),
        meta: { title: '无权限访问', notNeedAuth: true },
      },
      {
        path: '/404',
        name: '404',
        component: () => import('@/views/error/404.vue'),
        meta: { title: '页面不存在', notNeedAuth: true },
      },
    ],
  },
  // 捕获所有未匹配的路由并重定向到 404 (注意：这个重定向要放在最外层)
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: {
      hidden: true,
    },
  },
];
export default baseRouters;
