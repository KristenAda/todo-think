import Router from '@koa/router';
import { projectController, taskController, performanceController } from './task.controller';

const router = new Router();

// ======================== Project Routes ========================
router.get('/projects', projectController.page.bind(projectController));
router.get('/projects/list', projectController.list.bind(projectController));
router.get('/projects/org-members', projectController.orgMembers.bind(projectController));
router.get('/projects/:id', projectController.info.bind(projectController));
router.post('/projects', projectController.create.bind(projectController));
router.put('/projects/:id', projectController.update.bind(projectController));
router.delete('/projects/:id', projectController.delete.bind(projectController));

// ======================== Task Routes ========================
router.get('/tasks', taskController.page.bind(taskController));
router.get('/tasks/:id', taskController.info.bind(taskController));
router.post('/tasks', taskController.create.bind(taskController));
router.put('/tasks/:id', taskController.update.bind(taskController));
router.delete('/tasks/:id', taskController.delete.bind(taskController));

// 状态流转接口
router.post('/tasks/:id/start-work', taskController.startWork.bind(taskController));
router.post('/tasks/:id/worklogs', taskController.addWorkLog.bind(taskController));
router.post('/tasks/:id/submit-test', taskController.submitTest.bind(taskController));
router.post('/tasks/:id/qa-audit', taskController.qaAudit.bind(taskController));

// ======================== Performance Routes ========================
router.get('/performance/stats', performanceController.stats.bind(performanceController));

export default router;
