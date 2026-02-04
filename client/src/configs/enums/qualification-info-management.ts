import { createEnum } from '../utils/create-enum';

/**
 * 有效期单位
 */
export const ValidityPeriod = createEnum({
  年: 'year',
  月: 'month',
  日: 'day',
});
