export default [
  // 资质信息管理
  {
    path: '/persona/required-dimension-config/qualification-info-management/index',
    name: 'qualification-info-management',
    component: () =>
      import('@/views/persona/required-dimension-config/qualification-info-management/Index.vue'),
    meta: {
      layout: 'admin',
      title: '资质信息管理',
      faIcon: 'fa-file-text', // 图标
      navList: ['人员画像', '必备维度配置'],
    },
  },
  // 资质任务配置
  {
    path: '/persona/required-dimension-config/qualification-task-config/index',
    name: 'qualification-task-config',
    component: () =>
      import('@/views/persona/required-dimension-config/qualification-task-config/Index.vue'),
    meta: {
      layout: 'admin',
      title: '资质任务配置', // 对应中文模块名
      faIcon: 'fa-th-large', // 图标
      navList: ['人员画像', '必备维度配置'],
    },
  },

  // 资质导出记录
  {
    path: '/persona/required-dimension-config/qualification-export-record/index',
    name: 'qualification-export-record',
    component: () =>
      import('@/views/persona/required-dimension-config/qualification-export-record/Index.vue'),
    meta: {
      layout: 'admin',
      title: '资质导出记录', // 对应中文模块名
      faIcon: 'fa-th-large', // 图标
      navList: ['人员画像', '必备维度配置'],
    },
  },

  // 资质关联员工统计
  {
    path: '/persona/required-dimension-config/qualification-staff-association-statistics/index',
    name: 'qualification-staff-association-statistics',
    component: () =>
      import('@/views/persona/required-dimension-config/qualification-staff-association-statistics/Index.vue'),
    meta: {
      layout: 'admin',
      title: '资质关联员工统计', // 对应中文模块名
      faIcon: 'fa-th-large', // 图标
      navList: ['人员画像', '必备维度配置'],
    },
  },
];
