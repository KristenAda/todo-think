const fileToBase64 = async (url) => {
  try {
    // 1. 请求public下的Excel文件（fetch默认返回Response对象）
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`请求失败：${response.status}`);
    }

    // 2. 将响应转为Blob对象
    const blob = await response.blob();

    // 3. 将Blob转为Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // reader.result 就是Base64字符串
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(blob); // 以DataURL格式读取（即Base64）
    });
  } catch (error) {
    ElMessage.error(`文件读取失败：${error.message}`);
    return '';
  }
};

/**
 * 下载Base64格式的Excel文件
 */
export const downloadExcelByBase64 = async (url,fileName) => {
  // 注意：public下的文件路径直接写相对路径（无需加public）
//   const excelUrl = '/template.xlsx'; // 对应public/template.xlsx
//   const fileName = '模板文件.xlsx'; // 下载后的文件名

  // 1. 转为Base64
  const base64Str = await fileToBase64(url,fileName);
  if (!base64Str) return;

  // 2. 从Base64创建下载链接并下载
  const link = document.createElement('a');
  link.href = base64Str;
  link.download = fileName; // 设置下载文件名
  document.body.appendChild(link);
  link.click(); // 模拟点击下载

  // 3. 清理资源
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href); // 释放Base64 URL资源
  ElMessage.success('Excel文件下载成功！');
};