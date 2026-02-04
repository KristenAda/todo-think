import http from '@/apis/index';

/**
 * 因子管理相关接口 - 供电所全业务工单
 */

// 因子信息条目定义
export interface FactorItem {
  pOrderFactorId?: number; // 业务标识ID
  factorType: number | string; // 因子类型
  factorName: string; // 因子名称
  refValue?: string | number; // 参考数值
  measureUnit?: string; // 计量单位
  refScore: number; // 参考工分
  factorDesc?: string; // 说明
}

// 分页查询参数
export interface FactorQueryParams {
  orgNo: Array<string>; // 供电单位
  factorType?: number; // 因子类型
  factorName?: string; // 因子名称
  beginTime?: string; // 开始时间
  endTime?: string; // 结束时间
  pageNum: number;
  pageSize: number;
}

// 统一返回结构
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 查询因子管理信息
 * @param data 查询参数
 */
export function getFactorConfigList(
  data: FactorQueryParams,
): Promise<ApiResponse<any>> {
  return http({
    url: '/member/factormanage/select',
    method: 'post',
    data,
  });
}

/**
 * 因子管理新增接口
 * @param data 因子表单数据
 */
export function insertFactorConfig(data: FactorItem): any {
  return http({
    url: '/member/factormanage/insert',
    method: 'post',
    data,
  });
}

/**
 * 因子管理修改接口
 * @param data 因子表单数据
 */
export function updateFactorConfig(data: FactorItem): any {
  return http({
    url: '/member/factormanage/update',
    method: 'post',
    data,
  });
}

/**
 * 批量删除因子配置
 * @param data 包含因子id数组的对象
 */
export function deleteFactorConfig(data: {
  pOrderFactorIdList: number[];
}): any {
  return http({
    url: '/member/factormanage/delete',
    method: 'post',
    data,
  });
}
