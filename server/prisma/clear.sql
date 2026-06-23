-- ==========================================
-- 1. 关闭外键约束检查 (防止清空时报错)
-- ==========================================
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 2. 清空系统管理相关表 (System)
-- ==========================================
TRUNCATE TABLE `_MenuToRole`;
TRUNCATE TABLE `_RoleToUser`;
TRUNCATE TABLE `dept_members`;
TRUNCATE TABLE `dept_managers`;
TRUNCATE TABLE `menus`;
TRUNCATE TABLE `roles`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `departments`;

-- ==========================================
-- 3. 清空业务与任务管理相关表 (Task)
-- ==========================================
TRUNCATE TABLE `work_log`;
TRUNCATE TABLE `test_case`;
TRUNCATE TABLE `task_co_assignee`;
TRUNCATE TABLE `task`;
TRUNCATE TABLE `project`;

-- ==========================================
-- 4. 重新开启外键约束检查
-- ==========================================
SET FOREIGN_KEY_CHECKS = 1;
