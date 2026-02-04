import { isEmpty } from 'lodash-es';

const storageName = 'expiredStorage';

/**
 * 设置本地存储项。如果存储项不存在，则创建一个新的存储项。如果存储项存在，则更新其值和过期时间。如果存储项存在但已过期，则删除该存储项。
 * @param {*} name 存储项的名称。
 * @param {*} value 存储项的值。
 * @param {*} expires 存储项的过期时间（以秒为单位）。如果未指定，则默认为一年（31536000秒）。
 */
export const setItem = (name, value, expires) => {
  const storages = {};
  storages[name] = {
    value,
    expires: storages[name]?.expires || +new Date() + 31536000000,
  };

  if (!storages[name]) {
    if (isEmpty(expires)) {
      storages[name].expires = +new Date() + 31536000000;
    } else {
      storages[name].expires = expires * 1000 + +new Date();
    }
  }
  localStorage.setItem(storageName, JSON.stringify(storages));
};

/**
 * 获取本地存储项的值。如果存储项不存在或已过期，则返回null。
 * @param {*} name 存储项的名称。
 * @returns
 */
export const getItem = (name) => {
  const baseStorage = localStorage.getItem(storageName);
  if (!baseStorage) {
    return null;
  }
  const storages = JSON.parse(localStorage.getItem(storageName));
  try {
    if (!storages[name]) {
      return null;
    }
    if (+new Date() > storages[name].expires) {
      // 存在但过期
      this.remove(name);
      return null;
    }
    return storages[name].value;
  } catch (error) {
    console.log(
      '[ControlStorage] the error message: get field failed\n',
      error,
    );
    return null;
  }
};

/**
 * 删除本地存储项。如果存储项不存在，则不执行任何操作。
 * @param {*} name 存储项的名称。
 * @returns
 */
export const removeItem = (name) => {
  const baseStorage = localStorage.getItem(storageName);
  if (!baseStorage) {
    return;
  }
  const storages = JSON.parse(localStorage.getItem(storageName));
  try {
    delete storages[name];
    if (JSON.stringify(storages) === '{}') {
      // 缓存字段为空对象时，删除该字段
      localStorage.removeItem(storageName);
      return;
    }
    baseStorage.setItem(storages);
  } catch (error) {
    console.log(
      '[ControlStorage] the error message: remove field failed\n',
      error,
    );
  }
};

/**
 * 清空本地存储。
 */
export const clearItem = () => {
  localStorage.removeItem(storageName);
};
