/**
 * 简单配置预设 → 各科表达式（与 settlement 引擎一致：可用 min/max/abs/round，勿用 Math.min）
 */
import {
  RuleSimplePresetEnum,
  type PerformanceRuleScoreSegmentKey
} from '@/enums/modules/performanceRulesEnum';
import { TaskWorkDomainEnum } from '@/enums/modules/taskWorkDomainEnum';
import { emptySegmentExprs } from './ruleDefinitionSegments';

/** 与后端 Task.workDomain 一致 */
const WD_SW = TaskWorkDomainEnum.SOFTWARE_DEVELOPMENT;

/** 固定系数「标准五科」模板（无参数） */
const STANDARD_BUG_PENALTY = 5;
const STANDARD_REJECT_PENALTY = 5;
const STANDARD_AHEAD_BONUS = 2;
const STANDARD_DELAY_PENALTY = 5;
const STANDARD_NO_REJECT_BONUS = 5;
/** 协作：每位协作成员入账 baseScore × 该比例（与「均衡可调」常见默认量级一致） */
const STANDARD_COLLABORATION_RATIO = 0.15;

export interface BalancedSimpleParams {
  rejectPenalty: number;
  aheadBonusPerDay: number;
  delayPenaltyPerDay: number;
  /** 质量分扣分系数：软件开发=每条用例缺陷；其它领域=每次验收打回（与「基础分」中的打回扣分互斥） */
  bugPenaltyPer: number;
  /** 奖励分：无打回时加分；0 表示不写奖励科目 */
  noRejectBonus: number;
  /** >0 时写入协作科目：每人入账 baseScore * collaborationRatio */
  collaborationRatio: number;
}

export interface BaseOnlySimpleParams {
  useComplexity: boolean;
}

export interface HoursWeightedSimpleParams {
  ratePerHour: number;
  capHours: number;
}

export function defaultBalancedParams(): BalancedSimpleParams {
  return {
    rejectPenalty: 5,
    aheadBonusPerDay: 2,
    delayPenaltyPerDay: 5,
    bugPenaltyPer: 5,
    noRejectBonus: 5,
    collaborationRatio: 0
  };
}

export function defaultBaseOnlyParams(): BaseOnlySimpleParams {
  return { useComplexity: true };
}

export function defaultHoursWeightedParams(): HoursWeightedSimpleParams {
  return { ratePerHour: 2, capHours: 12 };
}

export function compileSimplePresetToSegmentExprs(
  preset: RuleSimplePresetEnum,
  balanced: BalancedSimpleParams,
  baseOnly: BaseOnlySimpleParams,
  hours: HoursWeightedSimpleParams
): Record<PerformanceRuleScoreSegmentKey, string> {
  const out = emptySegmentExprs();
  switch (preset) {
    case RuleSimplePresetEnum.STANDARD_SCORECARD: {
      out.base = `baseScore * complexity - (workDomain === '${WD_SW}' ? rejectCount * ${STANDARD_REJECT_PENALTY} : 0)`;
      out.quality = `(workDomain === '${WD_SW}' ? -testCaseBugCount * ${STANDARD_BUG_PENALTY} : -rejectCount * ${STANDARD_BUG_PENALTY})`;
      out.timeliness = `(aheadDays > 0 ? aheadDays * ${STANDARD_AHEAD_BONUS} : aheadDays * ${STANDARD_DELAY_PENALTY})`;
      out.bonus = `(rejectCount < 1 ? ${STANDARD_NO_REJECT_BONUS} : 0)`;
      out.collaboration = `baseScore * ${STANDARD_COLLABORATION_RATIO}`;
      break;
    }
    case RuleSimplePresetEnum.BALANCED: {
      out.base = `baseScore * complexity - (workDomain === '${WD_SW}' ? rejectCount * ${balanced.rejectPenalty} : 0)`;
      if (balanced.bugPenaltyPer > 0) {
        out.quality = `(workDomain === '${WD_SW}' ? -testCaseBugCount * ${balanced.bugPenaltyPer} : -rejectCount * ${balanced.bugPenaltyPer})`;
      }
      out.timeliness = `(aheadDays > 0 ? aheadDays * ${balanced.aheadBonusPerDay} : aheadDays * ${balanced.delayPenaltyPerDay})`;
      if (balanced.noRejectBonus > 0) {
        out.bonus = `(rejectCount < 1 ? ${balanced.noRejectBonus} : 0)`;
      }
      if (balanced.collaborationRatio > 0) {
        out.collaboration = `baseScore * ${balanced.collaborationRatio}`;
      }
      break;
    }
    case RuleSimplePresetEnum.BASE_ONLY: {
      out.base = baseOnly.useComplexity ? 'baseScore * complexity' : 'baseScore';
      break;
    }
    case RuleSimplePresetEnum.HOURS_WEIGHTED: {
      out.base = `min(actualHours, ${hours.capHours}) * ${hours.ratePerHour}`;
      out.quality = `(workDomain === '${WD_SW}' ? -testCaseBugCount * ${STANDARD_BUG_PENALTY} : -rejectCount * ${STANDARD_BUG_PENALTY})`;
      out.timeliness = `(aheadDays > 0 ? aheadDays * ${STANDARD_AHEAD_BONUS} : aheadDays * ${STANDARD_DELAY_PENALTY})`;
      out.bonus = `(rejectCount < 1 ? ${STANDARD_NO_REJECT_BONUS} : 0)`;
      out.collaboration = `baseScore * ${STANDARD_COLLABORATION_RATIO}`;
      break;
    }
    default:
      break;
  }
  return out;
}
