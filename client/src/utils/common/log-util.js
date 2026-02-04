import log from 'loglevel';

/**
 * 设置日志级别
 */
const setLogLevel = () => {
  // 1. 确保获取到的值是合法的，loglevel 要求必须是 trace, debug, info, warn, error 之一
  const envLevel = import.meta.env.VITE_APP_LOG_LEVEL;
  const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];

  // 如果环境变量不在合法范围内，强制给一个 'info' 或 'debug'
  const finalLevel = validLevels.includes(envLevel?.toLowerCase())
    ? envLevel
    : 'info';

  log.setLevel(finalLevel);
};

/**
 * 替换console方法
 */
const replaceConsole = () => {
  // 只有在 loglevel 成功配置后，再挂载给 console
  window.console.log = log.info.bind(log);
  window.console.debug = log.debug.bind(log);
  window.console.info = log.info.bind(log);
  window.console.warn = log.warn.bind(log);
  window.console.error = log.error.bind(log);
};

/**
 * 初始化
 */
const init = () => {
  try {
    // 先设置级别，再替换方法
    setLogLevel();
    replaceConsole();
  } catch (e) {
    // 如果报错了，至少保证原生 console 还能用，不要去 replace 它
    console.error('Logger init failed:', e);
  }
};

export default init;
