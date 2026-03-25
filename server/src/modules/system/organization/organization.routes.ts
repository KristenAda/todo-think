import Router from '@koa/router';
import c from './organization.controller';

const router = new Router({ prefix: '/departments' });

router.get('/tree', c.getTree);
router.get('/users', c.getAllUsers);

// 管理者（多对多）
router.get('/:id/managers', c.getManagers);
router.post('/:id/managers', c.addManagers);
router.delete('/:id/managers/:userId', c.removeManager);

// 成员（多对多）
router.get('/:id/members', c.getMembers);
router.post('/:id/members', c.addMembers);
router.delete('/:id/members/:userId', c.removeMember);

export default router;
