-- ============================================================
-- 项目管理菜单 INSERT SQL
-- 挂在任务管理一级目录（id=90）下
-- 在 task_menu.sql 执行之后执行本文件
-- ============================================================

-- 插入「项目管理」子菜单（挂在任务管理目录 id=90 下，sort=2）
INSERT INTO `Menu` (
  `id`, `parentId`, `name`, `title`, `path`, `component`, `icon`,
  `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`,
  `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`,
  `roles`, `authList`, `createTime`, `updateTime`
) VALUES (
  92, 90, 'ProjectManage', '项目管理', 'project', '/project/index', 'mdi:folder-multiple-outline',
  2, 2, 1, 1, 0, 0, 0, 0, 0, 0,
  '["R_SUPER","R_ADMIN"]',
  '[{"title":"新建项目","authMark":"add"},{"title":"编辑项目","authMark":"edit"},{"title":"删除项目","authMark":"delete"}]',
  NOW(), NOW()
);

-- 关联到角色 id=1（超级管理员）
INSERT IGNORE INTO `_menutorole` (`A`, `B`) VALUES (92, 1);

-- 关联到其他角色（如需，取消注释）
-- INSERT IGNORE INTO `_menutorole` (`A`, `B`) VALUES (92, 2);
-- INSERT IGNORE INTO `_menutorole` (`A`, `B`) VALUES (92, 6);

-- 验证
-- SELECT id, parentId, name, title FROM `Menu` WHERE id = 92;
