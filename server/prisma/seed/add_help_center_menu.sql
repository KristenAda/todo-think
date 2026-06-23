-- ============================================================
-- 帮助中心菜单：写入已有数据库（菜单管理可见后再给角色勾选）
--
-- 前置：系统管理目录 Menu.id = 1 已存在。
-- 默认使用菜单 id = 142；若你库中 142 已被占用，请先：
--   SELECT id FROM Menu WHERE id = 142 OR (parentId = 1 AND path = 'help-center');
-- 然后全文替换下面的 142 为新 id。
--
-- 用法：在目标库执行本脚本（按需 USE `your_db`;）。
-- 若只希望插入菜单、一律在「角色管理」里手动勾选，可删除或注释掉「角色关联」一节。
-- ============================================================

SET NAMES utf8mb4;

-- 1. 二级菜单：help-center → views/system/help-center/index.vue
INSERT IGNORE INTO `Menu` (
  `id`,
  `parentId`,
  `name`,
  `title`,
  `path`,
  `component`,
  `icon`,
  `type`,
  `sort`,
  `isEnable`,
  `keepAlive`,
  `isIframe`,
  `isHide`,
  `authList`,
  `createTime`,
  `updateTime`
) VALUES (
  142,
  1,
  'HelpCenter',
  '帮助中心',
  'help-center',
  'system/help-center/index',
  'mdi:book-open-variant',
  2,
  6,
  1,
  1,
  0,
  0,
  '[{"title":"查看","authMark":"help-center:view"}]',
  NOW(3),
  NOW(3)
);

-- 2. 角色关联：种子中的基础角色 id 1–6（超级管理员、普通管理员、部门主管、员工、访客、默认角色）
INSERT IGNORE INTO `_MenuToRole` (`A`, `B`) VALUES
  (142, 1),
  (142, 2),
  (142, 3),
  (142, 4),
  (142, 5),
  (142, 6);
