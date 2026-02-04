import request from '@/apis/index';

// 查询供电单位2
export function getOrgInfoList2(params: any): any {
  return request({
    url: '/emss-cmc-authdata-subdomain/member/mgtOrg/getAllSubMgtOrgTreeByOrgCode',
    method: 'get',
    params,
  });
}

// 查询审批人员包含下级
export function getsubUserByCondition(params: any): PromiseLike<any> {
  return request({
    url: '/emss-cmc-authdata-subdomain/member/userInfo/getSubUserByCondition',
    method: 'get',
    params,
  });
}
// 查询审批人员不包含下级
export function getsubUserByCurrentOrgs(data: any): PromiseLike<any> {
  return request({
    url: '/emss-cmc-authdata-subdomain/member/userInfo/getUserByCurrentOrgs',
    method: 'post',
    data,
  });
}
/// /查询审批人员包含下级,多个部门
export function getUserByOrgs(data: any): PromiseLike<any> {
  return request({
    url: '/emss-cmc-authdata-subdomain/member/userInfo/getUserByOrgs',
    method: 'post',
    data,
  });
}

// 查询用户信息
export function eccAndGpcInfoSearch(data: any): PromiseLike<any> {
  return request({
    url: '/emss-custmgtf-custmgtsrv-front/member/eccAndGpcInfo/eccAndGpcInfoSearch',
    method: 'post',
    data,
  });
}
// 查询核算包编号
export function chooseBilgUnit(data: any): PromiseLike<any> {
  return request({
    url: '/emss-bilgsetlf-qtychargchkcalcsrv-front//member/billingUnitAC/chooseBilgUnit',
    method: 'post',
    data,
  });
}
// 查询抄表包
export function queryZjMeterReadingUnit(data: any): PromiseLike<any> {
  return request({
    url: '/emss-bilgsetlf-qtychargchkcalcsrv-front//member/zjMeterReading/queryZjMeterReadingUnit',
    method: 'post',
    data,
  });
}

// 营销2.0下载文件
export function streamDownloadGetFileByGet(params: any): PromiseLike<any> {
  return request({
    url: '/emss-flc-filemcrsrv-subdomain/member/streamDownload/getFileByGet',
    method: 'get',
    params,
    responseType: 'blob',
  });
}

// 营销2.0导出

export function excelDownload(data: any): PromiseLike<any> {
  data.extraHeader = {
    oneLineMerge: {
      displayContent: '',
    },
  };
  data.requestMethod = 'post';
  data.fileType = 'xlsx';
  return request({
    url: '/emss-flc-filehandle-subdomain/member/fileHandle/excelDownload',
    method: 'post',
    data,
    responseType: 'blob',
  });
}
