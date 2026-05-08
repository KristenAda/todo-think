/**
 * 与后端 Prisma TaskComplexityTier / Api.Task.TaskComplexityTier 一致
 * 方案二：档位映射绩效公式 complexity 数值
 */
export enum TaskComplexityTierEnum {
  SIMPLE = 'SIMPLE',
  STANDARD = 'STANDARD',
  COMPLEX = 'COMPLEX',
  VERY_HARD = 'VERY_HARD'
}

export const TASK_COMPLEXITY_COEFFICIENT: Record<TaskComplexityTierEnum, number> = {
  [TaskComplexityTierEnum.SIMPLE]: 0.8,
  [TaskComplexityTierEnum.STANDARD]: 1.0,
  [TaskComplexityTierEnum.COMPLEX]: 1.2,
  [TaskComplexityTierEnum.VERY_HARD]: 1.5
};

/** 下拉选项：名称 + 说明 + 系数（面向业务用户） */
export const TASK_COMPLEXITY_TIER_OPTIONS: readonly {
  label: string;
  description: string;
  value: TaskComplexityTierEnum;
  coefficient: number;
}[] = [
  {
    value: TaskComplexityTierEnum.SIMPLE,
    coefficient: 0.8,
    label: '简单',
    description: '纯文案修改、简单 UI 调整、无逻辑变更'
  },
  {
    value: TaskComplexityTierEnum.STANDARD,
    coefficient: 1.0,
    label: '常规',
    description: '标准 CRUD、常规页面开发'
  },
  {
    value: TaskComplexityTierEnum.COMPLEX,
    coefficient: 1.2,
    label: '复杂',
    description: '核心业务链路变更、需考虑并发/兼容性等'
  },
  {
    value: TaskComplexityTierEnum.VERY_HARD,
    coefficient: 1.5,
    label: '极难',
    description: '底层架构重构、无先例的攻坚难点'
  }
] as const;

/** 旧数据仅有 complexity 数值时的兜底推断（接近预设档位则对齐） */
export function inferComplexityTierFromCoefficient(c: number | null | undefined): TaskComplexityTierEnum {
  if (c == null || !Number.isFinite(c)) return TaskComplexityTierEnum.STANDARD;
  const near = (a: number, b: number) => Math.abs(a - b) < 0.06;
  if (near(c, TASK_COMPLEXITY_COEFFICIENT[TaskComplexityTierEnum.SIMPLE]))
    return TaskComplexityTierEnum.SIMPLE;
  if (near(c, TASK_COMPLEXITY_COEFFICIENT[TaskComplexityTierEnum.STANDARD]))
    return TaskComplexityTierEnum.STANDARD;
  if (near(c, TASK_COMPLEXITY_COEFFICIENT[TaskComplexityTierEnum.COMPLEX]))
    return TaskComplexityTierEnum.COMPLEX;
  if (near(c, TASK_COMPLEXITY_COEFFICIENT[TaskComplexityTierEnum.VERY_HARD]))
    return TaskComplexityTierEnum.VERY_HARD;
  return TaskComplexityTierEnum.STANDARD;
}

export function complexityTierLabel(tier: TaskComplexityTierEnum | string): string {
  const row = TASK_COMPLEXITY_TIER_OPTIONS.find((o) => o.value === tier);
  return row?.label ?? String(tier);
}
