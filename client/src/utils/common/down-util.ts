/**
 * 将在线/本地资源 URL 转换为 Base64
 * @param url - 文件的路径 (例如 '/template.xlsx')
 * @returns 返回 Base64 字符串
 */
export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    // 1. 获取文件资源
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');

    // 2. 转换为 Blob
    const blob = await response.blob();

    // 3. 使用 FileReader 转为 Base64
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('文件转换失败:', error);
    throw error;
  }
};

/**
 * 触发 Base64 字符串的下载
 * @param base64Data - Base64 字符串
 * @param fileName - 下载后的文件名
 */
export const downloadBase64File = (
  base64Data: string,
  fileName: string,
): void => {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = fileName;

  // 兼容 Firefox
  link.style.display = 'none';
  document.body.appendChild(link);

  link.click();

  // 清理 DOM
  document.body.removeChild(link);
};

/**
 * [主函数] 整合方法：获取 Public 文件 -> 转 Base64 -> 下载
 * @param filePath - public 下的相对路径，如 '/template.xlsx'
 * @param fileName - 导出的文件名
 */
export const downloadPublicFile = async (
  filePath: string,
  fileName: string,
): Promise<boolean> => {
  try {
    const base64 = await urlToBase64(filePath);
    downloadBase64File(base64, fileName);
    return true;
  } catch (err) {
    console.log('err :>> ', err);
    ElMessage.error('下载失败，请检查文件路径或网络');
    return false;
  }
};

/**
 * 将纯文本内容保存为 .txt 文件并触发下载
 * @param {string} content - 要写入 txt 的文本内容（这里是 Base64 字符串）
 * @param {string} fileName - 导出的文件名 (例如 'data.txt')
 */
export const downloadTextFile = (content, fileName) => {
  // 关键点：将字符串包装为 Blob，类型设置为 text/plain
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;

  // 触发点击
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // 清理内存和 DOM
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * [主函数] 获取 public 下的 Excel -> 转 Base64 -> 存入 TXT 下载
 * @param {string} filePath - public 下的 Excel 路径
 * @param {string} txtFileName - 最终下载的 txt 文件名
 */
export const downloadExcelAsBase64Txt = async (filePath, txtFileName) => {
  try {
    // 1. 获取 Excel 的 Base64 字符串
    const base64String = await urlToBase64(filePath);

    // 2. (可选) 如果你只想保留纯 Base64 码，去掉前缀 "data:application/xxx;base64,"
    // const rawBase64 = base64String.split(',')[1];

    // 3. 将 Base64 字符串写入 txt 并下载
    // 这里我们传入完整的 DataURL 字符串，如果只要纯码，传入上面的 rawBase64
    downloadTextFile(base64String, txtFileName);

    return true;
  } catch (error) {
    console.error('转换或下载失败:', error);
    ElMessage.error('下载失败，请检查文件路径或网络');
    return false;
  }
};

/**
 * 将 Base64 字符串转换为 Blob 对象
 * @param {string} dataurl - 完整的 Base64 字符串 (包含 data:application/xxx...)
 * @returns {Blob}
 */
export const base64ToBlob = (dataurl) => {
  try {
    // 1. 分割字符串，获取 MIME 类型和 Base64 数据
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1]; // 获取文件类型，如 application/vnd.openxmlformats...
    const bstr = atob(arr[1]); // 解码 Base64
    let n = bstr.length;
    const u8arr = new Uint8Array(n); // 创建 8 位无符号整数数组

    // 2. 将解码后的字符转换为 Unicode 编码并存入数组
    // eslint-disable-next-line no-plusplus
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    // 3. 生成 Blob
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error('Base64 转 Blob 失败:', e);
    throw e;
  }
};

// --- 3. [新增流程] Excel -> Base64 -> Blob -> 下载 ---
/**
 * 完整流程：获取 Excel -> 转 Base64 -> 转回 Blob -> 下载
 * @param {string} filePath - public 下的文件路径
 * @param {string} fileName - 最终下载的文件名
 */
export const downloadViaBase64ToBlob = async (filePath, fileName) => {
  try {
    console.log('1. 开始获取文件并转为 Base64...');
    const base64String = await urlToBase64(filePath);
    console.log('Base64 长度:', base64String.length);

    console.log('2. 将 Base64 还原为 Blob...');
    const blob = base64ToBlob(base64String);
    console.log('Blob 对象:', blob);

    console.log('3. 通过 Blob 触发下载...');
    // 创建 Blob URL
    const blobUrl = window.URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);

    link.click();

    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    return true;
  } catch (error) {
    console.error('流程执行失败:', error);
    ElMessage.error('下载出错');
    return false;
  }
};
