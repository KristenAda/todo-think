-- ==========================================
-- 测试库专用种子（精简自 prisma/seed.sql）
--
-- 内容：Role / Menu / _MenuToRole 与正式种子一致；仅 1 个用户 admin（超级管理员）；
--       不含 Department / DeptMember / DeptManager；不含任务、项目、附件等业务表数据。
--
-- 登录：admin，密码规则与主种子相同（前端 SHA-256 后传输，明文演示环境通常为 123456）。
--
-- 使用前提：
--   1. MySQL 已创建库（建议库名含 test，例如 todo_think_test_db）
--   2. 表结构已由 prisma migrate 就绪，且库内无种子相关主键冲突（推荐空库）
--
-- 推荐（清空全部数据 + 迁移 + 本文件）：server 目录执行
--   npm run db:test:fresh
-- 等价：npm run db:test:reset && npm run db:test:seed
--
-- 若仅在已有数据上重复执行本 SQL，会因主键冲突失败；请先 npm run db:test:reset。
-- ==========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- Role ----------
-- 必须写列名：迁移里 isDefaultRole 为 ALTER ADD，MySQL 中物理顺序在表末尾，与 Prisma schema 顺序不一致；
-- 使用 VALUES 无列名会导致 remark/createTime 错位（报错 Incorrect datetime value）。
INSERT INTO `roles` (`id`, `role_name`, `role_code`, `description`, `enabled`, `sort`, `data_scope`, `is_default_role`, `remark`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, '超级管理员', 'admin', '系统超级管理员，拥有所有权限', 1, 1, 1, 0, '超级管理员', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL),
(2, '普通管理员', 'manager', '拥有本部门及以下数据权限', 1, 2, 3, 0, '普通管理员', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL),
(3, '部门主管', 'supervisor', '拥有本部门及以下数据权限', 1, 3, 3, 0, '部门主管', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL),
(4, '普通员工', 'user', '仅拥有本人数据权限', 1, 4, 5, 0, '普通员工', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL),
(5, '访客', 'guest', '仅拥有查看权限', 1, 5, 5, 0, '访客', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL),
(6, '默认角色', 'everyone', '登录用户自动叠加的基础菜单（如个人中心，无需绑定用户）', 1, 99, 5, 1, '种子：系统默认角色', '2026-04-09 17:29:22.000', '2026-04-09 17:29:22.000', NULL);

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

-- ---------- User（仅超级管理员 admin，id=1）----------
INSERT INTO `users` VALUES (1, 'admin', '$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q', '超级管理员', '13800000001', 'admin@company.com', '男', NULL, '1', '系统超级管理员', NULL, NULL, '2026-04-09 17:29:22.000', NULL, '2026-04-10 14:36:23.000', NULL);

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

-- ---------- _RoleToUser（仅绑定 admin -> 超级管理员角色）----------
INSERT INTO `_RoleToUser` VALUES (1, 1);

SET FOREIGN_KEY_CHECKS = 1;
