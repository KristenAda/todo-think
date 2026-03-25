import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";

// 从环境变量读取密钥，未配置时使用默认值（仅开发环境兜底）
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-fallback-secret-please-set-env";

if (!process.env.JWT_SECRET) {
  console.warn("[Auth] 警告: JWT_SECRET 未配置环境变量，当前使用默认密钥，生产环境必须设置！");
}

export class AuthUtil {
  /**
   * 对明文密码做 SHA-256，与前端保持一致
   * 后台管理员设置密码时，需要先 SHA-256 再 bcrypt，确保用户登录时能正常比对
   */
  static sha256(plain: string): string {
    return createHash("sha256").update(plain).digest("hex");
  }

  // 密码加密：对已经 SHA-256 的哈希值做 bcrypt
  static hashPassword(pwd: string) {
    return bcrypt.hashSync(pwd, 10);
  }

  // 密码比对（前端传来的是 SHA-256 哈希值，与 bcrypt 存储值比对）
  static comparePassword(raw: string, hashed: string) {
    return bcrypt.compareSync(raw, hashed);
  }

  // 生成 Token，有效期 24 小时
  static signToken(payload: object) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  }

  // 获取密钥（供 koa-jwt 中间件使用）
  static getSecret() {
    return JWT_SECRET;
  }
}
