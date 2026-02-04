/**
 * 智能枚举构造器
 * 1. 保留原始 Key -> Value
 * 2. 自动注入 Value -> Key (反向映射)
 * 3. 保持 TypeScript 类型提示
 */
export function createEnum<T extends Record<string, string | number>>(
  definition: T,
) {
  const result: any = { ...definition };

  // 自动建立反向映射
  Object.keys(definition).forEach((key) => {
    const value = definition[key];
    // 避免覆盖已有的键，且只处理作为 Key 的 Value
    if (!result[value]) {
      result[value] = key;
    }
  });

  // 返回强类型的对象，同时断言它拥有任意字符串索引（消除 'no index signature' 报错）
  return result as Readonly<T> & { [key: string]: string };
}
