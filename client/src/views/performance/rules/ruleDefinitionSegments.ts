/**
 * 规则 definition 与「各科公式」表单互转（兼容旧版：单规则单 emitPosting / 固定分值 / 无 pointsType）
 */
import {
  PERFORMANCE_RULE_SCORE_SEGMENT_KEYS,
  PERFORMANCE_RULE_SCORE_SEGMENTS,
  type PerformanceRuleScoreSegmentKey
} from '@/enums/modules/performanceRulesEnum';

function actionKind(t: unknown): string {
  return String(t ?? '')
    .replace(/[-_\s]/g, '')
    .toLowerCase();
}

function isEmitPostingAction(act: unknown): boolean {
  return actionKind((act as any)?.type) === 'emitposting';
}

function normalizeRulesList(rules: unknown): any[] {
  if (Array.isArray(rules)) return rules as any[];
  if (rules != null && typeof rules === 'object') {
    const o = rules as Record<string, unknown>;
    return Object.keys(o)
      .sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return a.localeCompare(b);
      })
      .map((k) => o[k])
      .filter((x): x is object => x != null && typeof x === 'object');
  }
  return [];
}

function normalizeThenList(rule: any): any[] {
  const thenRaw = rule?.then ?? rule?.actions;
  return Array.isArray(thenRaw) ? thenRaw : thenRaw ? [thenRaw] : [];
}

export function emptySegmentExprs(): Record<PerformanceRuleScoreSegmentKey, string> {
  return {
    base: '',
    quality: '',
    timeliness: '',
    bonus: '',
    collaboration: ''
  };
}

/** 从 amount DSL 还原公式字符串（兼容纯数字固定分） */
export function extractAmountExpr(amount: unknown): string {
  if (typeof amount === 'number' && Number.isFinite(amount)) return String(amount);
  if (
    amount &&
    typeof amount === 'object' &&
    (amount as any).fn === 'formula' &&
    typeof (amount as any).args?.[0] === 'string'
  ) {
    return String((amount as any).args[0]).trim();
  }
  return '';
}

function normalizePointsType(act: any): PerformanceRuleScoreSegmentKey | null {
  const raw = act?.pointsType;
  if (typeof raw === 'string' && raw.trim()) {
    const pt = raw.trim();
    return (PERFORMANCE_RULE_SCORE_SEGMENT_KEYS as readonly string[]).includes(pt)
      ? (pt as PerformanceRuleScoreSegmentKey)
      : null;
  }
  /** 旧版 DSL 常省略 pointsType，等价于基础分 */
  return 'base';
}

/**
 * 从 definition 回填各科公式。
 * 兼容：无 pointsType 视为 base；多规则时「高 priority 优先」，同 priority 内同科目以后出现的 then 为准。
 */
export function parseDefinitionToSegmentExprs(def: unknown): Record<PerformanceRuleScoreSegmentKey, string> {
  const out = emptySegmentExprs();
  const rules = normalizeRulesList((def as any)?.rules).sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  for (const r of rules) {
    const latestInRule: Partial<Record<PerformanceRuleScoreSegmentKey, string>> = {};
    for (const act of normalizeThenList(r)) {
      if (!isEmitPostingAction(act)) continue;
      const pt = normalizePointsType(act as any);
      if (pt === null) continue;
      latestInRule[pt] = extractAmountExpr((act as any).amount);
    }
    for (const key of PERFORMANCE_RULE_SCORE_SEGMENT_KEYS) {
      const v = latestInRule[key];
      if (v !== undefined && v !== '' && !out[key]) out[key] = v;
    }
  }

  return out;
}

export function buildFormulaScoreDefinition(
  segments: Record<PerformanceRuleScoreSegmentKey, string>,
  systemVars: Array<{ code: string; sourcePath: string }>
): Record<string, unknown> {
  const variables = systemVars.map((v) => ({
    code: v.code,
    expr: { path: v.sourcePath }
  }));

  const then: any[] = [];

  for (const meta of PERFORMANCE_RULE_SCORE_SEGMENTS) {
    const expr = String(segments[meta.pointsType] ?? '').trim();
    if (!expr) continue;
    const subject = meta.useCoAssigneeRefMany
      ? { refMany: 'task.coAssigneeIds' }
      : { ref: 'task.mainAssigneeId' };
    then.push({
      type: 'emitPosting',
      subject,
      pointsType: meta.pointsType,
      amount: { fn: 'formula', args: [expr] },
      reasonCode: `FORMULA_${meta.pointsType.toUpperCase()}`
    });
  }

  return {
    params: {},
    variables,
    rules: [
      {
        id: 'formula_score_rule',
        name: '公式计算积分（多科目）',
        priority: 100,
        when: { op: 'gt', left: { path: 'task.mainAssigneeId' }, right: 0 },
        then
      }
    ]
  };
}
