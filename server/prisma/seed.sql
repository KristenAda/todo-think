-- ==========================================
-- Todo-Think 种子数据（由 scripts/build-seed-from-dump.cjs 从 prisma/seed/todo_think_db.sql 生成）
-- 重新生成：npm run db -- seed-build（在 server 目录）
-- 说明：admin~guest（id 1~8）密码与 AuthUtil 一致（明文 123456）；perfadmin01/rulesadmin01/lenglin 为导出时密码
-- 排除：站内 message、upload_session、_prisma_migrations；User.avatar 大图片已置 NULL
-- ==========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- Department ----------
INSERT INTO `departments` VALUES (1, NULL, '0', '总公司', 0, '张三', '010-12345678', 'admin@company.com', 1, '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `departments` VALUES (2, 1, '0,1', '技术部', 1, '李四', '010-87654321', 'tech@company.com', 1, '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `departments` VALUES (3, 1, '0,1', '产品部', 2, '王五', '010-11111111', 'product@company.com', 1, '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `departments` VALUES (4, 1, '0,1', '运营部', 3, '赵六', '010-22222222', 'operation@company.com', 1, '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `departments` VALUES (5, 2, '0,1,2', '后端团队', 1, '孙七', '010-33333333', 'backend@company.com', 1, '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `departments` VALUES (6, 2, '0,1,2', '前端团队', 2, '周八', '010-44444444', 'frontend@company.com', 1, '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `departments` VALUES (7, 3, '0,1,3', '产品设计', 1, '吴九', '010-55555555', 'design@company.com', 1, '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `departments` VALUES (8, 4, '0,1,4', '市场推广', 1, '郑十', '010-66666666', 'market@company.com', 1, '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);

-- ---------- Role ----------
INSERT INTO `roles` VALUES (1, '超级管理员', 'admin', '系统超级管理员，拥有所有权限', 1, 1, 1, 0, '超级管理员', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `roles` VALUES (2, '普通管理员', 'manager', '拥有本部门及以下数据权限', 1, 2, 3, 0, '普通管理员', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `roles` VALUES (3, '部门主管', 'supervisor', '拥有本部门及以下数据权限', 1, 3, 3, 0, '部门主管', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `roles` VALUES (4, '普通员工', 'user', '仅拥有本人数据权限', 1, 4, 5, 0, '普通员工', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `roles` VALUES (5, '访客', 'guest', '仅拥有查看权限', 1, 5, 5, 0, '访客', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);
INSERT INTO `roles` VALUES (6, '默认角色', 'everyone', '登录用户自动叠加的基础菜单（如个人中心，无需绑定用户）', 1, 99, 5, 1, '种子：系统默认角色', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);

-- ---------- Menu ----------
INSERT INTO `menus` VALUES (1, NULL, 'System', '系统管理', '/system', '/index/index', 'ri:settings-3-line', 1, 1, 1, 1, 0, 0, 0, '', 0, '', 0, '', 0, '[]', NULL, '2026-04-09 17:29:22.000', '2026-04-10 06:14:00.638');
INSERT INTO `menus` VALUES (2, NULL, 'Business', '业务管理', '/business', '/index/index', 'mdi:briefcase-account-outline', 1, 2, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-04-09 17:29:22.000', '2026-04-10 14:27:54.000');
INSERT INTO `menus` VALUES (3, NULL, 'Dashboard', '工作台', '/dashboard', '/index/index', 'ri:pie-chart-line', 1, 3, 1, 1, 0, 1, 0, '', 0, '', 0, '', 0, '[]', NULL, '2026-04-09 17:29:22.000', '2026-04-13 06:10:44.364');
INSERT INTO `menus` VALUES (4, NULL, 'Performance', '研发效能', '/performance', '/index/index', 'mdi:chart-line', 1, 4, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-04-09 17:29:22.000', '2026-04-10 14:27:54.000');
INSERT INTO `menus` VALUES (10, 1, 'SystemUser', '用户管理', 'user', 'system/user/Index', 'ri:user-line', 2, 1, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-04-09 17:29:22.000', '2026-04-10 14:27:54.000');
INSERT INTO `menus` VALUES (11, 1, 'SystemRole', '角色管理', 'role', 'system/role/Index', 'ri:user-settings-line', 2, 2, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-04-09 17:29:22.000', '2026-04-10 14:27:54.000');
INSERT INTO `menus` VALUES (12, 1, 'SystemMenu', '菜单管理', 'menu', 'system/menu/Index', 'ri:menu-line', 2, 3, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-04-09 17:29:22.000', '2026-04-10 14:27:54.000');
INSERT INTO `menus` VALUES (13, 1, 'SystemOrg', '部门管理', 'organization', 'system/organization/index', 'mdi:sitemap', 2, 4, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-04-09 17:29:22.000', '2026-04-10 14:27:54.000');
INSERT INTO `menus` VALUES (14, 1, 'SystemUserCenter', '个人中心', 'user-center', 'system/user-center/index', 'ri:user-smile-line', 2, 5, 1, 1, 0, 1, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-04-09 17:29:22.000', '2026-04-10 14:27:54.000');
INSERT INTO `menus` VALUES (15, 1, 'SystemAttachment', '附件管理', 'attachment', 'system/attachment/index', 'mdi:paperclip', 2, 5, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-04-10 15:35:06.000', '2026-04-10 15:35:06.000');
INSERT INTO `menus` VALUES (20, 2, 'BusinessTask', '任务管理', 'task', 'task/manager/index', 'mdi:view-list-outline', 2, 1, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-04-09 17:29:22.000', '2026-04-10 14:27:54.000');
INSERT INTO `menus` VALUES (21, 2, 'BusinessProject', '项目管理', 'project', 'project/index', 'mdi:briefcase-outline', 2, 2, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-04-09 17:29:22.000', '2026-04-10 14:27:54.000');
INSERT INTO `menus` VALUES (30, 3, 'Console', '主控制台', 'console', '/dashboard/console', 'ri:home-smile-2-line', 2, 1, 1, 1, 0, 0, 0, '', 1, '', 0, '', 0, '[]', NULL, '2026-04-09 17:29:22.000', '2026-04-13 06:09:42.481');
INSERT INTO `menus` VALUES (40, 4, 'PerformanceMetric', '效能统计', 'metric', 'performance/index', 'mdi:chart-timeline-variant', 2, 1, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"title\":\"查看统计\",\"authMark\":\"performance:view\"},{\"title\":\"任务对账\",\"authMark\":\"performance:reconcile\"}]', '2026-04-09 17:29:22.000', '2026-05-06 10:14:02.000');
INSERT INTO `menus` VALUES (100, 10, NULL, '新增用户', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:user:add\",\"title\":\"新增\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (101, 10, NULL, '编辑用户', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:user:edit\",\"title\":\"编辑\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (102, 10, NULL, '删除用户', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:user:delete\",\"title\":\"删除\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (103, 10, NULL, '查看用户', NULL, NULL, NULL, 3, 4, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:user:view\",\"title\":\"查看\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (110, 11, NULL, '新增角色', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:role:add\",\"title\":\"新增\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (111, 11, NULL, '编辑角色', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:role:edit\",\"title\":\"编辑\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (112, 11, NULL, '删除角色', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:role:delete\",\"title\":\"删除\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (113, 11, NULL, '查看角色', NULL, NULL, NULL, 3, 4, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:role:view\",\"title\":\"查看\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (120, 12, NULL, '新增菜单', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:menu:add\",\"title\":\"新增\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (121, 12, NULL, '编辑菜单', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:menu:edit\",\"title\":\"编辑\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (122, 12, NULL, '删除菜单', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:menu:delete\",\"title\":\"删除\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (123, 12, NULL, '查看菜单', NULL, NULL, NULL, 3, 4, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:menu:view\",\"title\":\"查看\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (130, 13, NULL, '新增部门', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:dept:add\",\"title\":\"新增\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (131, 13, NULL, '编辑部门', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:dept:edit\",\"title\":\"编辑\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (132, 13, NULL, '删除部门', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:dept:delete\",\"title\":\"删除\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (133, 13, NULL, '查看部门', NULL, NULL, NULL, 3, 4, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:dept:view\",\"title\":\"查看\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (134, 15, NULL, '上传附件', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:attachment:upload\",\"title\":\"上传\"}]', '2026-04-10 15:35:06.000', '2026-04-10 15:35:06.000');
INSERT INTO `menus` VALUES (135, 15, NULL, '删除附件', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:attachment:delete\",\"title\":\"删除\"}]', '2026-04-10 15:35:06.000', '2026-04-10 15:35:06.000');
INSERT INTO `menus` VALUES (136, 15, NULL, '查看附件', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"sys:attachment:view\",\"title\":\"查看\"}]', '2026-04-10 15:35:06.000', '2026-04-10 15:35:06.000');
INSERT INTO `menus` VALUES (140, 2, 'PerformanceRules', '规则管理', 'performance-rules', 'performance/rules/index', 'mdi:calculator-variant-outline', 2, 3, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"title\":\"查看规则\",\"authMark\":\"rule:view\"},{\"title\":\"创建规则\",\"authMark\":\"rule:create\"},{\"title\":\"发布规则\",\"authMark\":\"rule:publish\"},{\"title\":\"模拟运行\",\"authMark\":\"rule:simulate\"},{\"title\":\"触发补差\",\"authMark\":\"rule:adjustment\"}]', '2026-04-30 11:50:09.000', '2026-05-06 10:14:02.000');
INSERT INTO `menus` VALUES (141, 2, 'PointsLedgerLog', '积分记录', 'points-ledger', 'system/points-ledger/index', 'mdi:history', 2, 4, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"title\":\"查看积分流水\",\"authMark\":\"points-ledger:view\"}]', '2026-05-06 10:14:02.000', '2026-05-06 10:14:02.000');
INSERT INTO `menus` VALUES (142, 1, 'HelpCenter', '帮助中心', 'help-center', 'system/help-center/index', 'mdi:book-open-variant', 2, 6, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"title\":\"查看\",\"authMark\":\"help-center:view\"}]', '2026-05-09 12:00:00.000', '2026-05-09 12:00:00.000');
INSERT INTO `menus` VALUES (200, 20, NULL, '新增任务', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"biz:task:add\",\"title\":\"新增\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (201, 20, NULL, '编辑任务', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"biz:task:edit\",\"title\":\"编辑\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (202, 20, NULL, '删除任务', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"biz:task:delete\",\"title\":\"删除\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');
INSERT INTO `menus` VALUES (203, 20, NULL, '查看任务', NULL, NULL, NULL, 3, 4, 1, 1, 0, 0, 0, NULL, 0, NULL, 0, NULL, 0, NULL, '[{\"authMark\":\"biz:task:view\",\"title\":\"查看\"}]', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000');

-- ---------- User ----------
INSERT INTO `users` VALUES (1, 'admin', '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q', '超级管理员', '13800000001', 'admin@company.com', '男', NULL, '1', '系统超级管理员', NULL, NULL, '2026-04-09 17:29:22.000', NULL, '2026-04-10 14:36:23.000', NULL);
INSERT INTO `users` VALUES (2, 'manager', '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q', '普通管理员', '13800000002', 'manager@company.com', '女', NULL, '1', '普通管理员', NULL, NULL, '2026-04-09 17:29:22.000', NULL, '2026-04-14 09:33:12.425', NULL);
INSERT INTO `users` VALUES (3, 'supervisor', '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q', '技术部主管', '13800000003', 'supervisor@company.com', '男', NULL, '1', '技术部主管', NULL, NULL, '2026-04-09 17:29:22.000', NULL, '2026-04-09 17:29:22.000', NULL);
INSERT INTO `users` VALUES (4, 'backend_dev', '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q', '后端开发', '13800000004', 'backend@company.com', '男', NULL, '1', '后端开发工程师', NULL, NULL, '2026-04-09 17:29:22.000', NULL, '2026-04-09 17:29:22.000', NULL);
INSERT INTO `users` VALUES (5, 'frontend_dev', '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q', '前端开发', '13800000005', 'frontend@company.com', '女', NULL, '1', '前端开发工程师', NULL, NULL, '2026-04-09 17:29:22.000', NULL, '2026-04-09 17:29:22.000', NULL);
INSERT INTO `users` VALUES (6, 'product_manager', '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q', '产品经理', '13800000006', 'product@company.com', '女', NULL, '1', '产品经理', NULL, NULL, '2026-04-09 17:29:22.000', NULL, '2026-04-09 17:29:22.000', NULL);
INSERT INTO `users` VALUES (7, 'operation_staff', '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q', '运营专员', '13800000007', 'operation@company.com', '男', NULL, '1', '运营专员', NULL, NULL, '2026-04-09 17:29:22.000', NULL, '2026-04-09 17:29:22.000', NULL);
INSERT INTO `users` VALUES (8, 'guest', '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q', '访客用户', '13800000008', 'guest@company.com', '男', NULL, '1', '访客用户', NULL, NULL, '2026-04-09 17:29:22.000', NULL, '2026-04-09 17:29:22.000', NULL);
INSERT INTO `users` VALUES (9, 'perfadmin01', '$2b$10$sqkoK8QyCuhLIOnejsNPwefDONi/G4tRgoVgna3uonO8nGsWux83y', 'Perf Admin', NULL, NULL, NULL, NULL, '1', NULL, NULL, NULL, '2026-04-30 03:18:44.819', NULL, '2026-04-30 03:18:44.819', NULL);
INSERT INTO `users` VALUES (10, 'rulesadmin01', '$2b$10$.1QKoEAbTurs7fJGABh7pO1bQF7izSWEOxA0LzivAyM2fopdEBs/y', 'Rules Admin', NULL, NULL, NULL, NULL, '1', NULL, NULL, NULL, '2026-04-30 03:26:22.263', NULL, '2026-04-30 03:26:22.263', NULL);
INSERT INTO `users` VALUES (11, 'lenglin', '$2b$10$rX3rmWLDEkuWzRsBs68T9.Iv91rcx1ZwJgxo.OPtmmOIbU8Y8E06O', '冷林', '19180527936', '614322108@qq.com', '男', NULL, '1', NULL, NULL, NULL, '2026-04-30 08:39:16.423', NULL, '2026-04-30 08:39:16.423', NULL);

-- ---------- DeptManager ----------
INSERT INTO `dept_managers` VALUES (1, 1, '2026-04-10 06:36:43.986');

-- ---------- DeptMember ----------
INSERT INTO `dept_members` VALUES (1, 1, '2026-04-09 17:29:22.000');
INSERT INTO `dept_members` VALUES (1, 2, '2026-04-09 17:29:22.000');
INSERT INTO `dept_members` VALUES (1, 8, '2026-04-09 17:29:22.000');
INSERT INTO `dept_members` VALUES (1, 11, '2026-04-30 08:41:40.644');
INSERT INTO `dept_members` VALUES (2, 3, '2026-04-09 17:29:22.000');
INSERT INTO `dept_members` VALUES (5, 4, '2026-04-09 17:29:22.000');
INSERT INTO `dept_members` VALUES (6, 5, '2026-04-09 17:29:22.000');
INSERT INTO `dept_members` VALUES (7, 6, '2026-04-09 17:29:22.000');
INSERT INTO `dept_members` VALUES (8, 7, '2026-04-09 17:29:22.000');

-- ---------- _MenuToRole ----------
INSERT INTO `_MenuToRole` VALUES (1, 1);
INSERT INTO `_MenuToRole` VALUES (2, 1);
INSERT INTO `_MenuToRole` VALUES (3, 1);
INSERT INTO `_MenuToRole` VALUES (4, 1);
INSERT INTO `_MenuToRole` VALUES (10, 1);
INSERT INTO `_MenuToRole` VALUES (11, 1);
INSERT INTO `_MenuToRole` VALUES (12, 1);
INSERT INTO `_MenuToRole` VALUES (13, 1);
INSERT INTO `_MenuToRole` VALUES (14, 1);
INSERT INTO `_MenuToRole` VALUES (15, 1);
INSERT INTO `_MenuToRole` VALUES (20, 1);
INSERT INTO `_MenuToRole` VALUES (21, 1);
INSERT INTO `_MenuToRole` VALUES (30, 1);
INSERT INTO `_MenuToRole` VALUES (40, 1);
INSERT INTO `_MenuToRole` VALUES (100, 1);
INSERT INTO `_MenuToRole` VALUES (101, 1);
INSERT INTO `_MenuToRole` VALUES (102, 1);
INSERT INTO `_MenuToRole` VALUES (103, 1);
INSERT INTO `_MenuToRole` VALUES (110, 1);
INSERT INTO `_MenuToRole` VALUES (111, 1);
INSERT INTO `_MenuToRole` VALUES (112, 1);
INSERT INTO `_MenuToRole` VALUES (113, 1);
INSERT INTO `_MenuToRole` VALUES (120, 1);
INSERT INTO `_MenuToRole` VALUES (121, 1);
INSERT INTO `_MenuToRole` VALUES (122, 1);
INSERT INTO `_MenuToRole` VALUES (123, 1);
INSERT INTO `_MenuToRole` VALUES (130, 1);
INSERT INTO `_MenuToRole` VALUES (131, 1);
INSERT INTO `_MenuToRole` VALUES (132, 1);
INSERT INTO `_MenuToRole` VALUES (133, 1);
INSERT INTO `_MenuToRole` VALUES (134, 1);
INSERT INTO `_MenuToRole` VALUES (135, 1);
INSERT INTO `_MenuToRole` VALUES (136, 1);
INSERT INTO `_MenuToRole` VALUES (140, 1);
INSERT INTO `_MenuToRole` VALUES (141, 1);
INSERT INTO `_MenuToRole` VALUES (142, 1);
INSERT INTO `_MenuToRole` VALUES (200, 1);
INSERT INTO `_MenuToRole` VALUES (201, 1);
INSERT INTO `_MenuToRole` VALUES (202, 1);
INSERT INTO `_MenuToRole` VALUES (203, 1);
INSERT INTO `_MenuToRole` VALUES (1, 2);
INSERT INTO `_MenuToRole` VALUES (2, 2);
INSERT INTO `_MenuToRole` VALUES (3, 2);
INSERT INTO `_MenuToRole` VALUES (4, 2);
INSERT INTO `_MenuToRole` VALUES (10, 2);
INSERT INTO `_MenuToRole` VALUES (11, 2);
INSERT INTO `_MenuToRole` VALUES (12, 2);
INSERT INTO `_MenuToRole` VALUES (13, 2);
INSERT INTO `_MenuToRole` VALUES (14, 2);
INSERT INTO `_MenuToRole` VALUES (15, 2);
INSERT INTO `_MenuToRole` VALUES (20, 2);
INSERT INTO `_MenuToRole` VALUES (21, 2);
INSERT INTO `_MenuToRole` VALUES (30, 2);
INSERT INTO `_MenuToRole` VALUES (40, 2);
INSERT INTO `_MenuToRole` VALUES (100, 2);
INSERT INTO `_MenuToRole` VALUES (101, 2);
INSERT INTO `_MenuToRole` VALUES (102, 2);
INSERT INTO `_MenuToRole` VALUES (103, 2);
INSERT INTO `_MenuToRole` VALUES (110, 2);
INSERT INTO `_MenuToRole` VALUES (111, 2);
INSERT INTO `_MenuToRole` VALUES (112, 2);
INSERT INTO `_MenuToRole` VALUES (113, 2);
INSERT INTO `_MenuToRole` VALUES (120, 2);
INSERT INTO `_MenuToRole` VALUES (121, 2);
INSERT INTO `_MenuToRole` VALUES (122, 2);
INSERT INTO `_MenuToRole` VALUES (123, 2);
INSERT INTO `_MenuToRole` VALUES (130, 2);
INSERT INTO `_MenuToRole` VALUES (131, 2);
INSERT INTO `_MenuToRole` VALUES (132, 2);
INSERT INTO `_MenuToRole` VALUES (133, 2);
INSERT INTO `_MenuToRole` VALUES (134, 2);
INSERT INTO `_MenuToRole` VALUES (135, 2);
INSERT INTO `_MenuToRole` VALUES (136, 2);
INSERT INTO `_MenuToRole` VALUES (200, 2);
INSERT INTO `_MenuToRole` VALUES (201, 2);
INSERT INTO `_MenuToRole` VALUES (202, 2);
INSERT INTO `_MenuToRole` VALUES (203, 2);
INSERT INTO `_MenuToRole` VALUES (142, 2);
INSERT INTO `_MenuToRole` VALUES (1, 4);
INSERT INTO `_MenuToRole` VALUES (2, 4);
INSERT INTO `_MenuToRole` VALUES (14, 4);
INSERT INTO `_MenuToRole` VALUES (20, 4);
INSERT INTO `_MenuToRole` VALUES (21, 4);
INSERT INTO `_MenuToRole` VALUES (203, 4);
INSERT INTO `_MenuToRole` VALUES (142, 4);
INSERT INTO `_MenuToRole` VALUES (1, 6);
INSERT INTO `_MenuToRole` VALUES (3, 6);
INSERT INTO `_MenuToRole` VALUES (14, 6);
INSERT INTO `_MenuToRole` VALUES (30, 6);
INSERT INTO `_MenuToRole` VALUES (142, 6);
INSERT INTO `_MenuToRole` VALUES (142, 3);
INSERT INTO `_MenuToRole` VALUES (142, 5);

-- ---------- _RoleToUser ----------
INSERT INTO `_RoleToUser` VALUES (1, 1);
INSERT INTO `_RoleToUser` VALUES (2, 2);
INSERT INTO `_RoleToUser` VALUES (3, 3);
INSERT INTO `_RoleToUser` VALUES (4, 4);
INSERT INTO `_RoleToUser` VALUES (4, 5);
INSERT INTO `_RoleToUser` VALUES (4, 6);
INSERT INTO `_RoleToUser` VALUES (4, 7);
INSERT INTO `_RoleToUser` VALUES (5, 8);
INSERT INTO `_RoleToUser` VALUES (1, 11);

-- ---------- attachment ----------
INSERT INTO `attachment` VALUES (1, '20251117农电管理数据.xlsx', 'attachments/2026/04/cbbd71e2-5578-43fd-a78d-108bbbaab18b_20251117农电管理数据.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 3986, 1, '2026-04-10 07:39:04.106', '2026-04-10 07:39:34.934');
INSERT INTO `attachment` VALUES (2, '导入班级及学生模板_(1).xlsx', 'attachments/2026/04/09dd7c0d-d224-49d2-aa9d-8daf913d8f34_导入班级及学生模板_(1).xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 12829, 1, '2026-04-10 07:43:55.217', NULL);
INSERT INTO `attachment` VALUES (3, '2022年春季学期_模拟课程MNKC_我教的课学生列表20220915085824.xlsx', 'attachments/2026/04/92b01428-505f-4522-9606-87673287b9df_2022年春季学期_模拟课程MNKC_我教的课学生列表20220915085824.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 5572, 1, '2026-04-10 08:19:46.912', NULL);
INSERT INTO `attachment` VALUES (4, '2022年春季学期班级2020级本科金融学03班2020级本科金融学04班-2学生列表20220914165846.xlsx', 'attachments/2026/04/18bd4e8f-ca6c-450c-b931-3acb86cf1e86_2022年春季学期班级2020级本科金融学03班2020级本科金融学04班-2学生列表20220914165846.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 8144, 1, '2026-04-10 08:19:47.164', NULL);
INSERT INTO `attachment` VALUES (5, '2022年春季学期班级2020级本科金融学03班2020级本科金融学04班-2学生列表20220914171328.xlsx', 'attachments/2026/04/7231a496-ea86-4154-afe7-65e6fb0cdd56_2022年春季学期班级2020级本科金融学03班2020级本科金融学04班-2学生列表20220914171328.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 8151, 1, '2026-04-10 08:19:47.313', '2026-04-10 08:30:37.352');
INSERT INTO `attachment` VALUES (6, '数字绩效需求变更20260319.txt', 'attachments/2026/04/56f8df77-a53f-45ff-914a-1e617bd5107c_数字绩效需求变更20260319.txt', 'text/plain', 755, 1, '2026-04-10 08:47:33.340', NULL);
INSERT INTO `attachment` VALUES (7, '证书类型码表.xlsx', 'attachments/2026/04/0b791edb-4e54-445e-88c6-f702bfc9edf9_证书类型码表.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 9109, 1, '2026-04-10 08:47:33.430', NULL);
INSERT INTO `attachment` VALUES (8, '个性化项目前端开发总结-童付港.docx', 'attachments/2026/04/47a40e04-5f05-48fe-8c75-2e007f3a8903_个性化项目前端开发总结-童付港.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1130097, 1, '2026-04-10 09:31:03.444', '2026-04-28 08:56:41.980');
INSERT INTO `attachment` VALUES (9, 'tqes_db.sql', 'attachments/2026/04/431c5521-c140-48a4-9bf0-a3e71f1b5726_tqes_db.sql', NULL, 139728, 1, '2026-04-29 06:10:24.756', NULL);
INSERT INTO `attachment` VALUES (10, '保障性小水电类型模板_(11).xlsx', 'attachments/2026/04/1fea64db-6154-4b8c-b05e-4a9d7ff11f72_保障性小水电类型模板_(11).xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 11151, 1, '2026-04-30 08:36:40.350', NULL);
INSERT INTO `attachment` VALUES (11, '保障性小水电主体模板.xlsx', 'attachments/2026/04/87425e7b-fd56-40ae-897c-fc088ca4b981_保障性小水电主体模板.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 11125, 1, '2026-04-30 08:36:40.530', NULL);
INSERT INTO `attachment` VALUES (12, '留存用户类型模板_(6).xlsx', 'attachments/2026/04/c6c25465-1e2c-4029-aae2-21e5e6a22a18_留存用户类型模板_(6).xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 11494, 1, '2026-04-30 08:36:40.690', NULL);
INSERT INTO `attachment` VALUES (13, '留存用户主体模板.xlsx', 'attachments/2026/04/c187edeb-622e-4ec2-92e9-34aa19ad28e5_留存用户主体模板.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 11181, 1, '2026-04-30 08:36:40.851', NULL);
INSERT INTO `attachment` VALUES (14, '特殊用户主体明细整点电量模板.xlsx', 'attachments/2026/04/8e84a2d1-0149-4b15-901b-ffac40c15214_特殊用户主体明细整点电量模板.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 14817, 1, '2026-04-30 08:36:41.013', NULL);
INSERT INTO `attachment` VALUES (15, '负荷管理措施执行情况.xlsx', 'attachments/2026/04/1c4e0353-590d-4bf9-a19e-c5b70038f48f_负荷管理措施执行情况.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 4056, 1, '2026-04-30 08:42:33.305', NULL);
INSERT INTO `attachment` VALUES (16, '资质信息导入模板.xls', 'attachments/2026/04/3ea5acc2-de2c-4f39-8cb2-1f72ab6bc51d_资质信息导入模板.xls', 'application/vnd.ms-excel', 1605, 1, '2026-04-30 09:00:40.572', NULL);
INSERT INTO `attachment` VALUES (17, '资质信息管理批量导入.xlsx', 'attachments/2026/04/d5bd2d54-24e3-454e-9ba5-5e3511b8d01c_资质信息管理批量导入.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 9305, 1, '2026-04-30 09:00:40.749', NULL);

-- ---------- project ----------
INSERT INTO `project` VALUES (1, '工单中心', NULL, 0, 0, 1, 'ACTIVE', '2026-04-05 16:00:00.000', '2026-05-05 16:00:00.000', '2026-04-10 03:05:38.888', '2026-04-10 03:05:38.888', NULL);
INSERT INTO `project` VALUES (2, '工单中心2', NULL, 1, 0, 1, 'ACTIVE', '2026-04-06 16:00:00.000', '2026-05-20 16:00:00.000', '2026-04-10 06:38:17.566', '2026-04-10 06:38:17.566', NULL);
INSERT INTO `project` VALUES (3, 'PerfTestProj', '', NULL, 0, 9, 'ACTIVE', NULL, NULL, '2026-04-30 03:18:45.078', '2026-04-30 03:18:45.078', NULL);

-- ---------- rule_set ----------
INSERT INTO `rule_set` VALUES (1, 'global-default', '全局默认规则', 'GLOBAL', NULL, 'ACTIVE', '2026-04-30 03:19:52.801', '2026-04-30 03:19:52.801');
INSERT INTO `rule_set` VALUES (2, 'p1-default', '工单中心规则集', 'PROJECT', 2, 'DISABLED', '2026-04-30 03:26:22.536', '2026-05-06 03:10:22.051');

-- ---------- rule_set_version ----------
INSERT INTO `rule_set_version` VALUES (1, 1, 1, NULL, '2026-04-30 03:19:52.812', NULL, NULL, '2d9a200fbc1af4e6289e8eddb586aafd0be015c6448844d80950ba525aa7cd1e', '{\"rules\": [{\"id\": \"base_points\", \"name\": \"验收通过基础积分\", \"then\": [{\"type\": \"emitPosting\", \"amount\": 10, \"subject\": {\"ref\": \"task.mainAssigneeId\"}, \"pointsType\": \"base\", \"reasonCode\": \"TASK_ACCEPTED_BASE\"}], \"when\": {\"op\": \"gt\", \"left\": {\"path\": \"task.actualHours\"}, \"right\": 0}, \"priority\": 100}], \"params\": {}, \"variables\": [{\"code\": \"delayHours\", \"expr\": {\"path\": \"task.delayHours\"}}]}');
INSERT INTO `rule_set_version` VALUES (2, 2, 1, 10, '2026-04-30 03:26:22.556', NULL, NULL, '9fbf9ad19bcae4cbbb2c9f0f29fdf9de8af256f81aef50a343d58d37e11587f5', '{\"rules\": [{\"id\": \"base_points\", \"then\": [{\"type\": \"emitPosting\", \"amount\": 10, \"subject\": {\"ref\": \"task.mainAssigneeId\"}, \"pointsType\": \"base\"}], \"priority\": 100}], \"params\": {}, \"variables\": [{\"code\": \"delayHours\", \"expr\": {\"path\": \"task.delayHours\"}}]}');
INSERT INTO `rule_set_version` VALUES (3, 1, 2, 1, '2026-04-30 05:08:48.751', NULL, NULL, '34ea1c263efc188e280d2c19849aa879b6968f767abcd31717e40cd93bd9546f', '{\"rules\": [{\"id\": \"formula_score_rule\", \"name\": \"公式计算积分\", \"then\": [{\"type\": \"emitPosting\", \"amount\": {\"fn\": \"formula\", \"args\": [\"baseScore * complexity - (rejectCount * 5) + (aheadDays > 0 ? aheadDays * 2 : aheadDays * 5)\"]}, \"subject\": {\"ref\": \"task.mainAssigneeId\"}, \"pointsType\": \"base\", \"reasonCode\": \"FORMULA_SCORE\"}], \"when\": {\"op\": \"gt\", \"left\": {\"path\": \"task.mainAssigneeId\"}, \"right\": 0}, \"priority\": 100}], \"params\": {}, \"variables\": []}');
INSERT INTO `rule_set_version` VALUES (4, 1, 3, 1, '2026-05-06 03:10:25.728', NULL, NULL, '04ae4aac217924a53b122082671cd185bb5e92733d90cb347d2d2d460663eaa2', '{\"rules\": [{\"id\": \"formula_score_rule\", \"name\": \"公式计算积分\", \"then\": [{\"type\": \"emitPosting\", \"amount\": {\"fn\": \"formula\", \"args\": [\"baseScore * complexity - (rejectCount * 5) + (aheadDays > 0 ? aheadDays * 2 : aheadDays * 5)\"]}, \"subject\": {\"ref\": \"task.mainAssigneeId\"}, \"pointsType\": \"base\", \"reasonCode\": \"FORMULA_SCORE\"}], \"when\": {\"op\": \"gt\", \"left\": {\"path\": \"task.mainAssigneeId\"}, \"right\": 0}, \"priority\": 100}], \"params\": {}, \"variables\": [{\"code\": \"baseScore\", \"expr\": {\"path\": \"task.baseScore\"}}, {\"code\": \"complexity\", \"expr\": {\"path\": \"task.complexity\"}}, {\"code\": \"rejectCount\", \"expr\": {\"path\": \"task.testCaseBugCount\"}}, {\"code\": \"aheadDays\", \"expr\": {\"path\": \"task.aheadDays\"}}]}');

-- ---------- rule_variable ----------
INSERT INTO `rule_variable` VALUES (1, 'baseScore', '基础积分', 'Number', NULL, 'task.baseScore', 10.000000, 'GLOBAL', NULL, 1, 1, '2026-04-30 05:17:13.215', '2026-04-30 08:36:28.871');
INSERT INTO `rule_variable` VALUES (2, 'complexity', '难度系数', 'Float', NULL, 'task.complexity', 1.500000, 'GLOBAL', NULL, 1, 2, '2026-04-30 05:17:13.215', '2026-04-30 08:36:28.871');
INSERT INTO `rule_variable` VALUES (3, 'rejectCount', '验收驳回次数', 'Integer', NULL, 'task.testCaseBugCount', 2.000000, 'GLOBAL', NULL, 1, 3, '2026-04-30 05:17:13.215', '2026-04-30 08:36:28.871');
INSERT INTO `rule_variable` VALUES (4, 'aheadDays', '提前完成天数', 'Integer', NULL, 'task.aheadDays', 1.000000, 'GLOBAL', NULL, 1, 4, '2026-04-30 05:17:13.215', '2026-04-30 08:36:28.871');

-- ---------- rule_execution ----------
INSERT INTO `rule_execution` VALUES (1, 1, 'TaskAccepted', '1', 'SUCCEEDED', NULL, '{\"task\": {\"id\": 1, \"dueDate\": null, \"priority\": \"P2\", \"testerId\": 1, \"projectId\": 1, \"acceptedAt\": \"2026-04-30T03:19:52.815Z\", \"delayHours\": 0, \"workDomain\": \"GENERAL\", \"actualHours\": 1, \"coAssigneeIds\": [], \"estimatedHours\": null, \"mainAssigneeId\": 1, \"testCaseBugCount\": 0}}', '{\"metrics\": [], \"explains\": [{\"ok\": true, \"ruleId\": \"base_points\"}], \"postings\": [{\"amount\": 10, \"ruleId\": \"base_points\", \"subjectId\": 1, \"pointsType\": \"base\", \"reasonCode\": \"TASK_ACCEPTED_BASE\", \"subjectType\": \"USER\"}]}', '2026-04-30 03:19:53.760', '2026-04-30 03:19:53.758');
INSERT INTO `rule_execution` VALUES (2, 2, 'TaskAccepted', '2', 'SUCCEEDED', NULL, '{\"task\": {\"id\": 3, \"dueDate\": null, \"priority\": \"P2\", \"testerId\": 1, \"aheadDays\": 0, \"baseScore\": 16.6, \"projectId\": 2, \"acceptedAt\": \"2026-04-30T09:45:54.891Z\", \"complexity\": 1, \"delayHours\": 0, \"workDomain\": \"PRODUCT_DESIGN\", \"actualHours\": 2, \"coAssigneeIds\": [], \"estimatedHours\": 8, \"mainAssigneeId\": 1, \"testCaseBugCount\": 0}}', '{\"metrics\": [], \"explains\": [{\"ok\": true, \"ruleId\": \"base_points\"}], \"postings\": [{\"amount\": 10, \"ruleId\": \"base_points\", \"subjectId\": 1, \"pointsType\": \"base\", \"reasonCode\": \"base_points\", \"subjectType\": \"USER\"}]}', '2026-04-30 09:45:56.394', '2026-04-30 09:45:56.392');
INSERT INTO `rule_execution` VALUES (3, 4, 'TaskAccepted', '3', 'SUCCEEDED', NULL, '{\"task\": {\"id\": 5, \"dueDate\": \"2026-05-06T00:00:00.000Z\", \"priority\": \"P0\", \"testerId\": 1, \"aheadDays\": -1, \"baseScore\": 16.1, \"projectId\": 2, \"acceptedAt\": \"2026-05-06T03:10:58.726Z\", \"complexity\": 1, \"delayHours\": 3.182979444444444, \"workDomain\": \"PRODUCT_DESIGN\", \"actualHours\": 3, \"coAssigneeIds\": [2, 3, 6, 8], \"estimatedHours\": 4, \"mainAssigneeId\": 1, \"testCaseBugCount\": 0}}', '{\"metrics\": [], \"explains\": [{\"ok\": true, \"ruleId\": \"formula_score_rule\"}], \"postings\": [{\"amount\": 11, \"ruleId\": \"formula_score_rule\", \"subjectId\": 1, \"pointsType\": \"base\", \"reasonCode\": \"FORMULA_SCORE\", \"subjectType\": \"USER\"}]}', '2026-05-06 03:11:00.453', '2026-05-06 03:11:00.452');

-- ---------- task ----------
INSERT INTO `task` VALUES (2, 2, 1, 11, NULL, 'FEATURE', 'P0', '2026-04-29 00:00:00.000', '任务因子绑定', '关于任务因子绑定的功能审计开发', 'PAUSED', 1, 1, 1, 8, NULL, '2026-04-10 06:38:56.825', '2026-04-14 09:49:18.376', 'SOFTWARE_DEVELOPMENT', NULL, NULL, NULL, 'AUTO', NULL);
INSERT INTO `task` VALUES (3, 2, 1, 6, NULL, 'FEATURE', 'P2', NULL, '修改记录', NULL, 'COMPLETED', NULL, 1, 1, 8, 2, '2026-04-14 05:08:22.712', '2026-04-30 09:56:43.511', 'PRODUCT_DESIGN', NULL, '2026-04-30 09:45:54.891', 16.6, 'MANUAL', 16.6);
INSERT INTO `task` VALUES (4, 2, 1, 3, NULL, 'FEATURE', 'P2', '2026-04-30 00:00:00.000', '测试消息推送', NULL, 'QA_REVIEW', NULL, 1, 3, 8, NULL, '2026-04-14 08:32:38.908', '2026-04-28 09:09:36.406', 'GENERAL', NULL, NULL, NULL, 'AUTO', NULL);
INSERT INTO `task` VALUES (5, 2, 1, 2, NULL, 'ENHANCEMENT', 'P0', '2026-05-06 00:00:00.000', '超期因子增加工作日、自然日单选', '如标题', 'COMPLETED', NULL, 1, 1, 4, 3, '2026-04-30 08:36:41.063', '2026-05-06 03:10:58.728', 'PRODUCT_DESIGN', NULL, '2026-05-06 03:10:58.726', 16.1, 'MANUAL', 16.1);

-- ---------- task_attachment ----------
INSERT INTO `task_attachment` VALUES (13, 2, 6, 0, '2026-04-14 08:31:57.540');
INSERT INTO `task_attachment` VALUES (14, 2, 7, 1, '2026-04-14 08:31:57.540');
INSERT INTO `task_attachment` VALUES (25, 5, 10, 0, '2026-04-30 08:41:32.443');
INSERT INTO `task_attachment` VALUES (26, 5, 11, 1, '2026-04-30 08:41:32.443');
INSERT INTO `task_attachment` VALUES (27, 5, 12, 2, '2026-04-30 08:41:32.443');
INSERT INTO `task_attachment` VALUES (28, 5, 13, 3, '2026-04-30 08:41:32.443');
INSERT INTO `task_attachment` VALUES (29, 5, 14, 4, '2026-04-30 08:41:32.443');

-- ---------- task_co_assignee ----------
INSERT INTO `task_co_assignee` VALUES (9, 2, 2, '2026-04-14 08:31:57.520');
INSERT INTO `task_co_assignee` VALUES (11, 4, 2, '2026-04-28 09:03:06.841');
INSERT INTO `task_co_assignee` VALUES (19, 5, 2, '2026-04-30 08:41:32.429');
INSERT INTO `task_co_assignee` VALUES (20, 5, 3, '2026-04-30 08:41:32.429');
INSERT INTO `task_co_assignee` VALUES (21, 5, 6, '2026-04-30 08:41:32.429');
INSERT INTO `task_co_assignee` VALUES (22, 5, 8, '2026-04-30 08:41:32.429');

-- ---------- task_comment ----------
INSERT INTO `task_comment` VALUES (1, 3, 1, '123', '2026-04-28 09:59:34.754', '2026-04-28 09:59:34.754');
INSERT INTO `task_comment` VALUES (2, 3, 1, 'IYO', '2026-04-29 06:10:24.793', '2026-04-29 06:10:24.793');
INSERT INTO `task_comment` VALUES (3, 5, 1, '我来评论一下这个任务', '2026-04-30 08:42:33.390', '2026-04-30 08:42:33.390');

-- ---------- task_comment_attachment ----------
INSERT INTO `task_comment_attachment` VALUES (1, 2, 9, 0, '2026-04-29 06:10:24.795');
INSERT INTO `task_comment_attachment` VALUES (2, 3, 15, 0, '2026-04-30 08:42:33.397');

-- ---------- task_timeline ----------
INSERT INTO `task_timeline` VALUES (1, 3, 'COMMENT_ADDED', '发表评论', '123', NULL, NULL, 1, NULL, '2026-04-28 09:59:34.760');
INSERT INTO `task_timeline` VALUES (2, 3, 'WORKLOG_ADDED', '登记工时', '1h · 123123', NULL, NULL, 1, NULL, '2026-04-28 09:59:43.125');
INSERT INTO `task_timeline` VALUES (3, 3, 'STATUS_CHANGED', '提交验收', NULL, 'IN_PROGRESS', 'QA_REVIEW', 1, NULL, '2026-04-28 09:59:45.312');
INSERT INTO `task_timeline` VALUES (4, 3, 'QA_REJECTED', '验收打回', '123123', 'QA_REVIEW', 'IN_PROGRESS', 1, NULL, '2026-04-28 09:59:55.268');
INSERT INTO `task_timeline` VALUES (5, 3, 'COMMENT_ADDED', '发表评论', 'IYO', NULL, NULL, 1, NULL, '2026-04-29 06:10:24.799');
INSERT INTO `task_timeline` VALUES (6, 2, 'OVERDUE_REMINDER', '任务已逾期', '截止时间：2026/4/29 08:00:00（项目：工单中心2）', NULL, NULL, NULL, '{\"dueDate\": \"2026-04-29T00:00:00.000Z\"}', '2026-04-30 01:03:45.542');
INSERT INTO `task_timeline` VALUES (7, 4, 'OVERDUE_REMINDER', '任务已逾期', '截止时间：2026/4/30 08:00:00（项目：工单中心2）', NULL, NULL, NULL, '{\"dueDate\": \"2026-04-30T00:00:00.000Z\"}', '2026-04-30 01:03:45.565');
INSERT INTO `task_timeline` VALUES (8, 5, 'TASK_CREATED', '创建任务', '任务已创建并指定负责人', NULL, 'PENDING', 1, NULL, '2026-04-30 08:36:41.072');
INSERT INTO `task_timeline` VALUES (9, 5, 'COMMENT_ADDED', '发表评论', '我来评论一下这个任务', NULL, NULL, 1, NULL, '2026-04-30 08:42:33.400');
INSERT INTO `task_timeline` VALUES (10, 5, 'WORKLOG_ADDED', '登记工时', '2h · 前端编码', NULL, NULL, 1, NULL, '2026-04-30 08:42:46.262');
INSERT INTO `task_timeline` VALUES (11, 5, 'WORKLOG_ADDED', '登记工时', '1h · 123', NULL, NULL, 1, NULL, '2026-04-30 09:00:40.856');
INSERT INTO `task_timeline` VALUES (12, 3, 'STATUS_CHANGED', '提交验收', NULL, 'IN_PROGRESS', 'QA_REVIEW', 1, NULL, '2026-04-30 09:45:49.886');
INSERT INTO `task_timeline` VALUES (13, 3, 'QA_PASSED', '验收通过', '确认实际工时 2h', 'QA_REVIEW', 'COMPLETED', 1, NULL, '2026-04-30 09:45:54.901');
INSERT INTO `task_timeline` VALUES (14, 2, 'OVERDUE_REMINDER', '任务已逾期', '截止时间：2026/4/29 08:00:00（项目：工单中心2）', NULL, NULL, NULL, '{\"dueDate\": \"2026-04-29T00:00:00.000Z\"}', '2026-05-06 01:30:53.624');
INSERT INTO `task_timeline` VALUES (15, 4, 'OVERDUE_REMINDER', '任务已逾期', '截止时间：2026/4/30 08:00:00（项目：工单中心2）', NULL, NULL, NULL, '{\"dueDate\": \"2026-04-30T00:00:00.000Z\"}', '2026-05-06 01:30:53.659');
INSERT INTO `task_timeline` VALUES (16, 5, 'OVERDUE_REMINDER', '任务已逾期', '截止时间：2026/5/6 08:00:00（项目：工单中心2）', NULL, NULL, NULL, '{\"dueDate\": \"2026-05-06T00:00:00.000Z\"}', '2026-05-06 01:30:53.670');
INSERT INTO `task_timeline` VALUES (17, 5, 'STATUS_CHANGED', '提交验收', NULL, 'IN_PROGRESS', 'QA_REVIEW', 1, NULL, '2026-05-06 03:10:53.627');
INSERT INTO `task_timeline` VALUES (18, 5, 'QA_PASSED', '验收通过', '确认实际工时 3h', 'QA_REVIEW', 'COMPLETED', 1, NULL, '2026-05-06 03:10:58.738');

-- ---------- test_case ----------
INSERT INTO `test_case` VALUES (1, 2, '打开因子管理弹窗', '显示列表中选择行的数据', 'UNTESTED', '通过', 'UNTESTED', '', 2, '2026-04-13 05:23:16.639', '2026-04-14 08:31:57.552');

-- ---------- points_account ----------
INSERT INTO `points_account` VALUES (1, 'USER', 1, 'ACTIVE', '2026-04-30 03:19:53.769', '2026-04-30 03:19:53.769');

-- ---------- points_ledger_entry ----------
INSERT INTO `points_ledger_entry` VALUES (1, 1, 'task_settlement', '1', 1, 1, 1, 'base', 10, '2026-04-30 03:19:52.815', '2026-04-30 03:19:53.772', '1:base_points:1:base:10', '{\"ruleId\": \"base_points\", \"reasonCode\": \"TASK_ACCEPTED_BASE\"}');
INSERT INTO `points_ledger_entry` VALUES (2, 1, 'task_settlement', '2', 2, 3, 2, 'base', 10, '2026-04-30 09:45:54.891', '2026-04-30 09:45:56.408', '2:base_points:1:base:10', '{\"ruleId\": \"base_points\", \"reasonCode\": \"base_points\"}');
INSERT INTO `points_ledger_entry` VALUES (3, 1, 'task_settlement', '3', 2, 5, 4, 'base', 11, '2026-05-06 03:10:58.726', '2026-05-06 03:11:00.467', '3:formula_score_rule:1:base:11', '{\"ruleId\": \"formula_score_rule\", \"reasonCode\": \"FORMULA_SCORE\"}');

-- ---------- perf_settlement ----------
INSERT INTO `perf_settlement` VALUES (1, 'smoke:2026-04-30T03:19:52.815Z', 'first', 1, 1, '2026-04-30 03:19:52.815', 'SUCCEEDED', NULL, 1, NULL, '{\"task\": {\"id\": 1, \"dueDate\": null, \"priority\": \"P2\", \"testerId\": 1, \"projectId\": 1, \"acceptedAt\": \"2026-04-30T03:19:52.815Z\", \"delayHours\": 0, \"workDomain\": \"GENERAL\", \"actualHours\": 1, \"coAssigneeIds\": [], \"estimatedHours\": null, \"mainAssigneeId\": 1, \"testCaseBugCount\": 0}}', '{\"metrics\": [], \"explains\": [{\"ok\": true, \"ruleId\": \"base_points\"}], \"postings\": [{\"amount\": 10, \"ruleId\": \"base_points\", \"subjectId\": 1, \"pointsType\": \"base\", \"reasonCode\": \"TASK_ACCEPTED_BASE\", \"subjectType\": \"USER\"}]}', '2026-04-30 03:19:52.820', '2026-04-30 03:19:53.781', '2026-04-30 03:19:53.781');
INSERT INTO `perf_settlement` VALUES (2, 'task:3:first:2026-04-30T09:45:54.891Z', 'first', 2, 3, '2026-04-30 09:45:54.891', 'SUCCEEDED', NULL, 2, NULL, '{\"task\": {\"id\": 3, \"dueDate\": null, \"priority\": \"P2\", \"testerId\": 1, \"aheadDays\": 0, \"baseScore\": 16.6, \"projectId\": 2, \"acceptedAt\": \"2026-04-30T09:45:54.891Z\", \"complexity\": 1, \"delayHours\": 0, \"workDomain\": \"PRODUCT_DESIGN\", \"actualHours\": 2, \"coAssigneeIds\": [], \"estimatedHours\": 8, \"mainAssigneeId\": 1, \"testCaseBugCount\": 0}}', '{\"metrics\": [], \"explains\": [{\"ok\": true, \"ruleId\": \"base_points\"}], \"postings\": [{\"amount\": 10, \"ruleId\": \"base_points\", \"subjectId\": 1, \"pointsType\": \"base\", \"reasonCode\": \"base_points\", \"subjectType\": \"USER\"}]}', '2026-04-30 09:45:54.919', '2026-04-30 09:45:56.431', '2026-04-30 09:45:56.429');
INSERT INTO `perf_settlement` VALUES (3, 'task:5:first:2026-05-06T03:10:58.726Z', 'first', 2, 5, '2026-05-06 03:10:58.726', 'SUCCEEDED', NULL, 4, NULL, '{\"task\": {\"id\": 5, \"dueDate\": \"2026-05-06T00:00:00.000Z\", \"priority\": \"P0\", \"testerId\": 1, \"aheadDays\": -1, \"baseScore\": 16.1, \"projectId\": 2, \"acceptedAt\": \"2026-05-06T03:10:58.726Z\", \"complexity\": 1, \"delayHours\": 3.182979444444444, \"workDomain\": \"PRODUCT_DESIGN\", \"actualHours\": 3, \"coAssigneeIds\": [2, 3, 6, 8], \"estimatedHours\": 4, \"mainAssigneeId\": 1, \"testCaseBugCount\": 0}}', '{\"metrics\": [], \"explains\": [{\"ok\": true, \"ruleId\": \"formula_score_rule\"}], \"postings\": [{\"amount\": 11, \"ruleId\": \"formula_score_rule\", \"subjectId\": 1, \"pointsType\": \"base\", \"reasonCode\": \"FORMULA_SCORE\", \"subjectType\": \"USER\"}]}', '2026-05-06 03:10:58.830', '2026-05-06 03:11:00.483', '2026-05-06 03:11:00.482');

-- ---------- perf_item ----------
INSERT INTO `perf_item` VALUES (1, 1, 'USER', 1, 'points_base', 10.000000, 1, '{\"kind\": \"posting\", \"ruleId\": \"base_points\", \"reasonCode\": \"TASK_ACCEPTED_BASE\"}', '2026-04-30 03:19:53.776');
INSERT INTO `perf_item` VALUES (2, 2, 'USER', 1, 'points_base', 10.000000, 2, '{\"kind\": \"posting\", \"ruleId\": \"base_points\", \"reasonCode\": \"base_points\"}', '2026-04-30 09:45:56.418');
INSERT INTO `perf_item` VALUES (3, 3, 'USER', 1, 'points_base', 11.000000, 3, '{\"kind\": \"posting\", \"ruleId\": \"formula_score_rule\", \"reasonCode\": \"FORMULA_SCORE\"}', '2026-05-06 03:11:00.475');

-- ---------- work_log ----------
INSERT INTO `work_log` VALUES (2, 2, 1, 1, '123123', '2026-04-10 06:39:36.121');
INSERT INTO `work_log` VALUES (3, 2, 1, 1, '123', '2026-04-10 06:40:38.887');
INSERT INTO `work_log` VALUES (4, 2, 1, 1, '123123', '2026-04-10 06:40:41.348');
INSERT INTO `work_log` VALUES (5, 2, 1, 1, '测试内容', '2026-04-10 08:19:47.366');
INSERT INTO `work_log` VALUES (6, 2, 1, 1, '哈哈', '2026-04-10 09:31:03.526');
INSERT INTO `work_log` VALUES (7, 4, 1, 1, '123123', '2026-04-14 09:05:59.646');
INSERT INTO `work_log` VALUES (8, 2, 1, 1, '123123', '2026-04-14 09:10:42.453');
INSERT INTO `work_log` VALUES (9, 3, 1, 1, '21', '2026-04-28 08:57:33.659');
INSERT INTO `work_log` VALUES (10, 3, 1, 1, '123123', '2026-04-28 09:59:43.102');
INSERT INTO `work_log` VALUES (11, 5, 1, 2, '前端编码', '2026-04-30 08:42:46.249');
INSERT INTO `work_log` VALUES (12, 5, 1, 1, '123', '2026-04-30 09:00:40.831');

-- ---------- work_log_attachment ----------
INSERT INTO `work_log_attachment` VALUES (1, 5, 3, 0, '2026-04-10 08:19:47.370');
INSERT INTO `work_log_attachment` VALUES (2, 5, 4, 1, '2026-04-10 08:19:47.370');
INSERT INTO `work_log_attachment` VALUES (3, 5, 5, 2, '2026-04-10 08:19:47.370');
INSERT INTO `work_log_attachment` VALUES (4, 6, 8, 0, '2026-04-10 09:31:03.533');
INSERT INTO `work_log_attachment` VALUES (5, 12, 16, 0, '2026-04-30 09:00:40.837');
INSERT INTO `work_log_attachment` VALUES (6, 12, 17, 1, '2026-04-30 09:00:40.837');

SET FOREIGN_KEY_CHECKS = 1;
