/* eslint-disable no-await-in-loop */
/* eslint-disable no-use-before-define */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
import { formatDateTime } from '@/utils/common/date-util';
import { replaceAddressString } from './string-util';

/**
 * 处理文件信息到formData
 * @param {String} defineKey 定义Key，注意一个表单里面的Key不要出现重复
 * @param {FormData} formData 表单对象
 * @param {Array|Object} fileData 文件对象
 */
const handleFormDataSingleImage = async (defineKey, formData, fileData) => {
  if (fileData) {
    let _fileData = fileData;
    if (fileData && fileData.length) {
      _fileData = fileData[0];
    }
    await handleChangedFileError(_fileData);
    formData.append(`${defineKey}_file_raw`, _fileData?.raw);
    formData.append(`${defineKey}_file_name`, _fileData?.name);
  }
};

/**
 * 处理文件集信息（多个单图）到formData
 * @param {String} formDataAndKey 文件对象和定义数组，注意一个表单里面的Key不要出现重复
 * @param {FormData} formData 表单对象
 */
const handleFormDataMultiImage = async (formDataAndKey, formData) => {
  // let i = 0;
  // for (let item of fileData) {
  //     await handleChangedFileError(item);
  //     formData.append(defineKey + '_file_raw_' + i, item.raw);
  //     formData.append(defineKey + '_file_name_' + i, item.name);
  //     i++;
  // }

  for (const item of formDataAndKey) {
    // eslint-disable-next-line no-await-in-loop
    await handleFormDataSingleImage(item.defineKey, formData, item.fileData);
  }
};

/**
 * 处理文件集信息（图片集/附件集）到formData
 * @param {String} defineKey 定义Key，注意一个表单里面的Key不要出现重复
 * @param {FormData} formData 表单对象
 * @param {Array} fileData 文件对象
 */
const handleFormDataGroupFiles = async (defineKey, formData, fileData) => {
  let i = 0;
  for (const item of fileData) {
    await handleChangedFileError(item);
    formData.append(`${defineKey}_file_raw_${i}`, item?.raw);
    formData.append(`${defineKey}_file_name_${i}`, item?.name);
    // eslint-disable-next-line no-plusplus
    i++;
  }
};

/**
 * 检测并提示选择的文件被更改
 * @param {File} file
 */
async function handleChangedFileError(file) {
  if (file.status === 'ready' && file.raw) {
    await file.raw
      .arrayBuffer() // try to read
      .then(() => {
        return Promise.resolve();
      })
      .catch((err) => {
        let errMessage = '选择的文件有误，请尝试重新选择文件！';
        if (
          err &&
          err.toString().indexOf('file or directory could not be found') !== -1
        ) {
          errMessage = '检测到选择的文件或所在文件夹被更改，请重新选择文件！';
        } else if (
          err &&
          err.toString().indexOf('file could not be read') !== -1
        ) {
          errMessage = '检测到选择的文件发生变更，请重新选择文件！';
        }
        ElMessage({
          message: errMessage,
          type: 'error',
          // duration: 0,
          showClose: true,
        });
        return Promise.reject(err);
      });
  }
}

/**
 * 处理数据库返回的附件集类型为ZcUpload支持类型
 * @param {*} originalArray 原数组
 * @param {*} otherObj 需组装的额外对象
 * @returns
 */
const handleDataBaseFileListToZcUpload = (originalArray, otherObj) => {
  return originalArray.map((item) => {
    return {
      name: item.attachmentName,
      size: item.fileSize,
      url: item.fileFullPath,
      fileExists: item.fileExists,
      operateInfo: {
        userName: item.createUserName,
        time: formatDateTime(item.createTime),
      },
      attDid: item.id,
      attId: item.attachmentSetID,
      ...otherObj,
    };
  });
};

/**
 * 格式化文件大小显示
 * @param {number} fileSize 文件大小
 */
