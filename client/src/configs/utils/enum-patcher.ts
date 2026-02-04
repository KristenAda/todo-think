/**
 * 批量为枚举激活“双向映射”能力
 * @param enums 需要处理的枚举对象列表
 */
export function enableEnumMapping(...enums: any[]) {
  enums.forEach((enumObj) => {
    Object.keys(enumObj).forEach((key) => {
      const value = enumObj[key];
      // 仅当 Value 是字符串，且 Key 不存在时，才进行反向注入
      if (typeof value === 'string' && !enumObj[value]) {
        // 核心黑魔法：强行注入反向键值对
        Object.defineProperty(enumObj, value, {
          value: key,
          enumerable: false, // 设置为不可枚举，防止遍历时出现重复数据
          writable: true,
        });
      }
    });
  });
}
