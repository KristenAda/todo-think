/** 与 Prisma TaskComplexityTier 一致；避免在未 generate 时强依赖 @prisma/client 枚举 */
export const TASK_COMPLEXITY_TIER_VALUES = ["SIMPLE", "STANDARD", "COMPLEX", "VERY_HARD"] as const;
export type TaskComplexityTierValue = (typeof TASK_COMPLEXITY_TIER_VALUES)[number];

/** 档位 → 绩效公式 complexity 数值（方案二：标签映射系数） */
export const COEFFICIENT_BY_TASK_COMPLEXITY_TIER: Record<TaskComplexityTierValue, number> = {
  SIMPLE: 0.8,
  STANDARD: 1.0,
  COMPLEX: 1.2,
  VERY_HARD: 1.5,
};

export const LABEL_ZH_BY_TASK_COMPLEXITY_TIER: Record<TaskComplexityTierValue, string> = {
  SIMPLE: "简单",
  STANDARD: "常规",
  COMPLEX: "复杂",
  VERY_HARD: "极难",
};

export function coefficientFromTaskComplexityTier(
  tier: string | null | undefined,
  legacyComplexity?: number | null,
): number {
  if (tier && Object.prototype.hasOwnProperty.call(COEFFICIENT_BY_TASK_COMPLEXITY_TIER, tier)) {
    return COEFFICIENT_BY_TASK_COMPLEXITY_TIER[tier as TaskComplexityTierValue];
  }
  return normalizeLegacyComplexityFloat(legacyComplexity);
}

function normalizeLegacyComplexityFloat(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(100, Math.max(0.1, n));
}

export function coefficientForTierOrThrow(tier: string): number {
  if (!Object.prototype.hasOwnProperty.call(COEFFICIENT_BY_TASK_COMPLEXITY_TIER, tier)) {
    throw new Error(`invalid complexityTier: ${tier}`);
  }
  return COEFFICIENT_BY_TASK_COMPLEXITY_TIER[tier as TaskComplexityTierValue];
}
