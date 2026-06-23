/**
 * 将 prisma/seed/todo_think_test_seed.sql 灌入「测试库」。
 *
 * 默认读取 server/.env.test（请从 .env.test.example 复制并修改 DATABASE_URL）。
 * 可通过环境变量覆盖：
 *   DOTENV_CONFIG_PATH   指定其它 env 文件路径（绝对或相对 server 根目录）
 *
 * 安全：默认要求 DATABASE_URL 中的库名包含 test（不区分大小写），避免误连开发库。
 * 若确有需要连非 test 库名，设置 ALLOW_NON_TEST_DB=1。
 *
 * 用法（在 server 目录）：
 *   npm run db:test:seed
 *
 * 推荐一键清空并重灌（避免主键冲突）：
 *   npm run db:test:fresh
 *   或：npm run db -- test-fresh
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const SERVER_ROOT = path.resolve(__dirname, "..");
const TEST_SEED = path.join(SERVER_ROOT, "prisma", "seed", "todo_think_test_seed.sql");

function parseDatabaseName(databaseUrl) {
  const noQuery = databaseUrl.split("?")[0];
  const idx = noQuery.lastIndexOf("/");
  if (idx === -1 || idx === noQuery.length - 1) return "";
  try {
    return decodeURIComponent(noQuery.slice(idx + 1));
  } catch {
    return noQuery.slice(idx + 1);
  }
}

function loadEnvFile() {
  const explicit = process.env.DOTENV_CONFIG_PATH;
  const resolved =
    explicit != null && String(explicit).trim() !== ""
      ? path.isAbsolute(explicit)
        ? explicit
        : path.join(SERVER_ROOT, explicit)
      : path.join(SERVER_ROOT, ".env.test");

  const dotenv = require("dotenv");
  if (!fs.existsSync(resolved)) {
    console.error(
      `[test-seed] 未找到 ${resolved}（不会自动读取 .env，避免误灌开发库）。请复制 .env.test.example 为 .env.test，或设置 DOTENV_CONFIG_PATH 指向含测试库 DATABASE_URL 的文件。`,
    );
    process.exit(1);
  }
  dotenv.config({ path: resolved, override: true });
  console.log(`[test-seed] 已加载环境文件: ${resolved}`);
}

async function main() {
  loadEnvFile();

  if (!process.env.DATABASE_URL) {
    console.error("[test-seed] DATABASE_URL 未设置");
    process.exit(1);
  }

  const dbName = parseDatabaseName(process.env.DATABASE_URL);
  const allowAny = process.env.ALLOW_NON_TEST_DB === "1";
  if (!allowAny && !/test/i.test(dbName)) {
    console.error(
      `[test-seed] 拒绝执行：当前库名「${dbName}」不含 test，疑似开发库。请改用测试库 URL，或设置 ALLOW_NON_TEST_DB=1（慎用）。`,
    );
    process.exit(1);
  }

  if (!fs.existsSync(TEST_SEED)) {
    console.error(`[test-seed] 找不到种子文件: ${TEST_SEED}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(TEST_SEED, "utf8");
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true,
    charset: "utf8mb4",
  });

  try {
    console.log(`[test-seed] 执行 SQL: ${path.relative(SERVER_ROOT, TEST_SEED)}`);
    await conn.query(sql);
    console.log("[test-seed] 完成。可用 admin 登录（密码规则与主种子一致，演示环境多为 123456）。");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[test-seed] 失败:", err.message || err);
  process.exit(1);
});
