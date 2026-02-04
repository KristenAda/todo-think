import http from '@/apis/index';

export interface DayWorkScoreTeamRankingQueryParams {
  mgtOrgCode: string; // 单位编码
  checkYmd: string; // 核算日期
  teamtypeCode: string; // 班组类型编码
  pageSize: number; // 每页条数
}
// 班组日工分排名查询
export const queryDayWorkScoreTeamRanking = (
  data: DayWorkScoreTeamRankingQueryParams,
): any => {
  return http({
    url: '/member/orderPersonScore/queryDayWorkScoreTeamRanking', // 修正路径
    method: 'post', // 修正为 POST
    data, // POST 请求使用 data
    timeout: 2000,
  });
};
export interface DayWorkScorePersonRankingQueryParams {
  mgtOrgCode: string; // 单位编码
  checkYmd: string; // 核算日期
  teamtypeCode: string; // 班组类型编码
  pageSize: number; // 每页条数
  empName: string; // 员工姓名
}
// 员工日工分排名查询
export const queryDayWorkScorePersonRanking = (
  data: DayWorkScorePersonRankingQueryParams,
): any => {
  return http({
    url: '/member/orderPersonScore/queryDayWorkScorePersonRanking', // 修正路径
    method: 'post', // 修正为 POST
    data, // POST 请求使用 data
    timeout: 2000,
  });
};
