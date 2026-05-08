import { TASK_FACT_PATH_LABEL_ZH } from './ruleConditionDisplay';

/** 规则变量编码 → 中文名称兜底（与后端默认变量表一致，历史版本缺少 label 时使用） */
export const FALLBACK_RULE_VARIABLE_LABEL_BY_CODE: Record<string, string> = {
  baseScore: '基础积分',
  complexity: '难度系数',
  rejectCount: '验收打回次数',
  aheadDays: '提前完成天数',
  testCaseBugCount: '测试用例缺陷数'
};

/** 向业务用户说明「该变量在结算时从哪里取值」，避免直接甩路径 */
export function formatVariableSourceHint(sourcePath: string): string {
  const p = sourcePath.trim();
  if (!p) return '未配置数据路径';
  const zh = TASK_FACT_PATH_LABEL_ZH[p];
  if (zh) return `验收结算时从任务数据中读取「${zh}」`;
  return `验收结算时按任务快照路径取值（${p}）`;
}
