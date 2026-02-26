import { useAuthorityStore } from '@/stores/authority';
import { isLocal, isProd } from '@/utils/common/env-util';
import { closeLoading } from '@/utils/feedback/loading';
import { ElMessage, ElLoading } from 'element-plus';
import router from '@/routers';

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
    duration: 3000,
    showClose: true,
  });
};

/**
 * 使用Element处理Http错误 (适配 Todo-Think Result 类与 JWT 规范)
 * @param {number} statusCode 错误码 (HTTP状态码)
 * @param {object} responseData 响应内容 (后端返回的 JSON 结构)
 */
const handleHttpErrorWithEl = async (statusCode, responseData) => {
  // 隐藏加载中
  closeLoading();

  // 1. 处理 HTTP 层面错误 (拦截后端抛出的 401 未授权/Token过期)
  if (statusCode === 401) {
    curElMessage('登录已过期或无权限，请重新登录', 'error');
    const useAuthority = useAuthorityStore();
    useAuthority.clearAuthorityInfo(); // 清理本地缓存
    router.push('/login'); // 跳转到登录页
    ElLoading.service()?.close();
    return false;
  }

  // 2. 处理其他网络或服务器层面的异常
  if (statusCode !== 200 && statusCode !== 401) {
    curElMessage(`网络请求错误 (${statusCode})`, 'error');
    ElLoading.service()?.close();
    return false;
  }

  // 3. 处理业务层面错误 (对接后端的 Result.error)
  // 后端规范：成功响应 code 为 200，消息体为 message
  if (responseData && responseData.code !== 200) {
    curElMessage(responseData.message || '请求失败', 'error');
    // 统一处理自定义load加载中关闭
    ElLoading.service()?.close();
    return false;
  }

  return true;
};

/**
 * 处理Http错误
 */
const handleHttpError = (statusCode, responseData, response, request) => {
  return handleHttpErrorWithEl(statusCode, responseData, response, request);
};

/**
 * 处理请求头 (适配 JWT Bearer 规范)
 * @param {Object} headers 请求头
 * @param {Object} config 请求配置
 */
const handleRequestHeaders = async (headers, config) => {
  const useAuthority = useAuthorityStore();

  // 1. 本地开发环境处理 API 前缀
  if (isLocalEnv) {
    config.url = config.url?.replace(API_URL_PREFIX, '');
  }

  // 2. 处理 GET 请求缓存问题
  if (config.method === 'get') {
    headers['Cache-Control'] = 'no-cache';
    headers.Pragma = 'no-cache';
  }

  // 3. 注入标准 JWT Token
  if (useAuthority.authToken) {
    headers.Authorization = `Bearer ${useAuthority.authToken}`;
  }
};

/**
 * 处理请求数据 (已精简旧的加密逻辑，直接放行常规 JSON 与数组)
 *
 * @param data 请求数据
 * @returns 返回处理后的数据
 */
const handleRequestData = (data) => {
  // 当前为标准 JSON 传递，无需像旧系统一样做复杂的递归解密和过滤
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
    if (response.status === 200 && response.data?.code === 200) {
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
    console.log('响应结果:', response.data);
    console.groupEnd();
  } else {
    if (response.status === 200 && response.data?.code === 200) {
      logApiBegin(logUrl);
    } else {
      logApiBegin(`%c${logUrl} (${response.status})`, 'color: #fe3333');
    }
    logApi('请求方式:', config.method);
    logApi('请求头部:', config.headers);
    logApi('请求参数:', config.data ?? config.params);
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
