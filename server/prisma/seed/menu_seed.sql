-- ============================================================
-- 菜单数据初始化 SQL
-- 基于前端 asyncRoutes 路由配置生成
-- 执行顺序：先插入父级目录，再插入子菜单
-- ============================================================

-- 清空旧数据（可选，谨慎使用）
-- DELETE FROM `_RoleToMenu`;
-- DELETE FROM `Menu`;

-- ============================================================
-- 一级目录（type=1）
-- ============================================================

-- 1. 工作台
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `roles`, `createTime`, `updateTime`)
VALUES (1, NULL, 'Dashboard', '工作台', '/dashboard', '/index/index', 'ri:pie-chart-line', 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, '["R_SUPER","R_ADMIN"]', NOW(), NOW());

-- 2. 文章管理
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `roles`, `createTime`, `updateTime`)
VALUES (2, NULL, 'Article', '文章管理', '/article', '/index/index', 'ri:book-2-line', 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, '["R_SUPER","R_ADMIN"]', NOW(), NOW());

-- 3. 系统管理
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `roles`, `createTime`, `updateTime`)
VALUES (3, NULL, 'System', '系统管理', '/system', '/index/index', 'ri:user-3-line', 1, 3, 1, 1, 0, 0, 0, 0, 0, 0, '["R_SUPER","R_ADMIN"]', NOW(), NOW());

-- 4. 结果页
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `createTime`, `updateTime`)
VALUES (4, NULL, 'Result', '结果页', '/result', '/index/index', 'ri:checkbox-circle-line', 1, 4, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW());

-- 5. 异常页
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `createTime`, `updateTime`)
VALUES (5, NULL, 'Exception', '异常页', '/exception', '/index/index', 'ri:error-warning-line', 1, 5, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW());

-- ============================================================
-- 工作台子菜单（type=2，parentId=1）
-- ============================================================

INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `createTime`, `updateTime`)
VALUES
  (10, 1, 'Console',  '控制台',   'console',  '/dashboard/console',   'ri:home-smile-2-line',       2, 1, 1, 0, 0, 0, 0, 0, 1, 0, NOW(), NOW()),
  (11, 1, 'Analysis', '分析页',   'analysis', '/dashboard/analysis',  'ri:align-item-bottom-line',  2, 2, 1, 0, 0, 0, 0, 0, 0, 0, NOW(), NOW()),
  (12, 1, 'Ecommerce','电商页',   'ecommerce','/dashboard/ecommerce', 'ri:bar-chart-box-line',      2, 3, 1, 0, 0, 0, 0, 0, 0, 0, NOW(), NOW());

-- ============================================================
-- 文章管理子菜单（type=2，parentId=2）
-- ============================================================

INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `activePath`, `authList`, `createTime`, `updateTime`)
VALUES
  (20, 2, 'ArticleList',    '文章列表', 'article-list',   '/article/list',    'ri:article-line',    2, 1, 1, 1, 0, 0, 0, 0, 0, 0, NULL, '[{"title":"新增","authMark":"add"},{"title":"编辑","authMark":"edit"}]', NOW(), NOW()),
  (21, 2, 'ArticleDetail',  '文章详情', 'detail/:id',     '/article/detail',  NULL,                 2, 2, 1, 1, 0, 1, 0, 0, 0, 0, '/article/article-list', NULL, NOW(), NOW()),
  (22, 2, 'ArticleComment', '评论管理', 'comment',        '/article/comment', 'ri:mail-line',       2, 3, 1, 1, 0, 0, 0, 0, 0, 0, NULL, NULL, NOW(), NOW()),
  (23, 2, 'ArticlePublish', '文章发布', 'publish',        '/article/publish', 'ri:telegram-2-line', 2, 4, 1, 1, 0, 0, 0, 0, 0, 0, NULL, '[{"title":"发布","authMark":"add"}]', NOW(), NOW());

-- ============================================================
-- 系统管理子菜单（type=2，parentId=3）
-- ============================================================

INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `roles`, `authList`, `createTime`, `updateTime`)
VALUES
  (30, 3, 'User',       '用户管理', 'user',         '/system/user',         'ri:user-line',          2, 1, 1, 1, 0, 0, 0, 0, 0, 0, '["R_SUPER","R_ADMIN"]', NULL, NOW(), NOW()),
  (31, 3, 'Role',       '角色管理', 'role',         '/system/role',         'ri:user-settings-line', 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, '["R_SUPER"]', NULL, NOW(), NOW()),
  (32, 3, 'UserCenter', '个人中心', 'user-center',  '/system/user-center',  'ri:user-line',          2, 3, 1, 1, 0, 1, 0, 0, 0, 0, NULL, NULL, NOW(), NOW()),
  (33, 3, 'Menus',      '菜单管理', 'menu',         '/system/menu',         'ri:menu-line',          2, 4, 1, 1, 0, 0, 0, 0, 0, 0, '["R_SUPER"]', '[{"title":"新增","authMark":"add"},{"title":"编辑","authMark":"edit"},{"title":"删除","authMark":"delete"}]', NOW(), NOW());

