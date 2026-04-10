-- ============================================================
-- 附件管理：仅插入本功能相关菜单与角色关联
-- 前置：系统管理目录 `Menu.id = 1` 已存在；`15`、`134`–`136` 未被占用
-- 表名与列名按 Prisma 迁移（`Menu`、`_MenuToRole`）；库名请自行 USE 或连接时指定
-- ============================================================

-- 1. 二级菜单：附件管理（与前端 route path `attachment`、`system/attachment/index` 一致）
INSERT IGNORE INTO `Menu` (
  `id`, `parentId`, `name`, `title`, `path`, `component`, `icon`,
  `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`,
  `authList`, `createTime`, `updateTime`
) VALUES (
  15, 1, 'SystemAttachment', '附件管理', 'attachment', 'system/attachment/index', 'mdi:paperclip',
  2, 5, 1, 1, 0, 0,
  NULL, NOW(), NOW()
);

-- 2. 按钮权限（type=3，parentId=15）
INSERT IGNORE INTO `Menu` (
  `id`, `parentId`, `name`, `title`, `path`, `component`, `icon`,
  `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`,
  `authList`, `createTime`, `updateTime`
) VALUES
(134, 15, NULL, '上传附件', NULL, NULL, NULL, 3, 1, 1, 1, 0, 0, '[{"authMark":"sys:attachment:upload","title":"上传"}]', NOW(), NOW()),
(135, 15, NULL, '删除附件', NULL, NULL, NULL, 3, 2, 1, 1, 0, 0, '[{"authMark":"sys:attachment:delete","title":"删除"}]', NOW(), NOW()),
(136, 15, NULL, '查看附件', NULL, NULL, NULL, 3, 3, 1, 1, 0, 0, '[{"authMark":"sys:attachment:view","title":"查看"}]', NOW(), NOW());

-- 3. 角色菜单：超级管理员(1)、普通管理员(2)
INSERT IGNORE INTO `_MenuToRole` (`A`, `B`) VALUES
(15, 1), (15, 2),
(134, 1), (135, 1), (136, 1),
(134, 2), (135, 2), (136, 2);
