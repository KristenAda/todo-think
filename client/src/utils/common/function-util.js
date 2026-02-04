/**
 * 处理功能逻辑关系
 * @param {Array} functionList
 * @returns {Array}
 */
const integrate = (functionList) => {
  const functionObj = {};
  const retList = [];

  functionList.forEach((func) => {
    const item = func;
    item.Children = [];
    functionObj[item.id] = item;
  });

  functionList.forEach((func) => {
    const item = func;

    const parent = functionObj[item.parentId];
    if (parent) {
      item.Parent = parent;
      parent.Children.push(item);
    }
  });

  functionList.forEach((func) => {
    const item = func;
    if (!item.Parent) {
      retList.push(func);
    }
  });
  return retList;
};

export { integrate };
