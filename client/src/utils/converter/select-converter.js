import { generateSorter } from '../common/sort-util';
import { generatePropertySelector, toObject } from './converter-util';

// 默认配置
const defaultOptions = {
  value: 'value',
  label: 'label',
  disabled: 'disabled',
};

/**
 * 转换
 * @param {Array} dataList 数据列表
 * @param {Object} options 配置
 * @param {String | Function} options.value 值字段或选择器
 * @param {String | Function} options.label 文本字段或选择器
 * @param {String | Function} options.disabled 禁用字段或选择器
 * @param {String | Function} options.sorter 排序字段或方法
 * @returns {Array}
 */
const convert = (dataList, options) => {
  const currentOptions = { ...defaultOptions, ...options };

  const valueSelector = generatePropertySelector(currentOptions.value);
  const labelSelector = generatePropertySelector(currentOptions.label);
  const disabledSelector = generatePropertySelector(currentOptions.disabled);

  // 排序
  // currentOptions.sorter &&
  //   (dataList = [...dataList].sort(generateSorter(currentOptions.sorter)));

  const sortedDataList = currentOptions.sorter
    ? [...dataList].sort(generateSorter(currentOptions.sorter))
    : dataList;

  // 转Object
  toObject(sortedDataList, valueSelector);

  return dataList.map((item) => {
    return {
      value: valueSelector(item),
      label: labelSelector(item),
      disabled: disabledSelector(item),
      item,
    };
  });
};

export default convert;
