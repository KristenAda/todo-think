import { AppRouteRecord } from '@/types/router';

/** 本人积分流水（个人中心等）；导出供后端菜单模式下注入 */
export const pointsLedgerMineMenuRoute: AppRouteRecord = {
  path: 'points-ledger/mine',
  name: 'PointsLedgerMine',
  component: '/system/points-ledger/index',
  meta: {
    title: 'menus.business.pointsLedgerMine',
    icon: 'mdi:history',
    keepAlive: true,
    isHide: true,
    allowAccessWhenHidden: true
    // 不设 roles：登录即可（服务端 /mine 仅返回本人流水）；避免前端菜单模式下非 admin 被滤掉
  }
};

export const businessRoutes: AppRouteRecord = {
  path: '/business',
  name: 'Business',
  component: '/index/index',
  meta: {
    title: 'menus.business.title',
    icon: 'mdi:briefcase-account-outline',
    roles: ['admin', 'R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'performance-rules',
      name: 'PerformanceRules',
      component: '/performance/rules/index',
      meta: {
        title: 'menus.business.performanceRules',
        icon: 'mdi:calculator-variant-outline',
        keepAlive: true,
        roles: ['admin', 'R_SUPER', 'R_ADMIN']
      }
    },
    pointsLedgerMineMenuRoute,
    {
      path: 'points-ledger',
      name: 'PointsLedgerLog',
      component: '/system/points-ledger/index',
      meta: {
        title: 'menus.business.pointsLedger',
        icon: 'mdi:history',
        keepAlive: true,
        roles: ['admin', 'R_SUPER', 'R_ADMIN']
      }
    }
  ]
};
