import dotenv from "dotenv";
import path from "path";

/**
 * Prisma 6 + prisma.config.ts 时 CLI 不再自动读 .env；此处统一加载。
 * 测试库迁移：npm run db:test:deploy（内部设置 PRISMA_ENV_FILE=.env.test）
 */
const root = process.cwd();
const raw = process.env.PRISMA_ENV_FILE?.trim();
const envPath = raw
  ? path.isAbsolute(raw)
    ? raw
    : path.join(root, raw)
  : path.join(root, ".env");

dotenv.config({ path: envPath });
// prisma.config.ts
export default {
  // 明确告诉 Prisma 去哪里找 schema 文件
  schema: "prisma/schema",
};
