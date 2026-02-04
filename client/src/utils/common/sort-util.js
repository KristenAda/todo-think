/**
 * 生成排序对象
 * @param {String | Object} option 配置
 * @returns
 */
const generateSortObj = (option) => {
  const type = Object.prototype.toString.call(option);
  if (type === '[object String]') {
    return {
      sortKey: option,
      sortType: 'asc',
    };
  }
  if (type === '[object Object]') {
    return {
      sortKey: option.sortKey,
      sortType: option.sortType,
    };
  }
  throw new Error(
    'not support sort obj, must be a string or like { sortKey: "key", sortType: "asc/desc" }',
  );
};

/**
 * 递归排序
 * @param {Object} o1 对象1
 * @param {Object} o2 对象2
 * @param {Array} sortArr 排序数组
 * @param {Number} sortIdx 排序序号
 * @returns
 */
const recursionSort = (o1, o2, sortArr, sortIdx = 0) => {
  const lastSort = sortIdx === sortArr.length - 1;
  const { sortKey } = sortArr[sortIdx];
  const { sortType } = sortArr[sortIdx];

  if (o1[sortKey] > o2[sortKey]) {
    return sortType === 'asc' ? 1 : -1;
  }
  if (o1[sortKey] < o2[sortKey]) {
    return sortType === 'asc' ? -1 : 1;
  }
  return lastSort ? 0 : recursionSort(o1, o2, sortArr, sortIdx + 1);
};

/**
 * 生成排序方法
 * @param {String | Object | Array | Function} options 配置
 * @returns {Function}
 */
const generateSorter = (options) => {
  const type = Object.prototype.toString.call(options);
  if (type === '[object Function]') {
    return options;
  }

  let sortArr;
  if (type === '[object Array]') {
    sortArr = options.map((val) => generateSortObj(val));
  } else {
    sortArr = [generateSortObj(options)];
  }
  return (o1, o2) => recursionSort(o1, o2, sortArr);
};

export { generateSorter };
