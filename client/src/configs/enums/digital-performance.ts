import { createEnum } from '../utils/create-enum';

export const ProcessStep = createEnum({
  数量: 'NUMBER',
});

/**
 * 时间单位枚举
 */
export const TimeUnit = createEnum({
  分钟: 'MINUTE',
  小时: 'HOUR',
  天: 'DAY',
});

/**
 * 区域类型
 */
export const RegionType = createEnum({
  // 城市区域
  城市核心区: 'URBAN_CORE',
  城市一般区: 'URBAN_GENERAL',
  城郊: 'SUBURBAN',

  // 城镇农村
  县城: 'COUNTY_TOWN',
  乡镇: 'TOWNSHIP',
  农村: 'RURAL',

  // 特殊/偏远地区
  偏远地区: 'REMOTE_AREA',
  偏远山区: 'REMOTE_MOUNTAIN',
  高原地区: 'PLATEAU',
  高寒地区: 'ALPINE',
  岛屿地区: 'ISLAND',
});

/** 业务类型枚举：对接后端 1, 2, 3 */
export const HistoryBusinessType = createEnum({
  因子管理: 'FACTOR_MANGE', // 因子管理
  工分标准管理: 'FACTOR_STD', // 工分标准管理
  任务因子绑定: 'FACTOR_CONNECT', // 任务因子绑定
});
