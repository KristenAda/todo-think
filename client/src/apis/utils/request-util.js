import { useAuthorityStore } from '@/stores/authority';
import { isLocal, isProd } from '@/utils/common/env-util';
import { closeLoading } from '@/utils/feedback/loading';
import CryptoJS from 'crypto-js';

import { ElLoading } from 'element-plus';

const useAuthority = useAuthorityStore();

const localEnvList = ['locala', 'development'];
const isLocalEnv = localEnvList.includes(import.meta.env.MODE); // 环境判断true=本地
const API_URL_PREFIX = import.meta.env.VITE_PROD_API_URL_PREFIX || ''; // 正式环境接口前缀
/**
 * 弹出消息提示框
 *
 * @param message 提示消息内容
 * @param type 消息类型，可选值为 'success'、'warning'、'info'、'error'
 */
const curElMessage = (message, type) => {
  ElMessage({
    message,
    type,
    duration: 0,
    showClose: true,
  });
};

/**
 * 使用Element处理Http错误
 * @param {number} statusCode 错误码
 * @param {string} statusText 错误描述
 * @param {object} responseData 响应内容
 */
const handleHttpErrorWithEl = async (statusCode, responseData) => {
  // 隐藏加载中
  closeLoading();
  switch (statusCode) {
    default:
      // 根据返回的msg判断是否需要提示
      if (responseData.msg && responseData.code !== '00000') {
        curElMessage(responseData.msg, 'error');
        // 统一处理自定义load加载中关闭
        ElLoading.service()?.close();
      }
      return false;
  }
};

/**
 * 处理Http错误
 * @param {number} statusCode 错误码
 * @param {string} statusText 错误描述
 * @param {object} responseData 响应内容
 */
const handleHttpError = (statusCode, responseData, response, request) => {
  return handleHttpErrorWithEl(statusCode, responseData, response, request);
};

/**
 * 处理请求头
 * @param {Object} headers 请求头
 * @param {Object} config 请求配置
 */
const handleRequestHeaders = async (headers, config) => {
  if (!isLocalEnv) {
    // 正式环境或测试环境需要加密
    if (config.method === 'get') {
      // get请求
      if (useAuthority.baseUrl?.encrypt) {
        // 判断是否需要加密
        headers.enc = 'true';
        if (!config.params) {
          // 判断是否有参数，没有则赋值为空对象
          config.params = {};
        }
        config.params = JSON.parse(
          window.EmssLib.dataEncrypt_CBC_New(
            JSON.stringify(config.params),
            true,
          ),
        );
        headers.signParams = JSON.stringify(config.params);
        delete config.params;
        config.data = config.params;
        console.log(config.data);
      }
      headers['Cache-Control'] = 'no-cache';
      headers.Pragma = 'no-cache';
    } else if (useAuthority.baseUrl?.encrypt) {
      headers.enc = 'true';
      if (config.data) {
        config.data = JSON.parse(
          window.EmssLib.dataEncrypt_CBC_New(JSON.stringify(config.data), true),
        );
      }
    }
  } else {
    config.url = config.url?.replace(API_URL_PREFIX, '');
  }
  headers.auth_token = useAuthority.authToken;
  if (useAuthority.loginInfo) {
    headers.userId = useAuthority.loginInfo.systemUserId;
    headers.userName = encodeURIComponent(useAuthority.loginInfo.userName);
    headers.userOrgId = useAuthority.loginInfo.orgNo;
  } else {
    headers.userId = '1';
    headers.userName = encodeURIComponent('张三');
    headers.userOrgId = '51101';
  }
};

/**
 * 解密数据
 *
 * @param item 待解密的对象
 */
const decryptData = (praItem) => {
  const item = praItem;
  const secretKey = import.meta.env.VITE_AES_KEY;
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const iv = CryptoJS.enc.Utf8.parse(secretKey);

  // 首先看对象里是否有encryptedFields
  const keyArray = Object.keys(item);
  if (keyArray.filter((x) => x === 'encryptedFields').length > 0) {
    const encryptedFieldArray = item.encryptedFields;
    // 遍历encryptedFieldArray
    encryptedFieldArray.forEach((field) => {
      // try catch
      try {
        const base64 = CryptoJS.enc.Base64.parse(item[field]);
        const src = CryptoJS.enc.Base64.stringify(base64);

        const decrypt = CryptoJS.AES.decrypt(src, key, {
          iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.ZeroPadding,
        });

        const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
        item[field] = decryptedStr.toString().trim();
      } catch (e) {
        console.error(e);
      }
    });
  }
};
/**
 * 处理请求数据
 *
 * @param data 请求数据，可以为数组或对象
 * @returns 无返回值
 */
