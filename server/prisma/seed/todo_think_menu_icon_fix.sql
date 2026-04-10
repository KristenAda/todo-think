-- ============================================================
-- todo_think 库：菜单 icon 从 Element Plus 组件名改为 Iconify（@iconify/vue）
-- 依据当前菜单 id 与业务含义，仅更新 icon（及 updateTime）
-- ============================================================

USE `todo_think_db`;

UPDATE `menu`
SET
  `icon` = CASE `id`
    WHEN 1 THEN 'ri:settings-3-line'
    WHEN 2 THEN 'mdi:briefcase-account-outline'
    WHEN 3 THEN 'mdi:chart-box-outline'
    WHEN 4 THEN 'mdi:chart-line'
    WHEN 10 THEN 'ri:user-line'
    WHEN 11 THEN 'ri:user-settings-line'
    WHEN 12 THEN 'ri:menu-line'
    WHEN 13 THEN 'mdi:sitemap'
    WHEN 14 THEN 'ri:user-smile-line'
    WHEN 15 THEN 'mdi:paperclip'
    WHEN 20 THEN 'mdi:view-list-outline'
    WHEN 21 THEN 'mdi:briefcase-outline'
    WHEN 30 THEN 'ri:dashboard-2-line'
    WHEN 31 THEN 'ri:pie-chart-line'
    WHEN 32 THEN 'ri:shopping-cart-line'
    WHEN 40 THEN 'mdi:chart-timeline-variant'
    ELSE `icon`
  END,
  `updateTime` = NOW()
WHERE `id` IN (1, 2, 3, 4, 10, 11, 12, 13, 14, 15, 20, 21, 30, 31, 32, 40);

-- 验证：
-- SELECT `id`, `title`, `icon` FROM `menu` ORDER BY `id`;
