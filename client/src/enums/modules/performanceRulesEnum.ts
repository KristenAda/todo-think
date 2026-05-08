export enum RuleScopeEnum {
  GLOBAL = 'GLOBAL',
  PROJECT = 'PROJECT'
}

export enum RuleVariableValueTypeEnum {
  NUMBER = 'Number',
  FLOAT = 'Float',
  INTEGER = 'Integer'
}

export const RULE_SCOPE_OPTIONS = [
  { label: '全局', value: RuleScopeEnum.GLOBAL },
  { label: '项目', value: RuleScopeEnum.PROJECT }
] as const;

export const RULE_VARIABLE_VALUE_TYPE_OPTIONS = [
  { label: 'Number', value: RuleVariableValueTypeEnum.NUMBER },
  { label: 'Float', value: RuleVariableValueTypeEnum.FLOAT },
  { label: 'Integer', value: RuleVariableValueTypeEnum.INTEGER }
] as const;

/** 规则页「各科公式」与入账 pointsType、入账对象一致（协作分使用 refMany） */
export const PERFORMANCE_RULE_SCORE_SEGMENT_KEYS = [
  'base',
  'quality',
  'timeliness',
  'bonus',
  'collaboration'
] as const;

export type PerformanceRuleScoreSegmentKey = (typeof PERFORMANCE_RULE_SCORE_SEGMENT_KEYS)[number];

/** 规则页「简单配置」内置预设（编译为各科表达式字符串） */
export enum RuleSimplePresetEnum {
  /** 固定系数一键生成五科中的基础/质量/时效/奖励（协作默认不写，需在可调模板中开启） */
  STANDARD_SCORECARD = 'STANDARD_SCORECARD',
  /** 五科可调：基础、质量、时效、奖励、协作均可配参 */
  BALANCED = 'BALANCED',
  /** 仅基础分（可选乘复杂度） */
  BASE_ONLY = 'BASE_ONLY',
  /** 基础按工时计；质量/时效/奖励附带常用默认式 */
  HOURS_WEIGHTED = 'HOURS_WEIGHTED'
}

/** 规则编辑：简单向导 vs 直接编辑表达式 */
export enum RuleEditorModeEnum {
  SIMPLE = 'simple',
  ADVANCED = 'advanced'
}

export const RULE_EDITOR_MODE_OPTIONS = [
  { label: '简单配置', value: RuleEditorModeEnum.SIMPLE },
  { label: '公式编辑（高级）', value: RuleEditorModeEnum.ADVANCED }
] as const;

export const RULE_SIMPLE_PRESET_OPTIONS = [
  {
    label: '标准五科（推荐）',
    value: RuleSimplePresetEnum.STANDARD_SCORECARD,
    desc: '无需调参：一键生成基础、质量、时效、奖励、协作（协作默认 baseScore×0.15）'
  },
  {
    label: '均衡可调',
    value: RuleSimplePresetEnum.BALANCED,
    desc: '逐项调节系数，五科均可生成（协作比例填 0 即不写协作）'
  },
  {
    label: '仅基础分',
    value: RuleSimplePresetEnum.BASE_ONLY,
    desc: '只生成 baseScore（或乘复杂度），其它科目留空'
  },
  {
    label: '工时为主',
    value: RuleSimplePresetEnum.HOURS_WEIGHTED,
    desc: '基础按工时×单价；另附质量、时效、奖励常用默认式'
  }
] as const;

export const PERFORMANCE_RULE_SCORE_SEGMENTS: readonly {
  pointsType: PerformanceRuleScoreSegmentKey;
  label: string;
  /** true：保存为 subject.refMany = task.coAssigneeIds，每人一笔 */
  useCoAssigneeRefMany: boolean;
  hint?: string;
}[] = [
  { pointsType: 'base', label: '基础分', useCoAssigneeRefMany: false },
  {
    pointsType: 'quality',
    label: '质量分',
    useCoAssigneeRefMany: false,
    hint: '常用：软件开发按用例缺陷；其它领域按验收打回次数（任务事实 rejectCount）。避免与基础分中的打回扣分重复计分时请按领域拆分公式'
  },
  { pointsType: 'timeliness', label: '时效分', useCoAssigneeRefMany: false },
  { pointsType: 'bonus', label: '奖励分', useCoAssigneeRefMany: false },
  {
    pointsType: 'collaboration',
    label: '协作分',
    useCoAssigneeRefMany: true,
    hint: '按任务协作成员 task.coAssigneeIds，每位成员单独入账同一公式分值（数组为空则不发）'
  }
];