const handleRequestData = (data) => {
  if (!data) {
    return null;
  }
  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (Array.isArray(item)) {
        handleRequestData(item); // 递归处理数组中的数组
      } else if (typeof item === 'object' && item !== null) {
        const keyArray = Object.keys(item);
        keyArray
          .filter((x) => x !== 'encryptedFields')
          .forEach((key) => {
            handleRequestData(item[key]); // 递归调用
          });
        // 处理对象中的值
        decryptData(item);
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    Object.values(data).forEach((value) => {
      if (Array.isArray(value)) {
        handleRequestData(value); // 递归处理对象中的数组
      } else if (typeof value === 'object' && value !== null) {
        handleRequestData(Object.values(value)); // 递归处理对象中的对象
      }
    });
  }

  return data;
};

// region 打印日志

// 是否允许打印api日志
const enableLogApi = !isProd && isLocal;

/**
 * 改变console方法
 * @param {Function} factory 工厂函数
 * @param {Boolean} enable 是否开启日志
 * @returns {Function}
 */
const changeConsole = (factory, enable) => {
  return (...args) => enable && factory(...args);
};

// 打印api日志方法
const logApiBegin = changeConsole(console.groupCollapsed, enableLogApi);
const logApi = changeConsole(console.log, enableLogApi);
const logApiEnd = changeConsole(console.groupEnd, enableLogApi);

/**
 * 打印请求日志
 * @param {Object} config axios请求配置
 */
const logRequest = (config) => {
  const logUrl = `请求地址: ${config.url}`;
  logApiBegin(`%c${logUrl} (failed)`, 'color: #fe3333');
  logApi('请求方式:', config.method);
  logApi(
    '请求头部:',
    config.headers
      ? { ...config.headers.common, ...config.headers[config.method] }
      : '',
  );
  logApi('请求参数:', config.originData ?? '');
  logApiEnd();
};

/**
 * 打印请求和响应日志
 * @param {Object} response axios响应
 */
const logRequestAndResponse = (response) => {
  // 如果响应中不包含配置，则不打印
  const { config } = response;
  if (!config) {
    return;
  }

  const logUrl = `请求地址: ${config.url}`;
  if (import.meta.env.MODE === 'locala' || import.meta.env.MODE === 'testing') {
    if (response.status === 200) {
      console.groupCollapsed(logUrl);
    } else {
      console.groupCollapsed(
        `%c${logUrl} (${response.status || 'failed'})`,
        'color: #fe3333',
      );
    }
    console.log('请求方式:', config.method);
    console.log('请求头部:', config.headers);
    console.log('请求参数:', config.data || config.params);
    console.log('响应头部:', response.headers);
    console.log('后端协调:', {
      请求地址: config.url,
      响应状态: response.status,
      请求头部: {
        sa: config.headers.sa,
      },
      请求参数: config.data || config.params,
      响应结果:
        response.status === 200
          ? {
              ...response.data,
              data: [],
            }
          : response.data,
    });
    console.log('响应结果:', response.data);
    console.groupEnd();
  } else {
    if (response.status === 200) {
      logApiBegin(logUrl);
    } else {
      logApiBegin(`%c${logUrl} (${response.status})`, 'color: #fe3333');
    }
    logApi('请求方式:', config.method);
    logApi('请求头部:', config.headers);
    logApi('请求参数:', config.data ?? config.params);
    logApi('响应头部:', response.headers);
    logApi('后端协调:', {
      请求地址: config.url,
      响应状态: response.status,
      请求头部: {
        sa: config.headers.sa,
      },
      请求参数: config.data || config.params,
      响应结果:
        response.status === 200
          ? {
              ...response.data,
              data: [],
            }
          : response.data,
    });
    logApi('响应结果:', response.data);
    logApiEnd();
  }
};

// endregion

/**
 * 对象转表单
 * @param {Object} data 对象
 * @returns {FormData} 表单
 */
const object2FormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

export {
  handleHttpError,
  handleRequestData,
  handleRequestHeaders,
  logRequest,
  logRequestAndResponse,
  object2FormData,
};
