import { AppRouteRecord } from '@/types/router';

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
