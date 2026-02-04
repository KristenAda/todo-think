// region ----- 随机 -----

const LOWER_CASE_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const UPPER_CASE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';

/**
 * 随机
 * @param {string} range 随机范围
 * @param {number} length 随机长度
 * @returns {string} 随机字符串
 */
function random(range, length) {
  const stringArray = [];
  const rangeLength = range.length;
  for (let i = 0; i < length; i += 1) {
    stringArray.push(range[Math.floor(Math.random() * rangeLength)]);
  }
  return stringArray.join('');
}

/**
 * 随机数字或字母
 * @param {number} length 随机长度
 * @returns {string}
 */
const randomNumberOrLetter = (length) => {
  return random(LOWER_CASE_LETTERS + UPPER_CASE_LETTERS + NUMBERS, length);
};

/**
 * 随机数字
 * @param {number} length 随机长度
 * @returns {string}
 */
const randomNumber = (length) => {
  return random(NUMBERS, length);
};

/**
 * 随机字母
 * @param {number} length 随机长度
 * @returns {string}
 */
const randomLetter = (length) => {
  return random(LOWER_CASE_LETTERS + UPPER_CASE_LETTERS, length);
};

/**
 * 随机小写字母
 * @param {number} length 随机长度
 * @returns {string}
 */
const randomLowerLetter = (length) => {
  return random(LOWER_CASE_LETTERS, length);
};

/**
 * 随机大写字母
 * @param {number} length 随机长度
 * @returns {string}
 */
const randomUpperLetter = (length) => {
  return random(UPPER_CASE_LETTERS, length);
};

/**
 * 字符串的中文长度（1个中文算1个字符长度）
 * @param {string} str 字符串
 * @returns {Number}
 */
const cLength = (str) => {
  // return str.length;
  let len = 0;
  if (str) {
    for (let i = 0; i < str.length; i += 1) {
      if (str.charCodeAt(i) > 127 || str.charCodeAt(i) === 94) {
        len += 2;
      } else {
        len += 1;
      }
    }
  }
  return len;
};

/**
 * 替换\r\n|\n为<br/>
 * @param {string} str 字符串
 * @returns {string}
 */
const replaceCRLFToBR = (str) => {
  return (typeof str === 'string' ? str : String(str ?? '')).replace(
    /\r\n|\n/g,
    '<br/>',
  );
};

/**
 * 替换\r\n为\n
 * @param {*} str
 * @returns
 */
const replaceCRLF = (str) => {
  return (typeof str === 'string' ? str : String(str ?? '')).replace(
    /\r\n/g,
    '\n',
  );
};

/**
 * 计算百分比并保留两位小数
 * @param num1 被除数
 * @param num2 除数
 */
const percentage = (num1, num2) => {
  if (num1 === 0 || num2 === 0) {
    return '0.00%';
  }
  return `${(Math.round((num1 / num2) * 100 * 100) / 100).toFixed(2)}%`;
};

/**
 * 金额显示
 * @param {*} value
 * @returns
 */
const formatAmount = (value) => {
  // 传入值不是数字直接返回0
  if (!value) return '0.00';
  const values = value.toString().split('.');
  // 整数部分
  let integerNum = values[0];
  // 小数部分
  let decimalNum = values[1] ? values[1] : '00';
  decimalNum = decimalNum.length === 1 ? decimalNum + 0 : decimalNum;
  // 传入值小于1000不切割
  if (integerNum < 1000) {
    return `${integerNum}.${decimalNum}`;
  }
  const list = [];
  while (integerNum.length > 3) {
    // 倒序切割
    list.unshift(integerNum.slice(-3));
    integerNum = integerNum.slice(0, -3);
  }
  // 处理剩余长度
  list.unshift(integerNum);
  return `${list.join(',')}.${decimalNum}`;
};
// endregion

/**
 * 获取单元格宽度（中文2.1，其他1.1）
 * @param {*} value 单元格值
 * @returns
 */
const getCellWidth = (value) => {
  // 判断是否为null或undefined
  if (value == null) {
    return 10;
  }
  if (/.*[\u4e00-\u9fa5]+.*$/.test(value)) {
    // 中文的长度
    const chineseLength = value.match(/[\u4e00-\u9fa5]/g).length;
    // 其他不是中文的长度
    const otherLength = value.length - chineseLength;
    return chineseLength * 2.1 + otherLength * 1.1;
  }
  return value.toString().length * 1.1;
};

/**
 * 智能拼接域名（自动去重+规范化）
 * @param {string} originalPath 接口返回的路径（如 "/upload/xxx.ppt" ）
 * @param {string} domainA 一级域名（如 "https://cdn.example.com" ）
 * @param {string} domainB 二级域名（如 "https://proxy.example.net" ）
 * @returns {string} 完整URL
 */
export function buildSafeUrl(baseUrl, domainA, domainB = null) {
  if (!baseUrl?.length) {
    return baseUrl;
  }
  // 规范baseUrl格式（移除开头斜杠）
  // 1. 幂等性检测：若baseUrl已是完整URL，直接返回[6]()
  if (/^https?:\/\//i.test(baseUrl)) {
    return baseUrl;
  }

  // 2. 移除baseUrl开头的斜杠（避免重复拼接）
  const normalizedBaseUrl = baseUrl.startsWith('/')
    ? baseUrl.slice(1)
    : baseUrl;

  // 3. 拼接domainA和资源路径
  const urlWithDomainA = `${domainA}/${normalizedBaseUrl}`;

  // 4. 无domainB时直接返回
  if (!domainB) return urlWithDomainA;

  // 5. 处理domainB的furl参数（四种情况）
  const hasFurl = domainB.includes('furl=');
  const endsWithFurl = domainB.endsWith('furl=');

  if (endsWithFurl) {
    // 情况1：以furl=结尾
    return `${domainB}${urlWithDomainA}`;
  }
  if (hasFurl) {
    // 情况2：已存在furl参数
    const furlStart = domainB.indexOf('furl=') + 5;
    return `${domainB.slice(0, furlStart)}${urlWithDomainA}`;
  }
  if (domainB.includes('?')) {
    // 情况3：有其他查询参数
    return `${domainB}&furl=${urlWithDomainA}`;
  }
  // 情况4：无查询参数
  return `${domainB}?furl=${urlWithDomainA}`;
}

/**
 * 替换地址字符串中的特定部分
 *
 * @param address 地址字符串
 * @param apiUrl 需要替换的API地址部分
 * @param officeUrl 需要替换的办公地址部分
 * @returns 替换后的地址字符串
 */
export function replaceAddressString(address, apiUrl, officeUrl) {
  // 先检查地址中是否包含 http://192.168.0.105:8088/?furl=，如果包含则去掉
  if (!address?.length) return address;
  if (address.includes(officeUrl)) {
    address = address.replace(officeUrl, '');
  }
  // 再检查地址中是否包含 http://192.168.0.64:8264，如果包含则去掉
  if (address.includes(apiUrl)) {
    address = address.replace(apiUrl, '');
  }
  return address;
}

export {
  cLength,
  formatAmount,
  getCellWidth,
  percentage,
  randomLetter,
  randomLowerLetter,
  randomNumber,
  randomNumberOrLetter,
  randomUpperLetter,
  replaceCRLF,
  replaceCRLFToBR,
};
