import { createEnum } from '../utils/create-enum';

/**
 * 是/否
 */
export enum IsOrNot {
  是 = 1,
  否 = 0,
}

/**
 * 未启用/已启用
 */
export enum EnabledState {
  未启用 = 1,
  已启用 = 2,
}

/**
 * 已停用/启用中
 */
export enum EnabledOtherState {
  启用中 = 1,
  已停用 = 2,
}

/**
 * 已使用/未使用
 */
export enum UsedState {
  未使用 = 1,
  使用中 = 2,
}

/**
 * 性别
 */
export enum Gender {
  不限 = 0,
  男 = 1,
  女 = 2,
}

/**
 * 用户状态
 */
export enum UserStatus {
  已注销 = 0,
  正常 = 1,
  已锁定 = 2,
}

/**
 * 绑定状态
 */
export enum BindStatus {
  未绑定 = 0,
  已绑定 = 1,
}

/**
 * 教育层次
 */
export enum EducationLevel {
  本科 = 1,
  专科 = 2,
}

/**
 * 弹窗提示类型
 */
export enum TipType {
  滚动提示 = 1,
  弹窗提示 = 2,
}

/**
 * 因子类型
 */
export const FactorType = createEnum({
  距离: 'DISTANCE',
  超期: 'OVERDUE',
  地域: 'REGION',
  时段: 'TIME_PERIOD',
  工序: 'PROCESS',
});
