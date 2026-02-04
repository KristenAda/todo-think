import testFile from '/public/templateFile/test.txt';

const templateMap = {
  test: testFile,
};

/**
 *模版下载函数
 * @param {string} urlName - 模板名称/模板映射表中的键名，用于匹配对应的模板文件地址
 * @param {string} fileName - 下载出来的文件名 需要带扩展名
 */
export let templateDownload = async (urlName: string, fileName: string) => {
  try {
    // 读取txt内容
    const response = await fetch(templateMap[urlName]);
    const txtContent = await response.text();

    // base64转换为blob文件
    const binaryString = atob(txtContent);
    const len = binaryString.length;
    const uint8Array = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([uint8Array], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // 下载逻辑
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // 清理资源
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    alert('模板下载失败，请检查文件是否正确');
  }
};
