import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosRequestConfig, // 使用通用类型，兼容性最好
} from 'axios';
import { ElMessage } from 'element-plus';

// 1. 定义通用返回接口
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

/**
 * 生成唯一的 Key
 */
function getPendingKey(config: AxiosRequestConfig) {
  // 确保 method 和 url 存在，若不存在给个默认值
  return [config.method || 'GET', config.url || ''].join('&');
}

/**
 * 添加请求到队列
 */
function addPending(config: AxiosRequestConfig) {
  removePending(config);
  const url = getPendingKey(config);
  const controller = new AbortController();
  config.signal = controller.signal;
  pendingMap.set(url, controller);
}

/**
 * 移除请求
 */
function removePending(config: AxiosRequestConfig) {
  const url = getPendingKey(config);
  if (pendingMap.has(url)) {
    const controller = pendingMap.get(url);
    controller?.abort();
    pendingMap.delete(url);
  }
}

/**
 * 强行清空所有请求 (用于路由切换时)
 * 🔥 修复 ESLint 报错：只遍历 values，不再解构 [_, controller]
 */
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
    // 强制类型转换，避开版本差异导致的类型检查问题
    addPending(config);

    const token = localStorage.getItem('token');
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
    // 移除 pending
    removePending(config as AxiosRequestConfig);

    // 1. 成功 (Code === 200)
    if (data.code === 200) {
      return data.data;
    }

    // 2. 业务错误
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (!config.silent) {
      ElMessage.error(data.message || '业务逻辑异常');
    }

    // Reject 完整数据，让 catch 能拿到 code
    return Promise.reject(data);
  },
  (error) => {
    // 移除 pending
    if (error.config) {
      removePending(error.config as AxiosRequestConfig);
    }

    // 处理被取消的请求
    if (axios.isCancel(error)) {
      return new Promise(() => {}); // 中断链条
    }

    // 构造统一错误对象
    const errRes = {
      code: error.response?.status || 500,
      message: error.message || '网络连接异常',
      data: null,
    };

    // 处理 HTTP 状态码
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errRes.message = '登录状态已过期，请重新登录';
          localStorage.removeItem('token');
          // window.location.href = '/login';
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

// ==========================================
// 导出封装方法
// ==========================================

export default service;
