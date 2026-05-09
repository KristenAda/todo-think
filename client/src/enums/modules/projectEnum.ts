import type { ProjectStatus } from '@/api/project';

/** 项目状态：列表 / 卡片 / 筛选下拉统一配色（色相区分明显） */
export interface ProjectStatusUi {
  value: ProjectStatus;
  label: string;
  /** 阶段进度百分比（按状态示意） */
  progressPercent: number;
  /** 呼吸点、筛选圆点 */
  dotColor: string;
  /** 顶部进度条填充 */
  barFill: string;
  /** 百分比数字颜色 */
  percentText: string;
  /** 徽标背景 */
  badgeBg: string;
  /** 徽标文字颜色 */
  badgeTextColor: string;
}

export const PROJECT_STATUS_UI: readonly ProjectStatusUi[] = [
  {
    value: 'PLANNING',
    label: '计划中',
    progressPercent: 20,
    dotColor: '#64748b',
    barFill: '#64748b',
    percentText: '#334155',
    badgeBg: 'rgba(100, 116, 139, 0.14)',
    badgeTextColor: '#334155'
  },
  {
    value: 'ACTIVE',
    label: '进行中',
    progressPercent: 65,
    dotColor: 'var(--theme-color, #2563eb)',
    barFill: 'var(--theme-color, #2563eb)',
    percentText: 'var(--theme-color, #1d4ed8)',
    badgeBg: 'color-mix(in srgb, var(--theme-color, #2563eb) 14%, transparent)',
    badgeTextColor: 'var(--theme-color, #1e3a8a)'
  },
  {
    value: 'COMPLETED',
    label: '已完成',
    progressPercent: 100,
    dotColor: '#059669',
    barFill: '#10b981',
    percentText: '#047857',
    badgeBg: 'rgba(16, 185, 129, 0.16)',
    badgeTextColor: '#065f46'
  },
  {
    value: 'SUSPENDED',
    label: '已搁置',
    progressPercent: 40,
    dotColor: '#ea580c',
    barFill: '#f97316',
    percentText: '#c2410c',
    badgeBg: 'rgba(249, 115, 22, 0.16)',
    badgeTextColor: '#9a3412'
  }
];
