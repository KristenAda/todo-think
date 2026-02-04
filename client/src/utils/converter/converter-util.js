/**
 * 转对象
 * @param {Array} source 源
 * @param {Function} keySelector 键选择器
 * @param {Function} valueSelector 值选择器。默认为元素本身
 * @returns {Object}
 */
const toObject = (source, keySelector, valueSelector = (value) => value) => {
  const object = {};
  for (const item of source) {
    object[keySelector(item)] = valueSelector(item);
  }
  return object;
};

/**
 * 生成属性选择器
 * @param {String | Function} source 源
 * @returns {Function}
 */
const generatePropertySelector = (source) => {
  const type = Object.prototype.toString.call(source);
  if (type === '[object String]') {
    return (data) => data[source];
  }
  if (type === '[object Function]') {
    return source;
  }
  return null;
};

export { generatePropertySelector, toObject };
