import http from '@/apis/index';

export function getQualificationList(params: any): any {
  return http({
    url: '/persona/qualification/selectList',
    method: 'post',
    params,
    timeout: 2000,
  });
}

// 获取资质任务配置列表
export function getQualificationTaskConfigList(params: any): any {
  return http({
    url: '/member/qualification/taskQualifications',
    method: 'post',
    params,
    timeout: 2000,
  });
}

// deleteQualificationTaskConfig
export function deleteQualificationTaskConfig(params: any): any {
  return http({
    url: '/persona/qualificationTaskConfig/delete',
    method: 'post',
    params,
    timeout: 2000,
  });
}

// 保存资质任务配置
export function saveQualificationTaskConfig(params: any): any {
  return http({
    url: '/persona/qualificationTaskConfig/save',
    method: 'post',
    params,
    timeout: 2000,
  });
}
