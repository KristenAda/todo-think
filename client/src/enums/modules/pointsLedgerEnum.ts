/** 积分流水业务类型（与后端 PointsLedgerPageDto.bizType 一致） */
export const PointsLedgerBizTypeEnum = {
  TASK_SETTLEMENT: 'task_settlement',
  ADJUSTMENT: 'adjustment',
  REVERSAL: 'reversal',
  MANUAL: 'manual'
} as const;

export type PointsLedgerBizType =
  (typeof PointsLedgerBizTypeEnum)[keyof typeof PointsLedgerBizTypeEnum];

export const POINTS_LEDGER_BIZ_TYPE_OPTIONS: { label: string; value: PointsLedgerBizType }[] = [
  { label: '任务结算', value: PointsLedgerBizTypeEnum.TASK_SETTLEMENT },
  { label: '补差调整', value: PointsLedgerBizTypeEnum.ADJUSTMENT },
  { label: '冲正', value: PointsLedgerBizTypeEnum.REVERSAL },
  { label: '手工调账', value: PointsLedgerBizTypeEnum.MANUAL }
];

export function pointsLedgerBizTypeLabel(v?: string | null): string {
  if (!v) return '—';
  return POINTS_LEDGER_BIZ_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

/** 积分科目 / 计分项（展示用，未知类型仍显示原编码） */
const POINTS_TYPE_LABELS: Record<string, string> = {
  base: '基础分',
  quality: '质量分',
  timeliness: '时效分',
  bonus: '奖励分',
  collaboration: '协作分'
};

export function pointsLedgerPointsTypeLabel(v?: string | null): string {
  if (v == null || v === '') return '—';
  const k = String(v).trim();
  return POINTS_TYPE_LABELS[k] ?? k;
}
