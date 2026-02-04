/**
 * @description: vant相关注册
 */

import Vant from 'vant';
import 'vant/lib/index.css';

export const install = (app) => {
  app.use(Vant);
};
