/** 效能统计页：表格视角（列展示侧重） */
export const PERFORMANCE_VIEW = {
  /** 主要负责人维度与核心指标为主 */
  MAIN: 'MAIN',
  /** 展示协作、验收、登记工时等扩展列 */
  FULL: 'FULL'
} as const;

export type PerformanceViewMode = (typeof PERFORMANCE_VIEW)[keyof typeof PERFORMANCE_VIEW];

export const PERFORMANCE_VIEW_OPTIONS: { value: PerformanceViewMode; label: string }[] = [
  { value: PERFORMANCE_VIEW.MAIN, label: '主要负责人视图' },
  { value: PERFORMANCE_VIEW.FULL, label: '含协作与验收' }
];

/** 与后端 compositeTier 一致；档位按综合分区间判定（见后端 perfTierFromScore） */
export const COMPOSITE_TIER_META = {
  C: { label: 'C', elTag: 'danger' as const },
  B: { label: 'B', elTag: 'warning' as const },
  A: { label: 'A', elTag: 'primary' as const },
  'S-': { label: 'S-', elTag: 'info' as const },
  S: { label: 'S', elTag: 'success' as const },
  'S+': { label: 'S+', elTag: 'success' as const },
  SS: { label: 'SS', elTag: 'success' as const },
  SSS: { label: 'SSS', elTag: 'success' as const }
} as const;

export type CompositeTier = keyof typeof COMPOSITE_TIER_META;

/** 详情页档位卡片 CSS 后缀（避免 SSS→toLowerCase 变成无意义的 ttt） */
export function compositeTierHeroClassSuffix(tier: string): string {
  switch (tier) {
    case 'S-':
      return 's-minus';
    case 'S+':
      return 's-plus';
    case 'SS':
      return 'ss';
    case 'SSS':
      return 'triple-s';
    default:
      return tier.toLowerCase();
  }
}

/** Prisma TaskType → 中文（图表/表格展示） */
export const TASK_TYPE_LABEL: Record<string, string> = {
  FEATURE: '需求',
  BUG: '缺陷',
  CHORE: '技术债',
  ENHANCEMENT: '优化'
};

export function taskTypeLabel(code: string): string {
  return TASK_TYPE_LABEL[code] ?? code;
}

/** 维度子分字段（与后端 subScores 一致） */
export const PERF_SUB_SCORE_KEYS = [
  'throughput',
  'quality',
  'punctuality',
  'speed',
  'stability'
] as const;

export type PerfSubScoreKey = (typeof PERF_SUB_SCORE_KEYS)[number];

export const PERF_SUB_SCORE_LABEL: Record<PerfSubScoreKey, string> = {
  throughput: '交付产出',
  quality: '交付质量',
  punctuality: '交付履约',
  speed: '交付效率',
  stability: '交付稳定性'
};
