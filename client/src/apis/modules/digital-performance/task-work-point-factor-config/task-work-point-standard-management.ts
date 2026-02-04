import http from '@/apis/index';

/**
 * 工分标准配置相关接口
 */

// 业务树节点定义
export interface BusinessTreeNode {
  id?: string | number;
  label: string;
  isLeaf?: boolean; // 是否为末级任务节点
  children?: BusinessTreeNode[];
}

// 工分标准配置详情定义
export interface WorkPointConfig {
  typeCode: string | number; // 关联的业务子项ID
  baseScore: number; // 基准分
  leaderCoeff: number; // 负责人系数
  remark?: string; // 备注说明
}

// 统一返回结构
export interface ApiResponse<T> {
  code: number;
  data: T;
  msg: string;
}

/**
 * 获取特定业务子项（任务）的工分标准配置
 * @param typeCode 任务类型编码
 */
export function getWorkPointConfig(typeCode: string | number): any {
  return http({
    url: `/member/factorstd/select`,
    method: 'get',
    params: { typeCode },
  });
}

/**
 * 保存或更新工分标准配置
 * @param data 配置详情
 */
export function saveWorkPointConfig(data: WorkPointConfig): any {
  return http({
    url: '/member/factorstd/update',
    method: 'post',
    data,
  });
}

export const initWorkPointConfig = () => {
  return http.postJson('/member/factorstd/initialize');
};
