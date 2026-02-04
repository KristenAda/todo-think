export const downLoadEchart = (echart: any) => {
  const imgData = echart.getDataURL({
    type: 'png', // 可以选择 'png', 'jpeg', 'jpg', 'svg'
    pixelRatio: 2, // 设置像素比
    backgroundColor: '#fff', // 设置背景颜色
  });
  return imgData;
};
