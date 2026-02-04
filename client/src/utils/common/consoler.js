import { forIn } from 'lodash-es';

const enableEnv = true;
const enableApi = enableEnv && import.meta.env.VUE_APP_API_LOG === 'true';

// 无论如何都要输出的类型
const consoleTypes = ['warn', 'error'];

/**
 * 改变console方法
 * @param {Function} factory 工厂函数
 * @param {Boolean} enable 是否开启日志
 * @returns {Function}
 */
function changeConsole(factory, enable) {
  return (...args) => enable && factory(...args);
}

// 修改console
forIn(console, (value, key) => {
  if (Object.hasOwnProperty.call(console, key)) {
    const element = console[key];
    if (typeof element === 'function') {
      console[key] = consoleTypes.includes(key)
        ? element
        : changeConsole(element, enableEnv);
    }
  }
});

// 添加api日志
console.apiBegin = changeConsole(console.groupCollapsed, enableApi);
console.api = changeConsole(console.log, enableApi);
console.apiEnd = changeConsole(console.groupEnd, enableApi);
