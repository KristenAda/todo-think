/**
 * 初始化数据库：仅建空库（CREATE DATABASE，不执行导出 SQL 中的建表语句）
 * → prisma generate → migrate deploy（建表）
 * → bootstrap-db --seed-only（灌 prisma/seed.sql，User 已有则跳过）
 *
 * 用法（在 server 或 dist/release 根目录，且已 npm install）：
 *   node scripts/init-database.cjs
 *   开发机推荐：npm run db -- init（或新人 npm run setup）
 *
 * 库名：优先从 .env 的 DATABASE_URL 解析；若 URL 无库名则使用 todo_think_db（与 prisma/seed/todo_think_db.sql 中 Source Schema 一致）
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const mysql = require("mysql2/promise");

const SERVER_ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(SERVER_ROOT, ".env");
/** 与 Navicat 导出 `Source Schema : todo_think_db` 一致，仅作 URL 缺库名时的默认库名 */
const DEFAULT_DB_NAME = "todo_think_db";

function loadEnv() {
  require("dotenv").config({ path: ENV_PATH });
  if (!process.env.DATABASE_URL) {
    console.error(`[init-database] 未找到 DATABASE_URL，请在 ${ENV_PATH} 中配置。`);
    process.exit(1);
  }
}

/** @returns {{ host: string, port: number, user: string, password: string, database: string, raw: string }} */
function parseDatabaseUrl(raw) {
  const trimmed = String(raw).trim();
  const normalized = trimmed.replace(/^mysql:\/\//i, "http://");
  let u;
  try {
    u = new URL(normalized);
  } catch {
    throw new Error("DATABASE_URL 格式无法解析");
  }
  const port = u.port ? Number(u.port) : 3306;
  const user = decodeURIComponent(u.username || "");
  const password = decodeURIComponent(u.password || "");
  let database = (u.pathname || "").replace(/^\//, "").split("?")[0];
  database = database ? decodeURIComponent(database) : "";
  if (!database) {
    database = DEFAULT_DB_NAME;
    console.warn(
      `[init-database] DATABASE_URL 未指定库名，将使用默认库名: ${DEFAULT_DB_NAME}（与 todo_think_db.sql 中 Source Schema 一致）`,
    );
    u.pathname = `/${DEFAULT_DB_NAME}`;
    process.env.DATABASE_URL = u
      .toString()
      .replace(/^http:/i, "mysql:")
      .replace(/^https:/i, "mysql:");
  }
  const host = u.hostname;
  if (!host) throw new Error("DATABASE_URL 缺少主机名");
  if (!/^[a-zA-Z0-9_-]+$/.test(database)) {
    throw new Error(`库名仅允许字母、数字、下划线、连字符: ${database}`);
  }
  return { host, port, user, password, database, raw: process.env.DATABASE_URL };
}

function run(cmd) {
  execSync(cmd, {
    cwd: SERVER_ROOT,
    stdio: "inherit",
    env: { ...process.env },
    shell: true,
  });
}

async function ensureDatabaseExists(cfg) {
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: true,
    charset: "utf8mb4",
  });
  try {
    const id = "`" + cfg.database.replace(/`/g, "``") + "`";
    console.log(
      `[init-database] 创建空库（若已存在则跳过）: ${cfg.database} …`,
    );
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS ${id} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log("[init-database] 空库就绪。");
  } finally {
    await conn.end();
  }
}

async function main() {
  loadEnv();
  const cfg = parseDatabaseUrl(process.env.DATABASE_URL);

  await ensureDatabaseExists(cfg);

  console.log("[init-database] prisma generate …");
  run("npx --yes dotenv-cli -e .env -- npx prisma generate");

  console.log("[init-database] prisma migrate deploy …");
  run("npx --yes dotenv-cli -e .env -- npx prisma migrate deploy");

  const bootstrap = path.join(SERVER_ROOT, "scripts", "bootstrap-db.cjs");
  if (!fs.existsSync(bootstrap)) {
    console.error(`[init-database] 未找到 ${bootstrap}`);
    process.exit(1);
  }
  console.log("[init-database] 灌入种子（User 表已有数据则跳过）…");
  run(`node "${bootstrap}" --seed-only`);

  console.log("");
  console.log("[init-database] 全部完成。");
}

main().catch((err) => {
  console.error("[init-database] 失败:", err.message || err);
  process.exit(1);
});
