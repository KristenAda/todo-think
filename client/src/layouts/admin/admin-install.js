/**
 * @description: admin-layout 统一注册
 */
// element相关注册
import { install as elementInstall } from '@/utils/app-install/element-install';

import { install as globalDirectiveInstall } from '@/utils/app-install/global-directive-install'; // 全局指令注册
import VueDOMPurifyHTML from 'vue-dompurify-html'; // TODO html渲染组件，避免xss攻击（不应放在全局注册）

export const layoutInstall = (app) => {
  elementInstall(app);
  globalDirectiveInstall(app);
  app.use(VueDOMPurifyHTML);
};
