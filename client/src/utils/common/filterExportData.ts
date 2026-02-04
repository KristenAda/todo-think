// 筛选导出数据内容
interface HeardersData {
  type?: string;
  label?: string;
  prop?: string;
}
export default function filterExportData(heardersData: HeardersData[]) {
  const columnsList = heardersData
    .filter((item) => {
      return item.label !== '操作' && item.label && item.prop;
    })
    .map((item) => ({
      fieldDispName: item.label,
      fieldName: item.prop,
    }));

  return columnsList;
}
