import http from '@/apis/index';

/**
 * 任务关联因子接口定义 (基于 OpenAPI 原始字段)
 * 对应接口: /member/factorconnect/select
 */
export interface TaskFactorRelation {
  pOrderFactorId: number; // 原 id/factorId
  factorType: string;
  factorName: string;
  refValue: string;
  measureUnit: string; // 原 unit
  refType: string;
  refScore: number; // 原 score
  // 注意：OpenAPI文档的select接口返回示例中未包含 actualScore，如后端实际有返回，可在此补充
}

/**
 * 获取任务分类树
 * Path: /member/factorconnect/gettree
 */
export function getTaskTree(): Promise<any> {
  return http({
    url: '/member/factorconnect/gettree',
    method: 'get',
  });
}

/**
 * 获取任务已关联的因子列表
 * Path: /member/factorconnect/getfactor
 * 改动：移除前端字段映射逻辑，直接返回后端原始数据
 */
export function getTaskAssociatedFactors(typeCode: string): Promise<any> {
  return http({
    url: '/member/factorconnect/getfactor',
    method: 'get',
    params: { typeCode },
  });
}

/**
 * 绑定因子到任务
 * Path: /member/factorconnect/connect
 */
export function bindFactorsToTask(data: {
  typeCode: string;
  factorIds: (string | number)[];
}): Promise<any> {
  const { typeCode, factorIds } = data;

  return http({
    url: '/member/factorconnect/connect',
    method: 'post',
    data: {
      typeCode,
      // OpenAPI Example显示为数组 [111, 222]，保持数组格式提交
      pOrderFactorIdList: factorIds,
    },
  });
}

/**
 * 移除关联 (支持批量)
 * Path: /member/factorconnect/remove
 */
export function unbindFactors(data: {
  typeCode: string;
  factorIds: (string | number)[];
}): Promise<any> {
  return http({
    url: '/member/factorconnect/remove',
    method: 'post',
    data: {
      typeCode: data.typeCode,
      // OpenAPI 定义参数名为 pOrderFactorId
      pOrderFactorIdList: data.factorIds,
    },
  });
}

/**
 * 保存/更新实际工分
 * Path: /member/factorconnect/save
 */
export function saveActualScores(data: {
  typeCode: string;
  updateData: { pOrderFactorId: number; actualScore: number }[];
}): Promise<any> {
  return http({
    url: '/member/factorconnect/save',
    method: 'post',
    data,
  });
}

export interface FactorQueryParams {
  typeCode: string;
  factorType?: string;
  factorName?: string;
  pageNum: number;
  pageSize: number;
  sortType: string;
  sortField: string;
}

/**
 * 获取因子管理列表（供选择弹窗使用）
 * 注：提供的OpenAPI文档中未包含此接口，保持原有调用方式
 */
export function getFactorConfigListForSelect(
  data: FactorQueryParams,
): Promise<any> {
  return http({
    url: '/member/factorconnect/selectfactorlist',
    method: 'post',
    data,
  });
}