-- 系统管理 - 嵌套菜单目录（type=1，parentId=3）
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `createTime`, `updateTime`)
VALUES (34, 3, 'Nested', '嵌套菜单', 'nested', '', 'ri:menu-unfold-3-line', 1, 5, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW());

-- 嵌套菜单一级子项（parentId=34）
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `createTime`, `updateTime`)
VALUES
  (40, 34, 'NestedMenu1', '菜单1', 'menu1', '/system/nested/menu1', 'ri:align-justify', 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW()),
  (41, 34, 'NestedMenu2', '菜单2', 'menu2', '',                     'ri:align-justify', 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW()),
  (42, 34, 'NestedMenu3', '菜单3', 'menu3', '',                     'ri:align-justify', 1, 3, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW());

-- 嵌套菜单二级子项
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `createTime`, `updateTime`)
VALUES
  (50, 41, 'NestedMenu2-1', '菜单2-1', 'menu2-1', '/system/nested/menu2',         'ri:align-justify', 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW()),
  (51, 42, 'NestedMenu3-1', '菜单3-1', 'menu3-1', '/system/nested/menu3',         NULL,               2, 1, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW()),
  (52, 42, 'NestedMenu3-2', '菜单3-2', 'menu3-2', '',                             NULL,               1, 2, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW());

-- 嵌套菜单三级子项
INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `createTime`, `updateTime`)
VALUES
  (60, 52, 'NestedMenu3-2-1', '菜单3-2-1', 'menu3-2-1', '/system/nested/menu3/menu3-2', NULL, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW());

-- ============================================================
-- 结果页子菜单（type=2，parentId=4）
-- ============================================================

INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `createTime`, `updateTime`)
VALUES
  (70, 4, 'ResultSuccess', '成功页', 'success', '/result/success', 'ri:checkbox-circle-line', 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW()),
  (71, 4, 'ResultFail',    '失败页', 'fail',    '/result/fail',    'ri:close-circle-line',    2, 2, 1, 1, 0, 0, 0, 0, 0, 0, NOW(), NOW());

-- ============================================================
-- 异常页子菜单（type=2，parentId=5）
-- ============================================================

INSERT INTO `Menu` (`id`, `parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`, `isEnable`, `keepAlive`, `isIframe`, `isHide`, `isHideTab`, `isFullPage`, `fixedTab`, `showBadge`, `createTime`, `updateTime`)
VALUES
  (80, 5, 'Exception403', '403 禁止访问', '403', '/exception/403', NULL, 2, 1, 1, 1, 0, 0, 1, 1, 0, 0, NOW(), NOW()),
  (81, 5, 'Exception404', '404 页面不存在', '404', '/exception/404', NULL, 2, 2, 1, 1, 0, 0, 1, 1, 0, 0, NOW(), NOW()),
  (82, 5, 'Exception500', '500 服务器错误', '500', '/exception/500', NULL, 2, 3, 1, 1, 0, 0, 1, 1, 0, 0, NOW(), NOW());

-- ============================================================
-- 给 id=6 的角色关联所有菜单
-- Prisma 生成的多对多中间表名为 _MenuToRole 或 _RoleToMenu
-- 实际表名请根据 prisma migrate 生成结果确认
-- ============================================================

INSERT INTO `_menutorole` (`A`, `B`)
VALUES
  -- 一级目录
  (1, 6),(2, 6),(3, 6),(4, 6),(5, 6),
  -- 工作台子菜单
  (10, 6),(11, 6),(12, 6),
  -- 文章管理子菜单
  (20, 6),(21, 6),(22, 6),(23, 6),
  -- 系统管理子菜单
  (30, 6),(31, 6),(32, 6),(33, 6),(34, 6),
  -- 嵌套菜单
  (40, 6),(41, 6),(42, 6),
  (50, 6),(51, 6),(52, 6),
  (60, 6),
  -- 结果页
  (70, 6),(71, 6),
  -- 异常页
  (80, 6),(81, 6),(82, 6);
