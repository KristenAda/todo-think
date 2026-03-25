import Router from '@koa/router';
import c from './dashboard.controller';

const router = new Router({ prefix: '/dashboard' });

router.get('/workbench', c.workbench.bind(c)); // å\ðZpn

export default router;
