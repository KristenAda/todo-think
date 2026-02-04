import { generateSorter } from '@/utils/common/sort-util';
import { generatePropertySelector, toObject } from './converter-util';

// 默认配置
const defaultOptions = {
  value: 'value',
  pid: 'pid',
  label: 'label',
  disabled: 'disabled',
};

/**
 * 创建树对象
 * @param {Object} item 数据
 * @param {Function} idSelector id选择器
 * @param {Function} labelSelector 文本选择器
 * @param {Function} disabledSelector 禁用选择器
 * @returns
 */
const createTreeObject = (
  item,
  idSelector,
  labelSelector,
  disabledSelector,
) => {
  return {
    value: idSelector(item),
    label: labelSelector(item),
    children: [],
    disabled: disabledSelector(item),
    data: item,
  };
};

/**
 * 转换
 * @param {Array} dataList 数据列表
 * @param {Object} options 配置
 * @param {String | Function} options.value id字段或选择器
 * @param {String | Function} options.pid 父级id字段或选择器
 * @param {String | Function} options.label 文本字段或选择器
 * @param {String | Function} options.disabled 禁用字段或选择器
 * @param {String | Function} options.sorter 排序字段或方法
 * @returns {Array}
 */
const cascader = (dataList, options) => {
  const currentOptions = { ...defaultOptions, ...options };

  const idSelector = generatePropertySelector(currentOptions.value);
  const pidSelector = generatePropertySelector(currentOptions.pid);
  const labelSelector = generatePropertySelector(currentOptions.label);
  const disabledSelector = generatePropertySelector(currentOptions.disabled);

  // 排序
  // currentOptions.sorter && (dataList = [...dataList].sort(generateSorter(currentOptions.sorter)));

  const sortedDataList = currentOptions.sorter
    ? [...dataList].sort(generateSorter(currentOptions.sorter))
    : dataList;

  // 转Object
  const dataObject = toObject(sortedDataList, idSelector);

  const trees = {};
  const notTopTreeIds = [];

  return sortedDataList
    .map((item) => {
      const id = idSelector(item);

      // 构造Tree结构
      let tree = trees[id];
      if (!tree) {
        tree = createTreeObject(
          item,
          idSelector,
          labelSelector,
          disabledSelector,
        );
        trees[id] = tree;
      }

      // 查找父级节点
      const pid = pidSelector(item);
      if (pid) {
        const parentItem = dataObject[pid];
        // 如果找到，则把该节点加在父级节点的子节点中
        if (parentItem) {
          let parentTree = trees[pid];
          if (!parentTree) {
            parentTree = createTreeObject(
              parentItem,
              idSelector,
              labelSelector,
              disabledSelector,
            );
            trees[pid] = parentTree;
          }

          parentTree.children.push(tree);

          // 添加到非顶级节点中，方便后续筛选
          notTopTreeIds.push(id);
        }
      }

      return tree;
    })
    .filter((item) => notTopTreeIds.indexOf(item.value) === -1);
};

export default cascader;
