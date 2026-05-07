/** 效能统计页：表格视角（列展示侧重） */
export const PERFORMANCE_VIEW = {
  /** 主责完成与核心指标为主 */
  MAIN: 'MAIN',
  /** 展示协作、验收、登记工时等扩展列 */
  FULL: 'FULL'
} as const;

export type PerformanceViewMode = (typeof PERFORMANCE_VIEW)[keyof typeof PERFORMANCE_VIEW];

export const PERFORMANCE_VIEW_OPTIONS: { value: PerformanceViewMode; label: string }[] = [
  { value: PERFORMANCE_VIEW.MAIN, label: '主责优先' },
  { value: PERFORMANCE_VIEW.FULL, label: '含协作/验收' }
];

export const COMPOSITE_TIER_META = {
  S: { label: 'S', elTag: 'success' as const },
  A: { label: 'A', elTag: 'primary' as const },
  B: { label: 'B', elTag: 'warning' as const },
  C: { label: 'C', elTag: 'danger' as const }
};

export type CompositeTier = keyof typeof COMPOSITE_TIER_META;

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
  throughput: '产出',
  quality: '质量',
  punctuality: '准时',
  speed: '速度',
  stability: '稳定'
};
