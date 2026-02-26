// client/src/routers/modules/system.ts
const Layout = () => import('@/layouts/admin/AdminLayout.vue');

const systemRouters = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/home/Index.vue'),
        meta: { title: '指挥中心', icon: 'House' },
      },
    ],
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: '/system/user',
        name: 'SysUser',
        component: () => import('@/views/system/user/Index.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: '/system/role',
        name: 'SysRole',
        component: () => import('@/views/system/role/Index.vue'),
        meta: { title: '角色管理', icon: 'Avatar' },
      },
      {
        path: '/system/menu',
        name: 'SysMenu',
        component: () => import('@/views/system/menu/Index.vue'),
        meta: { title: '菜单管理', icon: 'Menu' },
      },
      {
        path: '/system/dept',
        name: 'SysDept',
        component: () => import('@/views/system/dept/Index.vue'),
        meta: { title: '部门管理', icon: 'OfficeBuilding' },
      },
    ],
  },
];

export default systemRouters;
