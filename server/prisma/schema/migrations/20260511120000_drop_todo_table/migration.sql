-- 移除模板菜单「分析页」「电商统计」及其角色关联（外键级联清理 _MenuToRole）
DELETE FROM `Menu` WHERE `id` IN (31, 32);

-- DropTable
DROP TABLE IF EXISTS `Todo`;
