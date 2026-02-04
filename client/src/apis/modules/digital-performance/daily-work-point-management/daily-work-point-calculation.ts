import http from '@/apis/index';

export interface DayWorkScoreQueryParams {
  mgtOrgCode: string; // 单位编码
  checkYmd: string; // 核算日期
  pageNum: number;
  pageSize: number;
}
// 日工分核算查询
export const orderPersonScoreQueryDayWorkScore = (
  data: DayWorkScoreQueryParams,
): any => {
  return http({
    url: '/member/orderPersonScore/queryDayWorkScore', // 修正路径
    method: 'post', // 修正为 POST
    data, // POST 请求使用 data
    timeout: 2000,
  });
};
export interface DayWorkScoreFailDetailParams {
  mgtOrgCode: string;
  checkYmd: string;
}
// 日工分核算失败人数明细查询
export const orderPersonScoreQueryDayWorkScoreFailDetail = (
  data: DayWorkScoreFailDetailParams,
): any => {
  return http({
    url: '/member/orderPersonScore/queryDayWorkScoreFailDetail', // 修正路径
    method: 'post', // 修正为 POST
    data, // POST 请求使用 data
    timeout: 2000,
  });
};
export interface ScheduledTaskConfAddParams {
  excuteTime: string; // 执行时间
}
// 配置执行时间
export const scheduledTaskConfAddScheduledTaskConf = (
  data: ScheduledTaskConfAddParams,
): any => {
  return http({
    url: '/member/scheduledTaskConf/addScheduledTaskConf', // 修正路径
    method: 'post', // 修正为 POST
    data, // POST 请求使用 data
    timeout: 2000,
  });
};
