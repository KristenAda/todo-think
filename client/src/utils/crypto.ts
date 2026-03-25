import CryptoJS from 'crypto-js';

/**
 * 对密码做 SHA-256 哈希
 * 用于登录/注册前的传输加密，避免明文密码在网络中传输
 * 后端接收到的是哈希值，再做 bcrypt 存储
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}