export function formatSizeDisplay(fileSize) {
  if (fileSize < 1024) {
    return `${fileSize}B`;
  }
  if (fileSize >= 1024 && fileSize < 1024 * 1024) {
    return `${Math.round((fileSize / 1024) * 100) / 100}KB`;
  }
  if (fileSize >= 1024 * 1024 && fileSize < 1024 * 1024 * 1024) {
    return `${Math.round((fileSize / 1024 / 1024) * 100) / 100}MB`;
  }
  if (fileSize >= 1024 * 1024 * 1024 * 1024) {
    return `${Math.round((fileSize / 1024 / 1024 / 1024) * 100) / 100}GB`;
  }
  return '0B';
}

/**
 * 获取文件名后缀
 * @param {string} fileName 文件名
 */
export function getFileExtension(fileName) {
  return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
}

/**
 * 获取文件名去掉文件的后缀
 * @param {string} fileName 文件名
 */
export function getFileName(fileName) {
  return fileName.replace(fileName.substring(fileName.lastIndexOf('.')), '');
}

/**
 * 根据文件名得到缩略图项的类名
 * @param {string} fileName 文件名
 */
export function getAttachmentItemClass(fileName) {
  const fileExtension = getFileExtension(fileName);
  let result = 'file-other';
  switch (fileExtension) {
    case '.doc':
    case '.docx':
      result = 'file-word';
      break;
    case '.xls':
    case '.xlsx':
      result = 'file-excel';
      break;
    case '.ppt':
    case '.pptx':
      result = 'file-ppt';
      break;
    case '.txt':
      result = 'file-txt';
      break;
    case '.pdf':
      result = 'file-pdf';
      break;
    case '.rar':
      result = 'file-rar';
      break;
    case '.zip':
      result = 'file-zip';
      break;
    case '.jpg':
    case '.jpeg':
    case '.tif':
    case '.tiff':
    case '.png':
    case '.gif':
    case '.bmp':
    case '.webp':
    case '.wmf':
    case '.raw':
    case '.dif':
    case '.cdr':
    case '.psd':
    case '.eps':
    case '.tga':
    case '.pcd':
    case '.pcp':
    case '.mpt':
    case '.iff':
      result = 'file-img';
      break;
    case '.avi':
    case '.rm':
    case '.rmvb':
    case '.wmv':
    case '.mov':
    case '.flv':
    case '.mpg':
    case '.mpe':
    case '.mpeg':
    case '.vob':
    case '.asf':
    case '.divx':
    case '.dat':
    case '.ahd':
    case '.3gp':
    case '.mkv':
    case '.mp4':
      result = 'file-video';
      break;
    default:
      result = 'file-other';
      break;
  }
  return result;
}

/**
 * 处理上传文件的URL
 *
 * @param {Array} formList - 表单列表，包含文件信息和其它表单字段
 * @param {Object} paramMap - 参数映射对象，用于替换文件上传URL中的占位符
 * @returns {void} 无返回值
 */
export const handleUploadUrl = (formList, paramMap) => {
  const uploadList = formList.filter(
    (f) => f.type === 'UploadFile' || f.type === 'UploadImage',
  );
  console.log('uploadList :>> ', uploadList);
  // console.log('uploadList :>> ', uploadList);
  uploadList.forEach((item) => {
    item.props.value.forEach((form) => {
      form.url = replaceAddressString(
        form.url,
        import.meta.env.VITE_API_URL,
        import.meta.env.VITE_OFFICE_URL,
      );
    });
    const curUpload = paramMap[item.id];
    if (curUpload) {
      curUpload.forEach((info) => {
        info.url = replaceAddressString(
          info.url,
          import.meta.env.VITE_API_URL,
          import.meta.env.VITE_OFFICE_URL,
        );
      });
    }
  });
};

export default {
  handleChangedFileError,
  handleFormDataSingleImage,
  handleFormDataMultiImage,
  handleFormDataGroupFiles,
  handleDataBaseFileListToZcUpload,
};
