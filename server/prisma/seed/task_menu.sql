-- ============================================================
-- 任务与研发效能管理系统 — 菜单 INSERT SQL
-- 执行前提：menu_seed.sql 已执行（基础菜单 id 1~82 已存在）
-- 新增 id 范围：90、91、95、96
-- ============================================================

-- ============================================================
-- 一级目录：任务管理（type=1）
-- ============================================================
INSERT INTO `Menu` (
  `id`, `parentId`, `name`, `title`, `path`, `component`, `icon`,
  `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`,
  `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`,
  `roles`, `createTime`, `updateTime`
) VALUES (
  90, NULL, 'Task', '任务管理', '/task', '/index/index', 'ri:task-line',
  1, 6, 1, 1, 0, 0, 0, 0, 0, 0,
  '["R_SUPER","R_ADMIN"]',
  NOW(), NOW()
);

-- ============================================================
-- 任务管理子菜单（type=2，parentId=90）
-- 任务列表 — 管理者视图
-- ============================================================
INSERT INTO `Menu` (
  `id`, `parentId`, `name`, `title`, `path`, `component`, `icon`,
  `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`,
  `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`,
  `roles`, `authList`, `createTime`, `updateTime`
) VALUES (
  91, 90, 'TaskManager', '任务列表', 'manager', '/task/manager/index', 'ri:clipboard-line',
  2, 1, 1, 1, 0, 0, 0, 0, 0, 0,
  '["R_SUPER","R_ADMIN"]',
  '[{"title":"新建任务","authMark":"add"},{"title":"编辑任务","authMark":"edit"},{"title":"删除任务","authMark":"delete"},{"title":"查看详情","authMark":"view"},{"title":"登记工时","authMark":"worklog"},{"title":"提交验收","authMark":"submitTest"},{"title":"QA验收","authMark":"qaAudit"}]',
  NOW(), NOW()
);

-- ============================================================
-- 一级目录：研发效能（type=1）
-- ============================================================
INSERT INTO `Menu` (
  `id`, `parentId`, `name`, `title`, `path`, `component`, `icon`,
  `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`,
  `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`,
  `roles`, `createTime`, `updateTime`
) VALUES (
  95, NULL, 'Performance', '研发效能', '/performance', '/index/index', 'ri:bar-chart-box-line',
  1, 7, 1, 1, 0, 0, 0, 0, 0, 0,
  '["R_SUPER","R_ADMIN"]',
  NOW(), NOW()
);

-- ============================================================
-- 研发效能子菜单（type=2，parentId=95）
-- ============================================================
INSERT INTO `Menu` (
  `id`, `parentId`, `name`, `title`, `path`, `component`, `icon`,
  `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`,
  `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`,
  `roles`, `authList`, `createTime`, `updateTime`
) VALUES (
  96, 95, 'PerformanceStats', '效能统计', 'stats', '/performance/index', 'ri:pie-chart-2-line',
  2, 1, 1, 1, 0, 0, 0, 0, 0, 0,
  '["R_SUPER","R_ADMIN"]',
  '[{"title":"查看统计","authMark":"view"}]',
  NOW(), NOW()
);

-- ============================================================
-- 角色关联（中间表 _menutorole）
-- A = Menu.id，B = Role.id
-- 执行前请确认角色 id：SELECT id, roleName FROM `Role`;
-- ============================================================

-- 关联到角色 id=1（超级管理员，R_SUPER）
INSERT IGNORE INTO `_menutorole` (`A`, `B`) VALUES
  (90, 1),
  (91, 1),
  (95, 1),
  (96, 1);

-- 关联到角色 id=2（管理员，R_ADMIN）—— 按需取消注释
-- INSERT IGNORE INTO `_menutorole` (`A`, `B`) VALUES
--   (90, 2),(91, 2),(95, 2),(96, 2);

-- ============================================================
-- 执行后验证
-- ============================================================
-- SELECT id, parentId, name, title, type, sort
--   FROM `Menu`
--   WHERE id IN (90, 91, 95, 96)
--   ORDER BY id;
