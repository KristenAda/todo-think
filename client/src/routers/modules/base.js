export default [
  {
    path: '/',
    name: 'M020001',
    component: () => import('@/views/home/Index.vue'),
    meta: {
      layout: 'admin',
      title: '首页',
      faIcon: 'fa-home',
      navList: ['工单系统'],
    },
  },
  {
    path: '/test',
    name: 'M020002',
    component: () => import('@/views/pubComponents/index.vue'),
    meta: {
      layout: 'admin',
      title: '测试页',
      faIcon: 'fa-question-circle',
      navList: ['一级菜单', '二级菜单'],
    },
  },
];
