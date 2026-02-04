/**
 * @description: element相关注册
 */

import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/theme-chalk/dark/css-vars.css';
import ElementPlus from 'element-plus';

export const install = (app) => {
  // 全局注册element-plus图标
  Object.entries(ElementPlusIconsVue).forEach(([key, component]) => {
    // 只有当组件未注册过时，才进行注册
    if (!app.component(key)) {
      app.component(key, component);
    }
  });
  app.use(ElementPlus);
};
