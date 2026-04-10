/**
 * 菜单 / 标签页使用的 Iconify 图标名（@iconify/vue）
 * 标准格式：`集合:图标名`，如 `ri:user-line`、`mdi:folder-outline`
 *
 * 历史数据常见：
 * - 仅 Remix 短名（无集合）→ 补全为 `ri:xxx`
 * - Element Plus 图标组件名（PascalCase，如 User、PieChart）→ 映射为 Iconify
 */

/** Element Plus @element-plus/icons-vue 组件名 → Iconify（与库中菜单 icon 字段对齐） */
const ELEMENT_PLUS_ICON_TO_ICONIFY: Record<string, string> = {
  Management: 'mdi:briefcase-account-outline',
  DataAnalysis: 'mdi:chart-box-outline',
  TrendCharts: 'mdi:chart-line',
  User: 'ri:user-line',
  UserFilled: 'ri:user-settings-line',
  Menu: 'ri:menu-line',
  Organization: 'mdi:sitemap',
  Postcard: 'ri:user-smile-line',
  List: 'mdi:view-list-outline',
  Briefcase: 'mdi:briefcase-outline',
  Odometer: 'ri:dashboard-2-line',
  PieChart: 'ri:pie-chart-line',
  ShoppingCart: 'ri:shopping-cart-line',
  DataLine: 'mdi:chart-timeline-variant'
};

export function resolveMenuIconifyIcon(raw: unknown, fallback = 'ri:menu-line'): string {
  if (raw == null) return fallback;
  const s = String(raw).trim();
  if (!s) return fallback;
  if (s.includes(':')) return s;

  const ep = ELEMENT_PLUS_ICON_TO_ICONIFY[s];
  if (ep) return ep;

  // 已是 iconify 常用的 kebab 短名（如 user-line、settings-3-line）
  if (/^[a-z0-9]+(-[a-z0-9]+)*$/i.test(s)) {
    return `ri:${s.toLowerCase()}`;
  }

  // 仍为 PascalCase 等无法解析的旧值，避免生成非法 `ri:User`
  if (/^[A-Z]/.test(s)) {
    return fallback;
  }

  return `ri:${s}`;
}
