// client/src/routers/modules/system.ts
const Layout = () => import('@/layouts/admin/AdminLayout.vue');

const systemRouters = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    meta: {
      hidden: true,
    },
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/home/Index.vue'),
        meta: { title: '首页', icon: 'House' },
      },
    ],
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'fa fa-cog' },
    children: [
      {
        path: '/system/user',
        name: 'SysUser',
        component: () => import('@/views/system/user/Index.vue'),
        meta: { title: '用户管理', icon: 'fa fa-user' },
      },
      {
        path: '/system/role',
        name: 'SysRole',
        component: () => import('@/views/system/role/Index.vue'),
        meta: { title: '角色管理', icon: 'fa fa-user' },
      },
      {
        path: '/system/menu',
        name: 'SysMenu',
        component: () => import('@/views/system/menu/Index.vue'),
        meta: { title: '菜单管理', icon: 'fa fa-bars' },
      },
      {
        path: '/system/dept',
        name: 'SysDept',
        component: () => import('@/views/system/dept/Index.vue'),
        meta: { title: '部门管理', icon: 'fa fa-building' },
      },
    ],
  },
  {
    path: '/profile',
    component: Layout,
    redirect: '/profile/info',
    meta: { title: '个人中心', icon: 'User', hidden: true },
    children: [
      {
        path: '/profile/info',
        name: 'ProfileInfo',
        component: () => import('@/views/profile/info/Index.vue'),
        meta: { title: '个人信息', icon: 'User', hidden: true },
      },
      {
        path: '/profile/password',
        name: 'ProfilePassword',
        component: () => import('@/views/profile/password/Index.vue'),
        meta: { title: '修改密码', icon: 'Lock', hidden: true },
      },
    ],
  },
];

export default systemRouters;
