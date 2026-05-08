/**
 * 将规则 definition.rules[].when 结构转为可读中文（预览用）
 */
/** 任务事实路径 → 中文（公式变量来源说明等可复用） */
export const TASK_FACT_PATH_LABEL_ZH: Record<string, string> = {
  'task.mainAssigneeId': '主负责人',
  'task.testerId': '验收人',
  'task.projectId': '所属项目',
  'task.actualHours': '实际工时',
  'task.estimatedHours': '预估工时',
  'task.baseScore': '基础积分',
  'task.complexity': '难度系数（档位映射值）',
  'task.complexityTier': '难度档位',
  'task.workDomain': '任务领域',
  'task.rejectCount': '验收打回次数',
  'task.testCaseBugCount': '测试用例缺陷数',
  'task.aheadDays': '提前完成天数',
  'task.delayHours': '延期小时数',
  'task.coAssigneeIds': '协作成员'
};

const OP_ZH: Record<string, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  eq: '=',
  ne: '≠'
};

function operandText(raw: unknown): string {
  if (raw === null || raw === undefined) return String(raw);
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  if (typeof raw === 'string') return `'${raw}'`;
  if (typeof raw === 'object' && raw !== null && 'path' in (raw as object)) {
    const p = String((raw as { path?: unknown }).path ?? '');
    const label = TASK_FACT_PATH_LABEL_ZH[p] ?? null;
    return label ? `${label}（${p}）` : p;
  }
  return JSON.stringify(raw);
}

function formatConditionInner(cond: unknown, depth: number): string {
  if (depth > 12 || cond == null) return '';
  if (typeof cond !== 'object') return String(cond);

  const o = cond as Record<string, unknown>;

  if (Array.isArray(o.all)) {
    const inner = (o.all as unknown[])
      .map((c) => formatConditionInner(c, depth + 1))
      .filter(Boolean);
    return inner.length ? `全部满足：${inner.join('；且 ')}` : '';
  }
  if (Array.isArray(o.any)) {
    const inner = (o.any as unknown[])
      .map((c) => formatConditionInner(c, depth + 1))
      .filter(Boolean);
    return inner.length ? `任一满足：${inner.join('；或 ')}` : '';
  }
  if ('not' in o && o.not != null) {
    const inner = formatConditionInner(o.not, depth + 1);
    return inner ? `不满足（${inner}）` : '';
  }

  const op = typeof o.op === 'string' ? o.op : '';
  if (op && ('left' in o || 'right' in o)) {
    const sym = OP_ZH[op] ?? op;
    const left = operandText(o.left);
    const right = operandText(o.right);
    return `${left} ${sym} ${right}`;
  }

  return '';
}

/** when 为空或未定义时，结算引擎视为始终命中 */
export function formatRuleWhenHuman(when: unknown): string {
  if (when === null || when === undefined) return '无条件（始终命中）';
  if (typeof when === 'object' && when !== null && Object.keys(when as object).length === 0) {
    return '无条件（始终命中）';
  }
  const readable = formatConditionInner(when, 0).trim();
  return readable || '（未能格式化为自然语言，请查看下方 JSON）';
}
