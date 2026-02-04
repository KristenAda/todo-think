/**
 * 文件转Base64
 * @param {File} file 文件对象
 * @returns {Promise} 异步
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ src: this.result, size: file.size });
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsDataURL(file);
  });
};

/**
 * blob转Base64
 * @param {Blob} blob blob对象
 * @returns {Promise} 异步
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ src: this.result, size: blob.size });
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsDataURL(blob);
  });
};

export default {
  fileToBase64,
  blobToBase64,
};
