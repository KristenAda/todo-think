import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
// 引入中文语言包
dayjs.locale('zh-cn');
/* eslint-disable consistent-return */
/**
 * 转换为日期对象 - 转换失败则返回null
 * @param {string} input 时间对象值
 * @returns {Date} 日期
 */
// function parseDate(input) {
//   let dateStr;
//   let date;
//   const normalFormatter =
//     /\d{4}[/-]\d{1,2}[/-]\d{1,2}([T\s]\d{1,2}(:\d{1,2}(:\d{1,2})?)?)?/g;
//   if (normalFormatter.test(input)) {
//     dateStr = input.replace(normalFormatter, (matcher) => {
//       return matcher.replace(/-/g, '/').replace('T', ' ');
//     });
//     date = new Date(dateStr);
//     return !/Invalid|NaN/.test(date.toString()) ? date : null;
//   }

//   const specialFormatter = /\/Date\((\d{13})\)\//g;
//   if (specialFormatter.test(input)) {
//     dateStr = input.replace(specialFormatter, '$1');
//     date = new Date(parseInt(dateStr, 10));
//     return !/Invalid|NaN/.test(date.toString()) ? date : null;
//   }

//   date = new Date(input);
//   return !/Invalid|NaN/.test(date.toString()) ? date : null;
// }

/**
 * 检查是否日期对象，若是字符串则转换为日期对象并返回 - 不是则报错
 * @param {*} input 时间对象值
 * @returns {Date} 日期
 */
function checkDateObject(input) {
  if (typeof input === 'string') {
    const date = dayjs(input);
    if (!date || date.toString() === 'Invalid Date') {
      throw new TypeError(`"${input}" is not a date string`);
    }
    return date;
  }
  if (Object.prototype.toString.call(input) !== '[object Date]') {
    throw new TypeError(`"${input}" is not a date object`);
  }
  return dayjs(input);
}

/**
 * 获取指定日期 - 所在星期开始日期
 * @param {*} input 时间对象值
 * @returns {Date} 日期
 */
function getWeekBeginDate(input) {
  const date = checkDateObject(input);
  let day = date.getDay();
  if (day === 0) {
    day = 7;
  }

  date.setDate(date.getDate() + (1 - day));
  return date;
}

/**
 * 获取指定日期 - 所在星期结束日期
 * @param {*} input 时间对象值
 * @returns {Date} 日期
 */
function getWeekEndDate(input) {
  const date = checkDateObject(input);
  let day = date.getDay();
  if (day === 0) {
    day = 7;
  }
  date.setDate(date.getDate() + (7 - day));
  return date;
}

/**
 * 获取指定日期 - 所在月第一天
 * @param {*} input 时间对象值
 * @returns {Date} 日期
 */
function getMonthBeginDate(input) {
  const date = checkDateObject(input);
  date.setDate(1);
  return date;
}

/**
 * 获取指定日期 - 所在月最后一天
 * @param {*} input 时间对象值
 * @returns {Date} 日期
 */
function getMonthEndDate(input) {
  const date = checkDateObject(input);
  date.setDate(1);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return date;
}

/**
 * 获取指定日期 - 所在月天数
 * @param {*} input 时间对象值
 * @returns {Number} 天数
 */
function getMonthDays(input) {
  return getMonthEndDate(input).getDate();
}

/**
 * 格式化（yyyy-MM-dd HH:mm:ss）
 * @param {*} input 时间对象值
 * @returns {String} 日期字符串
 */
