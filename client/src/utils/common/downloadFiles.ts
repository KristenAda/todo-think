export default function downloadFiles(blob: any, fileName: any) {
  // 其他主流浏览器走这里，利用a 标签的download属性下载
  let binaryData = [];
  binaryData.push(blob);
  const url = window.URL.createObjectURL(
    new Blob(binaryData, { type: 'application/vnd.ms-excel' }),
  );
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
}
