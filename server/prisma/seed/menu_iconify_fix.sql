-- ============================================================
-- 菜单 icon 字段修正（Iconify，供 @iconify/vue 使用）
-- 格式：`集合:图标名`，如 ri:user-line、mdi:chart-line
-- 执行前请确认表名为 `Menu`（与 Prisma 一致）
-- ============================================================

UPDATE `Menu`
SET
  `icon` = CASE `id`
    -- 一级目录
    WHEN 1 THEN 'ri:pie-chart-2-line'
    WHEN 2 THEN 'ri:book-2-line'
    WHEN 3 THEN 'ri:settings-3-line'
    WHEN 4 THEN 'ri:checkbox-circle-line'
    WHEN 5 THEN 'ri:error-warning-line'
    -- 工作台子菜单
    WHEN 10 THEN 'ri:home-smile-2-line'
    WHEN 11 THEN 'ri:line-chart-line'
    WHEN 12 THEN 'ri:shopping-bag-3-line'
    -- 文章
    WHEN 20 THEN 'ri:article-line'
    WHEN 21 THEN 'ri:file-text-line'
    WHEN 22 THEN 'ri:mail-line'
    WHEN 23 THEN 'ri:send-plane-line'
    -- 系统管理
    WHEN 30 THEN 'ri:user-line'
    WHEN 31 THEN 'ri:user-settings-line'
    WHEN 32 THEN 'ri:user-smile-line'
    WHEN 33 THEN 'ri:menu-line'
    WHEN 34 THEN 'ri:menu-unfold-3-line'
    -- 组织架构（与前端 system 路由一致，Material Design Icons）
    WHEN 35 THEN 'mdi:sitemap'
    -- 嵌套示例
    WHEN 40 THEN 'ri:align-justify'
    WHEN 41 THEN 'ri:menu-unfold-3-line'
    WHEN 42 THEN 'ri:menu-unfold-3-line'
    WHEN 50 THEN 'ri:align-justify'
    WHEN 51 THEN 'ri:align-justify'
    WHEN 52 THEN 'ri:menu-unfold-3-line'
    WHEN 60 THEN 'ri:align-justify'
    -- 结果页
    WHEN 70 THEN 'ri:checkbox-circle-line'
    WHEN 71 THEN 'ri:close-circle-line'
    -- 异常页（补全原先为 NULL 的图标）
    WHEN 80 THEN 'ri:forbid-line'
    WHEN 81 THEN 'ri:ghost-smile-line'
    WHEN 82 THEN 'ri:alarm-warning-line'
    -- 任务 / 项目 / 研发效能（与业务页常用 mdi 线框图标一致）
    WHEN 90 THEN 'mdi:clipboard-check-outline'
    WHEN 91 THEN 'mdi:view-list-outline'
    WHEN 92 THEN 'mdi:folder-cog-outline'
    WHEN 95 THEN 'mdi:chart-box-outline'
    WHEN 96 THEN 'mdi:chart-line'
    ELSE `icon`
  END,
  `updateTime` = NOW()
WHERE `id` IN (
  1, 2, 3, 4, 5,
  10, 11, 12,
  20, 21, 22, 23,
  30, 31, 32, 33, 34, 35,
  40, 41, 42, 50, 51, 52, 60,
  70, 71, 80, 81, 82,
  90, 91, 92, 95, 96
);

-- 验证：SELECT id, title, icon FROM `Menu` WHERE id IN (35, 90, 91, 92, 95, 96) ORDER BY id;