function formatDateTime(input) {
  const date = checkDateObject(input);
  return date.format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 格式化（yyyy-MM-dd hh:mm:ss） 12小时制
 * @param {*} input 时间对象值
 * @returns {String} 日期字符串
 */
function formatDateTime12(input) {
  const date = checkDateObject(input);
  return date.format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 格式化（yyyy-MM-dd）
 * @param {*} input 时间对象值
 * @returns {String} 日期字符串
 */
function formatDate(input) {
  const date = checkDateObject(input);
  return date.format('YYYY-MM-DD');
}

/**
 * 格式化（yyyy-MM-dd）
 * @param {*} input 时间对象值
 * @returns {String} 日期字符串
 */
function formatDateChinese(input) {
  const date = checkDateObject(input);
  return date.format('YYYY年MM月DD日');
}

/**
 * 格式化（yyyy-MM-dd HH）
 * @param {*} input 时间对象值
 * @returns {String} 日期字符串
 */
function formatDateTimeHour(input) {
  const date = checkDateObject(input);
  return date.format('YYYY-MM-DD HH:00:00');
}

/**
 * 格式化（yyyy-MM-dd HH:mm）
 * @param {*} input 时间对象值
 * @returns {String} 日期字符串
 */
function formatDateTimeMinute(input) {
  const date = checkDateObject(input);
  return date.format('YYYY-MM-DD HH:mm');
}

/**
 * 格式化（yyyy-MM-dd HH:mm:ss.SS）
 * @param {*} input 时间对象值
 * @returns {String} 日期字符串
 */
function formatDateTimeMili(input) {
  const date = checkDateObject(input);
  return date.format('YYYY-MM-DD HH:mm:ss.SS');
}

/**
 * 格式化（yyyy）
 * @param {*} input 时间对象值
 * @returns {String} 日期字符串
 */
function formatYear(input) {
  const date = checkDateObject(input);
  return date.format('YYYY');
}

/**
 * 格式化（yyyy-MM）
 * @param {*} input 时间对象值
 * @returns {String} 日期字符串
 */
function formatYearMonth(input) {
  const date = checkDateObject(input);
  return date.format('YYYY-MM');
}

/**
 * 格式化（自定义格式）
 * @param {*} input 时间对象值
 * @param {*} format 时间格式
 * @returns {String} 日期字符串
 */
function formatCustomDateTime(input, format) {
  const date = checkDateObject(input);
  return date.format(format);
}

/**
 * 快速选择标签列表
 */
const shortcutList = [
  {
    tag: 'all',
    text: '全部',
    value: () => {
      return [null, null];
    },
  },
  {
    tag: 'recentWeek',
    text: '近一周',
    value: () => {
      const start = new Date();
      const end = new Date();
      start.setDate(start.getDate() - 7);
      return [start, end];
    },
  },
  {
    tag: 'recentMonth',
    text: '近一个月',
    value: () => {
      const start = new Date();
      const end = new Date();
      start.setMonth(start.getMonth() - 1);
      return [start, end];
    },
  },

  {
    tag: 'recentThreeWeek',
    text: '近三周',
    value: () => {
      const start = new Date();
      const end = new Date();
      start.setDate(start.getDate() - 21);
      return [start, end];
    },
  },
  {
    tag: 'currentMonth',
    text: '当月',
    value: () => {
      const end = new Date();
      const fullYear = new Date().getFullYear();
      const mouth = new Date().getMonth();
      const start = new Date(fullYear, mouth, 1);
      return [start, end];
    },
  },

  {
    tag: 'recentThreeMonth',
    text: '近三月',
    value: () => {
      const end = new Date();
      const fullYear = new Date().getFullYear();
      const mouth = new Date().getMonth() - 2;
      const start = new Date(fullYear, mouth, 1);
      return [start, end];
    },
  },

  {
    tag: 'currentYear',
    text: '今年',
    value: () => {
      const end = new Date(new Date().getFullYear(), 11, 31);
      const start = new Date(new Date().getFullYear(), 0);
      return [start, end];
    },
  },
  {
    tag: 'lastYear',
    text: '去年',
    value: () => {
      const end = new Date(new Date().getFullYear() - 1, 11, 31);
      const start = new Date(new Date().getFullYear() - 1, 0);
      return [start, end];
    },
  },
];

/**
 * 自定义快捷选择标签
 * @param {*} tagList 需要返回的标签数组
 * @returns
 */
const shortcuts = (tagList) => {
  return shortcutList.filter((f) => tagList.some((s) => s === f.tag));
};

export {
  formatCustomDateTime,
  formatDate,
  formatDateChinese,
  formatDateTime,
  formatDateTime12,
  formatDateTimeHour,
  formatDateTimeMili,
  formatDateTimeMinute,
  formatYear,
  formatYearMonth,
  getMonthBeginDate,
  getMonthDays,
  getMonthEndDate,
  getWeekBeginDate,
  getWeekEndDate,
  shortcuts,
};
