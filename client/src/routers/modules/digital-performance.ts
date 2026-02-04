const FIRST_NAV = '数字绩效';
const SECOND_NAV = '任务工分因子配置';
const WORK_POINT_MONTHLY_NAV = '月度工分管理';
const WORK_POINT_DAILY_NAV = '日度工分管理';
const WORK_POINTS_APPEAL_AND_REVIEW = '工分申诉与审核';
const navArr = [FIRST_NAV, SECOND_NAV];
const workPointArr = [FIRST_NAV, WORK_POINT_MONTHLY_NAV];
const scoreAppealdArr = [FIRST_NAV, WORK_POINTS_APPEAL_AND_REVIEW];
const workPointDailyArr = [FIRST_NAV, WORK_POINT_DAILY_NAV];
export default [
  // 因子管理
  {
    path: '/task-work-point-factor-management-index',
    name: 'task-work-point-factor-management',
    component: () =>
      import('@/views/digital-performance/task-work-point-factor-config/task-work-point-factor-management/Index.vue'),
    meta: {
      layout: 'admin',
      title: '因子管理', // 对应中文模块名
      faIcon: 'fa-cogs', // 推荐替换为管理/齿轮类图标（贴合“因子管理”场景）
      navList: navArr,
    },
  },
  // 工分标准管理
  {
    path: '/task-work-point-standard-management-index',
    name: 'task-work-point-standard-management',
    component: () =>
      import('@/views/digital-performance/task-work-point-factor-config/task-work-point-standard-management/Index.vue'),
    meta: {
      layout: 'admin',
      title: '工分标准管理', // 对应中文模块名
      faIcon: 'fa-cogs', // 推荐替换为管理/齿轮类图标（贴合“工分标准管理”场景）
      navList: navArr,
    },
  },
  // 任务因子绑定
  {
    path: '/task-work-point-rule-config-index',
    name: 'task-work-point-rule-config',
    component: () =>
      import('@/views/digital-performance/task-work-point-factor-config/task-work-point-rule-config/Index.vue'),
    meta: {
      layout: 'admin',
      title: '任务因子绑定', // 对应中文模块名
      faIcon: 'fa-cogs', // 推荐替换为管理/齿轮类图标（贴合“规则管理”场景）
      navList: navArr,
    },
  },

  // 修改记录
  {
    path: '/task-work-point-change-record-index',
    name: 'task-work-point-change-record',
    component: () =>
      import('@/views/digital-performance/task-work-point-factor-config/task-work-point-change-record/Index.vue'),
    meta: {
      layout: 'admin',
      title: '修改记录', // 对应中文模块名
      faIcon: 'fa-cogs', // 推荐替换为管理/齿轮类图标（贴合“修改记录”场景）
      navList: navArr,
    },
  },

  // =================================月度工分管理======================================
  // 月度工分看板
  {
    path: '/monthly-work-score-board-index',
    name: 'monthly-work-score-board',
    component: () =>
      import('@/views/digital-performance/monthly-work-score-manage/monthly-work-score-board/Index.vue'),
    meta: {
      layout: 'admin',
      title: '月度工分看板', // 对应中文模块名
      faIcon: 'fa-bar-chart',
      navList: workPointArr,
    },
  },
  // 工分调整
  {
    path: '/work-score-adjust-index',
    name: 'work-score-adjust',
    component: () =>
      import('@/views/digital-performance/monthly-work-score-manage/work-score-adjust/Index.vue'),
    meta: {
      layout: 'admin',
      title: '工分调整', // 对应中文模块名
      faIcon: 'fa-sliders',
      navList: workPointArr,
    },
  },

  // =================================任务工分申诉与审核======================================
  // 任务工分申诉
  {
    path: '/task-work-score-appeal-index',
    name: 'task-work-score-appeal',
    component: () =>
      import('@/views/digital-performance/task-work-score-appeal/task-work-appeal/Index.vue'),
    meta: {
      layout: 'admin',
      title: '任务工分申诉', // 对应中文模块名
      faIcon: 'fa-file-text-o	',
      navList: scoreAppealdArr,
    },
  },
  // 任务工分审核
  {
    path: '/task-work-score-score-index',
    name: 'task-work-score-score',
    component: () =>
      import('@/views/digital-performance/task-work-score-appeal/task-work-score/Index.vue'),
    meta: {
      layout: 'admin',
      title: '任务工分审核', // 对应中文模块名
      faIcon: 'fa-check-square-o',
      navList: scoreAppealdArr,
    },
  },
  //= ============================日度工分管理
  {
    path: '/daily-work-point-calculation-index',
    name: 'task-work-point-dailyWorkPoint-calculation',
    component: () =>
      import('@/views/digital-performance/daily-work-point-management/daily-work-point-calculation/index.vue'),
    meta: {
      layout: 'admin',
      title: '日工分核算', // 对应中文模块名
      faIcon: 'fa-cogs', // 推荐替换为管理/齿轮类图标（贴合“因子管理”场景）
      navList: workPointDailyArr,
    },
  },
  // 日工分排名
  {
    path: '/daily-work-point-ranking-index',
    name: 'task-work-point-dailyWorkPoint-ranking',
    component: () =>
      import('@/views/digital-performance/daily-work-point-management/daily-work-point-ranking/index.vue'),
    meta: {
      layout: 'admin',
      title: '日工分排名', // 对应中文模块名
      faIcon: 'fa-cogs', // 推荐替换为管理/齿轮类图标（贴合“工分标准管理”场景）
      navList: workPointDailyArr,
    },
  },
];
