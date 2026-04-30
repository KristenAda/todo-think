-- ============================================================
-- 数字绩效 / 积分 / 动态规则引擎 核心菜单 SQL
-- 目标：将核心功能菜单授权给 userId = 1
--
-- 说明：
-- 1) 菜单表使用 `Menu`（与现有 seed.sql 保持一致）
-- 2) 角色菜单中间表使用 `_MenuToRole`（A=Menu.id, B=Role.id）
-- 3) 角色用户中间表使用 `_RoleToUser`（A=Role.id, B=User.id）
-- ============================================================

-- ------------------------------------------------------------
-- 一、菜单（核心功能）
-- 约定 ID 段：140~149（避免与现有种子数据冲突）
-- ------------------------------------------------------------

-- 1) 系统管理下：规则管理（前端路由 /system/performance-rules）
INSERT INTO `Menu` (
  `id`, `parentId`, `name`, `title`, `path`, `component`, `icon`,
  `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `authList`,
  `createTime`, `updateTime`
) VALUES (
  140, 1, 'PerformanceRules', '规则管理', 'performance-rules', 'performance/rules/index', 'mdi:calculator-variant-outline',
  2, 20, 1, 1, 0, 0, '[{"title":"查看规则","authMark":"rule:view"},{"title":"创建规则","authMark":"rule:create"},{"title":"发布规则","authMark":"rule:publish"},{"title":"模拟运行","authMark":"rule:simulate"},{"title":"触发补差","authMark":"rule:adjustment"}]',
  NOW(), NOW()
)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `path` = VALUES(`path`),
  `component` = VALUES(`component`),
  `icon` = VALUES(`icon`),
  `type` = VALUES(`type`),
  `isEnable` = VALUES(`isEnable`),
  `keepAlive` = VALUES(`keepAlive`),
  `isIframe` = VALUES(`isIframe`),
  `isHide` = VALUES(`isHide`),
  `authList` = VALUES(`authList`),
  `updateTime` = NOW();

-- 2) 研发效能下：效能统计（若已存在 id=40，会走更新）
INSERT INTO `Menu` (
  `id`, `parentId`, `name`, `title`, `path`, `component`, `icon`,
  `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `authList`,
  `createTime`, `updateTime`
) VALUES (
  40, 4, 'PerformanceMetric', '效能统计', 'metric', 'performance/index', 'mdi:chart-timeline-variant',
  2, 1, 1, 1, 0, 0, '[{"title":"查看统计","authMark":"performance:view"},{"title":"任务对账","authMark":"performance:reconcile"}]',
  NOW(), NOW()
)
ON DUPLICATE KEY UPDATE
  `parentId` = VALUES(`parentId`),
  `name` = VALUES(`name`),
  `title` = VALUES(`title`),
  `path` = VALUES(`path`),
  `component` = VALUES(`component`),
  `icon` = VALUES(`icon`),
  `type` = VALUES(`type`),
  `isEnable` = VALUES(`isEnable`),
  `keepAlive` = VALUES(`keepAlive`),
  `isIframe` = VALUES(`isIframe`),
  `isHide` = VALUES(`isHide`),
  `authList` = VALUES(`authList`),
  `updateTime` = NOW();

-- ------------------------------------------------------------
-- 二、菜单授权给超级管理员角色（roleId=1）
-- ------------------------------------------------------------
INSERT IGNORE INTO `_MenuToRole` (`A`, `B`) VALUES
  (140, 1),
  (40, 1);

-- ------------------------------------------------------------
-- 三、确保 userId=1 拥有超级管理员角色（roleId=1）
-- ------------------------------------------------------------
INSERT IGNORE INTO `_RoleToUser` (`A`, `B`) VALUES
  (1, 1);

-- ------------------------------------------------------------
-- 四、可选验证 SQL
-- ------------------------------------------------------------
-- SELECT id, parentId, name, title, path, component
-- FROM `Menu`
-- WHERE id IN (40, 140)
-- ORDER BY id;
--
-- SELECT * FROM `_MenuToRole` WHERE (`A` IN (40, 140) AND `B`=1);
-- SELECT * FROM `_RoleToUser` WHERE `A`=1 AND `B`=1;

