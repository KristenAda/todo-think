/**
 * 通用正则表达式
 */
const regex = {
  /**
   * 邮箱
   */
  email: /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/,
  /**
   * 手机号
   */
  phone: /^1[3456789][0-9]{9}$/,

  /**
   * 座机+手机号
   */
  contactPhone: /^1[3-9]\d{9}$|^0\d{2,3}-\d{7,8}$/,

  /**
   * 身份证号
   */
  idCard:
    /^\d{6}((((((19|20)\d{2})(0[13-9]|1[012])(0[1-9]|[12]\d|30))|(((19|20)\d{2})(0[13578]|1[02])31)|((19|20)\d{2})02(0[1-9]|1\d|2[0-8])|((((19|20)([13579][26]|[2468][048]|0[48]))|(2000))0229))\d{3})|((((\d{2})(0[13-9]|1[012])(0[1-9]|[12]\d|30))|((\d{2})(0[13578]|1[02])31)|((\d{2})02(0[1-9]|1\d|2[0-8]))|(([13579][26]|[2468][048]|0[048])0229))\d{2}))(\d|X|x)$/,

  /**
   * 数字
   */
  number: /^-?\d*(\.\d*)?$/,
  /**
   * 整数
   */
  integer: /^(-?[1-9]\d*|0)$/,
  /**
   * 正整数
   */
  posInteger: /^([1-9]\d*|0)$/,
  /**
   * 负整数
   */
  negInteger: /^(-[1-9]\d*)$/,
  /**
   * 驾驶证
   */
  drivingLicensed:
    /^\d{6}((((((19|20)\d{2})(0[13-9]|1[012])(0[1-9]|[12]\d|30))|(((19|20)\d{2})(0[13578]|1[02])31)|((19|20)\d{2})02(0[1-9]|1\d|2[0-8])|((((19|20)([13579][26]|[2468][048]|0[48]))|(2000))0229))\d{3})|((((\d{2})(0[13-9]|1[012])(0[1-9]|[12]\d|30))|((\d{2})(0[13578]|1[02])31)|((\d{2})02(0[1-9]|1\d|2[0-8]))|(([13579][26]|[2468][048]|0[048])0229))\d{2}))(\d|X|x)$/,
  /**
   * 护照
   */
  passport:
    /(^[EeKkGgDdSsPpHh]\d{8}$)|(^(([Ee][a-fA-F])|([DdSsPp][Ee])|([Kk][Jj])|([Mm][Aa])|(1[45]))\d{7}$)/,
  /**
   * 士兵证
   */
  soldierId: /^[\u4E00-\u9FA5](字第)([0-9a-zA-Z]{4,8})(号?)$/,
  /**
   * 统一社会信用代码
   */
  uscc: /^([0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}|[1-9]\d{14})$/,

  /**
   * 数字或字母
   */
  numbersOrLetters: /^[A-Za-z0-9]*$/,

  /**
   * 英文名称
   */
  englishName: /^[A-Za-z0-9 .]*$/,

  /**
   * 两位小数的数
   */
  twoDecimalPlaces: /^\d+(\.\d{1,2})?$/,

  /**
   * 两位小数的正数
   */
  twoDecimalPosPlaces: /^(([0-9]+)|([0-9]+\.[0-9]{0,2}))$/,

  /** 不含中文和空格 */
  notCnAndBlank: /^(?!.*[\u4e00-\u9fa5\s]).*$/,

  /** 学期格式 */
  semester: /^\d{4}-\d{4}-[1-9]$/,

  /**
   * url地址
   */
  // url: /^((https?|ftp|file):\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  // eslint-disable-next-line no-useless-escape
  url: /^((https?|ftp|file):\/\/)?([\w-]+\.)+[\w-]+(\/[\w-.\/?%&=]*)?$/,

  httpDomain: /^(https?:\/\/)?([\w-]+\.)+[\w-]+$/,
};

/**
 * 浮点数正则表达式
 * @param {number} minDigit 最少小数位数
 * @param {number} maxDigit 最多小数位数
 * @param {string} type 浮点数类型（positive正数，negative负数，否则不限正负）
 * @returns {RegExp}
 */
const floatRegexp = (minDigit, maxDigit, type) => {
  if (
    (!regex.posInteger.test(minDigit) && minDigit !== 0) ||
    (!regex.posInteger.test(maxDigit) && maxDigit !== 0)
  ) {
    throw new Error('minDigit and maxDigit must be an positive integer or 0');
  }
  if (minDigit > maxDigit) {
    throw new Error('minDigit must be smaller than or equal to maxDigit');
  }

  // 正负符号
  // eslint-disable-next-line no-nested-ternary
  const symbol = type === 'negative' ? '-' : type === 'positive' ? '' : '-?';
  // 是否一定有小数
  const hasDigit = minDigit === 0 ? '?' : '';

  const regexp = `^${symbol}([1-9]\\d*|0)(\\.\\d{${minDigit},${maxDigit}})${hasDigit}$`;
  return new RegExp(regexp);
};

/**
 * 密码正则验证
 */
const passwordRegexp = () => {
  // 需要从配置读取
  // 密码在8位到20位之间，且同时包含特殊字符+字母+数字三种
  return /^(?=.*[a-z_])(?=.*\d)(?=.*[^a-z0-9_])[\S]{8,20}$/i;
};

export default regex;
export { floatRegexp, passwordRegexp };
