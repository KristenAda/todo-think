import http from '@/apis/index';

//营销2.0导出
export function excelDownload(data: any): PromiseLike<any> {
  data.excelHeader.extraHeader = {
    oneLineMerge: {
      displayContent: '',
    },
  };
  data.url = data.excelHeader.url;
  data.params = data.excelHeader.params;
  delete data.excelHeader.url;
  delete data.excelHeader.params;
  data.requestMethod = 'post';
  data.fileType = 'xlsx';
  data.fileName = 'excel';
  return http({
    url: '/emss-flc-filehandle-subdomain/member/fileHandle/excelDownload',
    method: 'post',
    data,
    responseType: 'blob',
  });
}
