import regex from '@/utils/common/regex-util';
import { cLength } from '@/utils/common/string-util';
import { isEmpty } from 'lodash-es';

/**
 * 校验中文字符长度
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifyChineseCharacterLength = (rule, value, callback) => {
  if (!value) {
    callback();
    return;
  }
  const len = cLength(value);

  if (len > rule.clen || (rule.min && len < rule.min)) {
    callback(
      new Error(
        rule.message
          ? rule.message
          : `不能超过 ${rule.clen}个字符（${rule.clen / 2}个汉字）`,
      ),
    );
  } else {
    callback();
  }
};

/**
 * 校验字符长度
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifyCharacterLength = (rule, value, callback) => {
  if (!value) {
    callback();
    return;
  }
  const len = value.length;
  if (len > rule.clen || (rule.min && len < rule.min)) {
    callback(
      new Error(rule.message ? rule.message : `不能超过${rule.clen}个字符`),
    );
  } else {
    callback();
  }
};

/**
 * 校验数字大小
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifyNumberLength = (rule, value, callback) => {
  if (!value) {
    callback();
    return;
  }

  if (value < rule.min || value > rule.max) {
    callback(new Error(rule.message));
  } else {
    callback();
  }
};

/**
 * 校验手机号
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifyPhoneNumber = (rule, value, callback) => {
  if (isEmpty(value)) {
    callback();
  } else if (value < 0 || !regex.phone.test(value)) {
    callback(new Error(rule.message));
  } else {
    callback();
  }
};

/**
 * 校验手机号+座机号
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifyAllPhoneNumber = (rule, value, callback) => {
  if (isEmpty(value)) {
    callback();
  } else if (value < 0 || !regex.contactPhone.test(value)) {
    callback(new Error(rule.message));
  } else {
    callback();
  }
};

/**
 * 校验大于当前日期
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifyGreaterCurrentDate = (rule, value, callback) => {
  const nowDate = new Date();
  const curDate = new Date(value);

  if (nowDate < curDate) {
    callback(new Error(`必须早于当前日期`));
  } else {
    callback();
  }
};

/**
 * 校验排序号
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifySortNUM = (rule, value, callback) => {
  if (!value && value !== 0) {
    callback(new Error('请输入排序号'));
  } else if (
    Number(value) < 0 ||
    Number(value) > 999 ||
    !regex.integer.test(value)
  ) {
    callback(new Error('请输入有效的排序号，排序号（范围：0-999）'));
  } else {
    callback();
  }
};

/**
 * 校验排序号(菜单使用)
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifySortNUMForMenu = (rule, value, callback) => {
  if (!value && value !== 0) {
    callback(new Error('请输入排序号'));
  } else if (
    Number(value) <= 0 ||
    Number(value) > 9999 ||
    !regex.integer.test(value)
  ) {
    callback(new Error('排序号范围：1-9999'));
  } else {
    callback();
  }
};

/**
 * 校验输入内容仅包含字母和下划线
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifyLetterUnderline = (rule, value, callback) => {
  if (!value || (typeof value !== 'string' && typeof value !== 'number')) {
    callback(new Error('请输入有效的内容'));
  } else if (!/^[a-zA-Z_]*$/.test(value)) {
    callback(new Error('请输入仅包含字母和下划线的内容'));
  } else {
    callback();
  }
};
/**
 * 校验输入内容不能仅包含下划线
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const underscoresOnly = (rule, value, callback) => {
  if (!value || (typeof value !== 'string' && typeof value !== 'number')) {
    callback(new Error('请输入有效的内容'));
  } else if (!/^(?!_+$)[A-Za-z0-9_]+$/.test(value)) {
    callback(new Error('请输入不能仅包含下划线的内容'));
  } else {
    callback();
  }
};
/**
 * 校验输入内容不能仅连续两个及以上下划线
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const consecutiveUnderscores = (rule, value, callback) => {
  if (!value || (typeof value !== 'string' && typeof value !== 'number')) {
    callback(new Error('请输入有效的内容'));
  } else if (!/^(?!.*__)/.test(value)) {
    callback(new Error('请输入不能仅包含两个及以上连续下划线的内容'));
  } else {
    callback();
  }
};
/**
 * 校验输入内容是否为1-9999的整数
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const positiveInteger = (rule, value, callback) => {
  if (!value || (typeof value !== 'number' && typeof value !== 'string')) {
    callback(new Error('请输入有效的内容'));
  } else if (!/^[1-9]\d{0,3}$/.test(value)) {
    callback(new Error('请输入1-9999的整数'));
  } else {
    callback();
  }
};
/**
 * 校验正整数
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifyNumber = (rule, value, callback) => {
  if (isEmpty(value) || !regex.posInteger.test(value)) {
    callback(new Error(rule.message));
  } else {
    callback();
  }
};

/**
 * 校验两位小数的正数
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 * @returns
 */
const verifyTwoDecimalPosPlaces = (rule, value, callback) => {
  if (isEmpty(value) || !regex.twoDecimalPosPlaces.test(value)) {
    callback(new Error(rule.message));
  } else {
    callback();
  }
};

/**
 * linkUrl 验证
 * @param {*} rule  表单规则
 * @param {*} value 表单值
 * @param {*} callback  回调函数
 */
const verifyLinkUrl = (rule, value, callback) => {
  if (value && !regex.url.test(value)) {
    return callback(new Error('格式错误'));
  }
  return callback();
};

export {
  consecutiveUnderscores,
  positiveInteger,
  underscoresOnly,
  verifyCharacterLength,
  verifyChineseCharacterLength,
  verifyGreaterCurrentDate,
  verifyLetterUnderline,
  verifyLinkUrl,
  verifyNumber,
  verifyNumberLength,
  verifyPhoneNumber,
  verifySortNUM,
  verifyTwoDecimalPosPlaces,
  verifySortNUMForMenu,
  verifyAllPhoneNumber,
};
