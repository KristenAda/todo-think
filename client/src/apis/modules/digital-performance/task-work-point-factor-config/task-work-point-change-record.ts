import http from '@/apis/index';

/** 历史记录查询参数 (对接 OpenAPI) */
export interface HistoryLogQueryParams {
  pageNum: number;
  pageSize: number;
  logType: any; // 对应后端 selectModule
  createUserName?: string; // 对应后端修改人
  beginTime?: string; // 对应后端起始时间
  endTime?: string; // 对应后端结束时间
  sortType: string; // 排序类型
  sortField: string; // 排序字段
}

/** 历史记录实体 (对接 OpenAPI 返回的 records 结构) */
export interface HistoryLogVO {
  changeBefore: string; // 修改前
  changeAfter: string; // 修改后
  createUserName: string; // 修改人
  createTime: string; // 修改时间
}

/** 获取历史调整记录列表 */
export const getHistoryLogList = (data: HistoryLogQueryParams): any => {
  return http({
    url: '/member/factorlog/select', // 修正路径
    method: 'post', // 修正为 POST
    data, // POST 请求使用 data
  });
};
