import CryptoJS from 'crypto-js';

/**
 * des加密
 * @param str 需要加密的字符串
 * @returns 加密后字符串
 */
export const desEncrypt = (str: string): string => {
  const key: string = '20240731';
  const keyHex = CryptoJS.enc.Utf8.parse(key);
  const ivHex = CryptoJS.enc.Utf8.parse(key);
  const encrypted = CryptoJS.DES.encrypt(CryptoJS.enc.Utf8.parse(str), keyHex, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
};

/**
 * des加密
 * @param str 需要加密的字符串
 * @returns 加密后字符串
 */
export const desEncryptWithKey = (str: string, key: string): string => {
  // const key: string = '20240731';
  const isOpenDes = import.meta.env.VITE_OFFICE_DES_OPEN;
  if (isOpenDes === 'false') return str;

  const keyHex = CryptoJS.enc.Utf8.parse(key);
  const ivHex = CryptoJS.enc.Utf8.parse(key);
  // const encrypted = CryptoJS.DES.encrypt(CryptoJS.enc.Utf8.parse(str), keyHex, {
  //   iv: ivHex,
  //   mode: CryptoJS.mode.CBC,
  //   padding: CryptoJS.pad.Pkcs7,
  // });
  const encrypted = CryptoJS.DES.encrypt(str, keyHex, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 获取加密后的 Base64 编码字符串
  let base64Str = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

  // 进行字符替换，与 Java 代码保持一致
  base64Str = base64Str
    .replace(/\+/g, '_')
    .replace(/\//g, '*')
    .replace(/=/g, '-');
  // console.log('base64Str :>> ', base64Str);
  return base64Str;
  // return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
};

// 1. 密钥长度调整函数 (完全匹配Java逻辑)
function adjustToDesLength(input) {
  if (input.length === 16) return input;
  const output = new Uint8Array(16); // 默认填充0
  const copyLength = Math.min(input.length, 16);
  output.set(input.subarray(0, copyLength), 0); // 复制有效部分
  return output;
}

// 2. AES加密主函数
export const aesEncrypt = (plaintext: string) => {
  const baseKey = import.meta.env.VITE_AES_KEY;
  // 密钥处理（与Java完全一致）
  const keyBytes = adjustToDesLength(new TextEncoder().encode(baseKey));
  const key = CryptoJS.lib.WordArray.create(keyBytes.buffer, keyBytes.length);
  const iv = CryptoJS.lib.WordArray.create(keyBytes.buffer, keyBytes.length);

  // 执行加密（CBC模式 + PKCS7填充）
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 返回十六进制字符串
  return encrypted.ciphertext.toString().toUpperCase();
};

// 解密函数
export const aesDecrypt = (encryptedHex: string) => {
  const baseKey = import.meta.env.VITE_AES_KEY;

  // 1. 处理密钥（与加密逻辑完全一致）
  const keyBytes = adjustToDesLength(new TextEncoder().encode(baseKey));
  const key = CryptoJS.lib.WordArray.create(keyBytes.buffer);
  const iv = CryptoJS.lib.WordArray.create(keyBytes.buffer);
  // 2. 转换十六进制密文为CryptoJS格式
  const encryptedData = CryptoJS.enc.Hex.parse(encryptedHex);
  // 3. 执行解密
  const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedData }, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  // 4. 将解密结果转为UTF-8字符串
  return decrypted.toString(CryptoJS.enc.Utf8);
};
