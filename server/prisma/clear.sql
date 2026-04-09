-- ==========================================
-- 1. 关闭外键约束检查 (防止清空时报错)
-- ==========================================
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 2. 清空系统管理相关表 (System)
-- ==========================================
TRUNCATE TABLE `_MenuToRole`;
TRUNCATE TABLE `_RoleToUser`;
TRUNCATE TABLE `DeptMember`;
TRUNCATE TABLE `Menu`;
TRUNCATE TABLE `Role`;
TRUNCATE TABLE `User`;
TRUNCATE TABLE `Department`;

-- ==========================================
-- 3. 清空业务与任务管理相关表 (Task)
-- 根据你的 Prisma schema 映射的表名
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