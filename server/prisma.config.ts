import dotenv from "dotenv";

// ★ 显式加载当前目录下的 .env 文件
dotenv.config();
// prisma.config.ts
export default {
  // 明确告诉 Prisma 去哪里找 schema 文件
  schema: "prisma/schema",
};
