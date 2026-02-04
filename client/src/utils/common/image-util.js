import FileUtil from './file-util';
import ImageCompressor from './image-compressor';

/**
 * 从File压缩
 * @param {File} file 文件对象
 * @param {Object} options 配置
 * @returns {Promise} 异步
 */
const compressFromFile = (file, options) => {
  return new Promise((resolve, reject) => {
    FileUtil.fileToBase64(file)
      .then((base64Obj) => {
        if (base64Obj.size <= options.size || options.sizeScale === 1) {
          return base64Obj;
        }
        return new ImageCompressor(options).compress(base64Obj.src);
      })
      .then((blob) => {
        // 如果返回Blob类型，则说明经过了压缩
        if (Object.prototype.toString.call(blob) === '[object Blob]') {
          return FileUtil.blobToBase64(blob);
        }
        return blob;
      })
      .then((base64Obj) => {
        resolve(base64Obj);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

/**
 * base64转为文件
 * @param url base64的url
 * @param filename 文件名
 */
const dataURLtoFile = (url, filename) => {
  const arr = url.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n) {
    n -= 1;
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export { compressFromFile, dataURLtoFile };
