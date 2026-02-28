import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosRequestConfig,
} from 'axios';
import { ElMessage } from 'element-plus';
// 1. 引入权限 Store
import { useAuthorityStore } from '@/stores/authority';

export interface Result<T = any> {
  code: number;
  message: string;
  data: T;
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TIMEOUT = 20000;

// ==========================================
// 取消请求机制
// ==========================================
const pendingMap = new Map<string, AbortController>();

function getPendingKey(config: AxiosRequestConfig) {
  return [config.method || 'GET', config.url || ''].join('&');
}

function addPending(config: AxiosRequestConfig) {
  removePending(config);
  const url = getPendingKey(config);
  const controller = new AbortController();
  config.signal = controller.signal;
  pendingMap.set(url, controller);
}

function removePending(config: AxiosRequestConfig) {
  const url = getPendingKey(config);
  if (pendingMap.has(url)) {
    const controller = pendingMap.get(url);
    controller?.abort();
    pendingMap.delete(url);
  }
}

export function cancelAllRequest() {
  for (const controller of pendingMap.values()) {
    controller.abort();
  }
  pendingMap.clear();
}

// ==========================================
// Axios 实例
// ==========================================
const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

// ==========================================
// 请求拦截器
// ==========================================
service.interceptors.request.use(
  (config) => {
    addPending(config);

    // 2. 从 Pinia 动态获取 Token
    const authorityStore = useAuthorityStore();
    const token = authorityStore.authToken;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ==========================================
// 响应拦截器
// ==========================================
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { config, data } = response;
    removePending(config as AxiosRequestConfig);

    // 1. 成功 (Code === 200)
    if (data.code === 200) {
      return data.data; // 注意这里：你直接把 data.data return 出去了
    }

    // 2. 业务错误
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (!config.silent) {
      ElMessage.error(data.message || '业务逻辑异常');
    }

    return Promise.reject(data);
  },
  (error) => {
    if (error.config) {
      removePending(error.config as AxiosRequestConfig);
    }

    if (axios.isCancel(error)) {
      return new Promise(() => {});
    }

    const errRes = {
      code: error.response?.status || 500,
      message: error.message || '网络连接异常',
      data: null,
    };

    if (error.response) {
      const authorityStore = useAuthorityStore();
      switch (error.response.status) {
        case 401:
          errRes.message = '登录状态已过期，请重新登录';
          // 3. 调用 Pinia 的方法规范清理登录状态
          authorityStore.clearAuthorityInfo();
          window.location.href = '/login'; // 建议直接踢回登录页
          break;
        case 403:
          errRes.message = '拒绝访问 (无权限)';
          break;
        case 404:
          errRes.message = '请求接口不存在';
          break;
        case 500:
          errRes.message = '服务器内部错误';
          break;
        default:
          errRes.message = `请求失败: ${error.message}`;
          break;
      }
    }

    ElMessage.error(errRes.message);
    return Promise.reject(errRes);
  },
);

export default service;
