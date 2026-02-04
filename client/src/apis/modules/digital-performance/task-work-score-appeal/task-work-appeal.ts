import http from '@/apis/index';
/** 获取任务工分申诉数据 */
export const getAppeal = (data: any): Promise<Api.Http.BaseResponse> => {
  return http({
    url: '/member/factorlog/select',
    method: 'post',
    data,
  });
};
