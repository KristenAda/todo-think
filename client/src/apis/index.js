import useAxiosAbortStore from '@/stores/base/axios-abort';

import axios from 'axios';
import { useAuthorityStore } from '@/stores/authority';
import queryString from 'query-string';
import {
  handleHttpError,
  handleRequestData,
  handleRequestHeaders,
  logRequest,
  logRequestAndResponse,
  object2FormData,
} from './utils/request-util';

const useAuthority = useAuthorityStore();
const localEnvList = ['locala', 'development'];
const isLocalEnv = localEnvList.includes(import.meta.env.MODE); // 环境判断true=本地
const baseUrl = isLocalEnv
  ? import.meta.env.VITE_API_URL
  : useAuthority.baseUrl?.baseApiUrl;
// 创建实例
const axiosInstance = axios.create({
  baseURL: baseUrl, // 基础请求地址
  timeout: 20000, // 请求超时时间
  retry: 1, // 请求失败重试次数
  retryDelay: 500, // 重试延迟时间
});

/**
 * 请求拦截器
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    // 添加取消请求控制器，便于在适当时机取消请求

    const abortController = new AbortController();
    config.signal = abortController.signal;
    useAxiosAbortStore().addController(abortController);
    handleRequestHeaders(config.headers, config).catch((err) => {
      // 打印（失败）请求日志
      logRequest(config);

      throw err;
    });
    // 添加自定义内容
    config.custom = {
      requestTime: new Date(),
    };

    axiosInstance.interceptors.request.customConfig = config.customConfig;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
/**
 *  响应拦截器
 *
 * */
axiosInstance.interceptors.response.use(
  (response) => {
    // 输出响应日志
    logRequestAndResponse(response);
    if (response.data.code === 202040 || response.data.code === 102010) {
      window.location.replace('/');
      return Promise.reject(response);
    }
    // @ts-ignore
    if (response.config.download) {
      return response;
    }
    if (response.data.code === 200 || response.data.code === '00000') {
      return response.data;
    }
    if (response.data.code === '500' || response.data.code === 500) {
      ElMessage.error(response.data.message);
      return Promise.reject(response.data);
    }
    if (response.status === 200) {
      // 下载文件
      return response;
    }
    if (response.data.msg === '成功') return response.data;

    return handleRequestData(response.data);
  },
  async (error) => {
    if (error?.code === 'ERR_CANCELED') {
      return new Promise(() => {});
    }
    if (error.config) {
      logRequestAndResponse(error);
    }
    const { config } = error;
    // If config does not exist or the retry option is not set, reject
    if (!config || !config.retry) return Promise.reject(error);

    // Set the variable for keeping track of the retry count
    // eslint-disable-next-line no-underscore-dangle
    config.__retryCount = config.__retryCount || 0;

    // Check if we've maxed out the total number of retries
    // eslint-disable-next-line no-underscore-dangle
    if (config.__retryCount >= config.retry) {
      // Reject with the error
      return Promise.reject(error);
    }

    // Increase the retry count
    // eslint-disable-next-line no-underscore-dangle
    config.__retryCount += 1;
    // 反馈的错误码是602的，就当正常操作处理，由接口自行处理
    // if (error.response.status === HttpStatusCode.BusinessExceptionNeedDeal) {
    //   // 输出响应日志
    //   logRequestAndResponse(error.response);
    //   return handleRequestData(error.response.data);
    // }

    if (axios.isCancel(error)) {
      // 对axios进行封装，设置 request 和 response 的处理操作
      return new Promise(() => {});
    }

    // 处理Http错误

    if (error.response) {
      const responseResult = await handleHttpError(
        error.response.status,
        error.response.data,
        error.response,
        axiosInstance,
      );
      if (responseResult === true) {
        // 已处理异常，则中断Promise链接
        return new Promise(() => {});
      }
      if (responseResult === false) {
        // 未处理异常，则交由外部处理
        return Promise.reject(error);
      }
      return Promise.resolve(responseResult);
    }
    // 未处理异常，则交由外部处理
    return Promise.reject(error);
  },
);

/**
 * Get
 * @param {string} url
 * @param {Object} [params]
 * @param {Object} [config]
 * @returns {Promise<AxiosResponse<any>>}
 */
axiosInstance.get = (url, params, config) => {
  const axiosConfig = { ...config, method: 'get' };
  if (params) {
    axiosConfig.originData = params;
    axiosConfig.params = params;
    axiosConfig.paramsSerializer = (paramsForSerializer) => {
      return queryString.stringify(paramsForSerializer);
    };
  }

  return axiosInstance.request(url, axiosConfig);
};

/**
 * Json格式的Post（application/json）
 * @param {string} url
 * @param {Object} [data]
 * @param {Object} [config]
 * @returns {Promise<AxiosResponse<any>>}
 */
axiosInstance.postJson = (url, data, config = {}) => {
  const mergeConfig = {
    ...config,
    headers: {
      // 展开用户传入的 headers (如果有)
      ...(config.headers || {}),
      // 强制指定 Content-Type (放在后面以确保覆盖)
      'Content-Type': 'application/json;charset=UTF-8',
    },
  };

  // 使用 axios 自带的 .post 方法，更简洁
  // 注意：这里只需传 mergeConfig，不需要再塞 data 进去，axios.post 第二个参数就是 data
  return axiosInstance.post(url, data, mergeConfig);
};

/**
 * 预设参数的通用Post（application/x-www-form-urlencoded）
 * @param {string} url
 * @param {Object} [data]
 * @param {Object} [config]
 * @returns {Promise<AxiosResponse<any>>}
 */
axiosInstance.postPreset = (url, data, config) => {
  const axiosConfig = { ...config, method: 'post' };
  if (data) {
    axiosConfig.originData = data;
    axiosConfig.data = queryString.stringify(data);
  }

  return axiosInstance.request(url, axiosConfig);
};

/**
 * 带文件的Post（multipart/form-data）
 * @param {string} url
 * @param {FormData} [data]
 * @param {Object} [config]
 * @returns {Promise<AxiosResponse<any>>}
 */
axiosInstance.postWithFile = (url, data, config) => {
  const axiosConfig = { ...config, method: 'post' };
  if (data) {
    axiosConfig.originData = data;
    axiosConfig.data = object2FormData(data);
  }

  return axiosInstance.request(url, axiosConfig);
};

export default axiosInstance;
