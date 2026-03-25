-- ============================================================
-- 组织架构（部门管理）菜单 INSERT SQL
-- parentId=3 (系统管理目录, id=3)
-- 如已执行过 id=35 的 SQL，请跳过第一条，只执行角色关联部分
-- ============================================================

-- 1. 插入「组织架构」菜单（挂在系统管理目录下）
INSERT INTO `Menu` (
  `id`, `parentId`, `name`, `title`, `path`, `component`, `icon`,
  `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`,
  `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`,
  `roles`, `authList`, `createTime`, `updateTime`
) VALUES (
  35, 3, 'Organization', '组织架构', 'organization', '/system/organization', 'ri:organization-chart',
  2, 5, 1, 1, 0, 0,
  0, 0, 0, 0,
  '["R_SUPER","R_ADMIN"]',
  '[{"title":"添加管理者","authMark":"addManager"},{"title":"移除管理者","authMark":"removeManager"},{"title":"添加成员","authMark":"addMember"},{"title":"移除成员","authMark":"removeMember"}]',
  NOW(), NOW()
);

-- 2. 将该菜单关联到超级管理员角色
-- 注意：Prisma 生成的多对多中间表名称请根据实际情况确认
-- 通常为 `_MenuToRole`（Menu.A, Role.B）或 `_RoleToMenu`
-- 查询实际表名：SHOW TABLES LIKE '%menu%';
--
-- 假设超管角色 id=1，执行以下语句：
INSERT IGNORE INTO `_MenuToRole` (`A`, `B`) VALUES (35, 1);

-- 如果还有其他需要关联该菜单的角色（如 id=2 的管理员角色），追加：
-- INSERT IGNORE INTO `_MenuToRole` (`A`, `B`) VALUES (35, 2);
