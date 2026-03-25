import Router from '@koa/router';
import c from './project.controller';

const router = new Router({ prefix: '/projects' });

router.get('/',           c.page.bind(c));       // 分页查询
router.get('/all',        c.listAll.bind(c));    // 全量列表（下拉用）
router.get('/org-members', c.orgMembers.bind(c)); // 当前用户组织成员（负责人候选）
router.get('/:id',        c.info.bind(c));       // 详情
router.post('/',          c.create.bind(c));     // 新建
router.put('/:id',        c.update.bind(c));     // 编辑
router.delete('/:id',     c.delete.bind(c));     // 软删除

export default router;
