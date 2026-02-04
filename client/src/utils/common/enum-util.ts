/**
 * 判断字符串是否包含中文
 */
const hasChinese = (str: string): boolean => /[\u4e00-\u9fa5]/.test(str);

/**
 * 核心过滤器：判断是否为反向映射
 * 针对 createEnum 生成的双向对象：
 * 1. 保留 Value 为数字的项 (普通数值枚举)
 * 2. 保留 Key 含中文的项 (你的业务场景: 中文Label -> 英文Code)
 * 3. 剔除 Value 含中文的项 (这是反向映射: 英文Code -> 中文Label)
 * 4. 纯英文场景：如果 Key 是全大写且 Value 不是，视为反向映射并剔除 (猜测 Key 为 Code)
 */
const isValidEnumEntry = (key: string, value: string | number): boolean => {
  // 1. 过滤数值键（这是 TS 数字枚举自带的反向映射 key="0", value="Name"）
  if (!Number.isNaN(Number(key))) return false;

  // 2. 如果值是数字，说明是正向枚举 (Name -> 0)，保留
  if (typeof value === 'number') return true;

  // 3. 处理字符串枚举的双向映射
  if (typeof value === 'string') {
    // 场景 A: Key 是中文 (说明是 Label)，保留
    if (hasChinese(key)) return true;

    // 场景 B: Value 是中文 (说明这是由 createEnum 生成的反向映射 Code -> Label)，剔除
    if (hasChinese(value)) return false;

    // 场景 C: 纯英文 (例如 { Draft: 'DRAFT' })
    // 假设：通常 Code 是全大写 (DRAFT)，Label 是 TitleCase (Draft)
    // 如果 Key 是全大写，而 Value 不是，我们认为 Key 是 Code (反向映射)，剔除
    if (key === key.toUpperCase() && value !== value.toUpperCase()) {
      return false;
    }
  }

  // 默认保留
  return true;
};

/**
 * 获取枚举对象中每个名称的数组 (只返回 Label/Key)
 * @param enumObject 枚举对象
 */
export const getEnumNames = <T>(enumObject: T): (keyof T)[] => {
  return Object.entries(enumObject)
    .filter(([key, value]) => isValidEnumEntry(key, value as string | number))
    .map(([key]) => key as keyof T);
};

/**
 * 获取枚举对象中每个名称对应的值数组 (只返回 Code/Value)
 * @param enumObject 枚举对象
 */
export const getEnumValues = <T>(enumObject: T): T[keyof T][] => {
  return Object.entries(enumObject)
    .filter(([key, value]) => isValidEnumEntry(key, value as string | number))
    .map(([, value]) => value as T[keyof T]);
};

interface EnumEntry<T> {
  value: T[keyof T]; // 对应 Code
  name: keyof T; // 对应 Label (中文)
}

interface ElementUIEnumEntry<T> {
  value: T[keyof T];
  label: keyof T;
}

/**
 * 获取枚举对象中每个名称值对数组
 * @param enumObject 枚举对象
 * @returns [{ name: '城市核心区', value: 'URBAN_CORE' }, ...]
 */
export const getEnumEntries = <T>(enumObject: T): EnumEntry<T>[] => {
  return Object.entries(enumObject)
    .filter(([key, value]) => isValidEnumEntry(key, value as string | number))
    .map(([key, value]) => {
      return {
        value,
        name: key as keyof T,
      } as unknown as EnumEntry<T>;
    });
};

/**
 * 获取枚举对象中每个名称值对数组 (ElementUI特定使用)
 * @param enumObject 枚举对象
 * @returns [{ label: '城市核心区', value: 'URBAN_CORE' }, ...]
 */
export const getEnumEntriesForElementUI = <T>(
  enumObject: T,
): ElementUIEnumEntry<T>[] => {
  return getEnumEntries(enumObject).map((m) => {
    return {
      value: m.value,
      label: m.name,
    };
  });
};

interface DicCodeEntry<T> {
  code: T[keyof T];
  name: keyof T;
}

/**
 * 获取数据字典对象中每个名称和代码对数组
 * (同样应用过滤逻辑，防止传入双向枚举时出错)
 */
export const getDicCodeEntries = <T>(dicCodeObject: T): DicCodeEntry<T>[] => {
  return Object.entries(dicCodeObject)
    .filter(([key, value]) => isValidEnumEntry(key, value as string | number))
    .map(([key, value]) => {
      return {
        code: value as string, // 这里通常 Value 是 Code
        name: key as string, // Key 是 Label
      } as unknown as DicCodeEntry<T>;
    });
};
