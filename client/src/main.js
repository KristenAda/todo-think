import { closeLoading } from '@/utils/feedback/loading';
import router from '@/routers';
import pinia from '@/stores';
import { layoutInstall } from '@/layouts/admin/admin-install';
import App from './App.vue';
import '@/utils';
import 'element-plus/dist/index.css';
import 'font-awesome/css/font-awesome.min.css';
import '@/utils/common/rem';

const app = createApp(App);
layoutInstall(app);
app.use(router);
app.use(pinia);
app.mount('#app');
app.config.errorHandler = (err, instance, info) => {
  console.error('app.errorHandler', err);
  console.error('app.instanceHandler', instance);
  console.info('app.infoHandler', info);
  closeLoading();
};
