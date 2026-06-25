-- Unify workbench route: /analysis/console -> /dashboard/console
-- Usage: mysql -u root -p todo_think_db < prisma/seed/dashboard_console_path_unify.sql

SET NAMES utf8mb4;

UPDATE `menus`
SET
  `name` = 'Dashboard',
  `title` = 'Workbench',
  `path` = '/dashboard',
  `component` = '/index/index',
  `icon` = 'ri:pie-chart-line',
  `type` = 1,
  `updated_at` = NOW()
WHERE `path` = '/analysis'
   OR (`name` = 'Analysis' AND `parent_id` IS NULL);

UPDATE `menus`
SET
  `name` = 'Console',
  `title` = 'Console',
  `path` = 'console',
  `component` = '/dashboard/console',
  `icon` = 'ri:home-smile-2-line',
  `fixed_tab` = 1,
  `updated_at` = NOW()
WHERE `name` IN ('AnalysisConsole', 'Console')
  AND (`component` LIKE '%dashboard/console%' OR `path` = 'console');

-- Restore Chinese titles after ASCII-safe column updates
UPDATE `menus` SET `title` = '工作台' WHERE `name` = 'Dashboard' AND `path` = '/dashboard' AND `parent_id` IS NULL;
UPDATE `menus` SET `title` = '主控制台' WHERE `name` = 'Console' AND `path` = 'console' AND `component` = '/dashboard/console';
