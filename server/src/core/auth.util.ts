import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "your-super-secret-key-change-it-in-prod"; // 秘钥，生产环境建议放 .env

export class AuthUtil {
  // 1. 密码加密 (注册时用)
  static hashPassword(pwd: string) {
    return bcrypt.hashSync(pwd, 10);
  }

  // 2. 密码比对 (登录时用)
  static comparePassword(raw: string, hashed: string) {
    return bcrypt.compareSync(raw, hashed);
  }

  // 3. 生成 Token
  static signToken(payload: any) {
    // 有效期 24 小时
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  }

  // 获取秘钥 (给中间件用)
  static getSecret() {
    return JWT_SECRET;
  }
}
