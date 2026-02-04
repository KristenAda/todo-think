/**
 * @description: 全局指令注册
 */

import permissionDirective from '@/directives/permission';
import ellipsisDirective from '@/directives/ellipsis';
import copyDirective from '@/directives/copy';
import tooltipDirective from '@/directives/tooltip';

export const install = (app) => {
  app.directive('permission', permissionDirective);
  app.directive('ellipsis', ellipsisDirective);
  app.directive('copyText', copyDirective);
  app.directive('tooltip-on-disable', tooltipDirective);
  app.directive('focus', {
    mounted(el) {
      el.focus();
    },
  });
};
