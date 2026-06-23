/**
 * 一键初始化数据库：迁移 + 种子 SQL（可选扩展）
 *
 * 用法（在 server 目录）：
 *   node scripts/bootstrap-db.cjs
 *   node scripts/bootstrap-db.cjs --reset          # 清空库后重新迁移并灌入种子（慎用）
 *   node scripts/bootstrap-db.cjs --no-extra       # 不执行 prisma/seed 下的扩展 SQL
 *   node scripts/bootstrap-db.cjs --seed-only        # 仅灌种子（不跑迁移；供 init-db.bat / init-database.cjs 在 migrate 之后调用）
 *
 * 前提：
 *   - 已配置 server/.env 中的 DATABASE_URL（库需已存在：先在 MySQL 里 CREATE DATABASE）
 *   - MySQL 可连；已在 server 目录执行过 npm install（含 mysql2）
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const mysql = require("mysql2/promise");

const SERVER_ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(SERVER_ROOT, ".env");
const MAIN_SEED = path.join(SERVER_ROOT, "prisma", "seed.sql");

/** 主种子 prisma/seed.sql 由 npm run db -- seed-build 从 prisma/seed/todo_think_db.sql 生成；此处可挂增量 SQL */
const DEFAULT_EXTRA_SEEDS = [];

function loadEnv() {
  require("dotenv").config({ path: ENV_PATH });
  if (!process.env.DATABASE_URL) {
    console.error(
      `[bootstrap-db] 未找到 DATABASE_URL，请在 ${ENV_PATH} 中配置后再执行。`,
    );
    process.exit(1);
  }
}

function parseArgs(argv) {
  return {
    reset: argv.includes("--reset"),
    noExtra: argv.includes("--no-extra"),
    seedOnly: argv.includes("--seed-only"),
  };
}

function runPrisma(cmd) {
  execSync(cmd, {
    cwd: SERVER_ROOT,
    stdio: "inherit",
    env: { ...process.env },
  });
}

function parseDatabaseName(databaseUrl) {
  const noQuery = databaseUrl.split("?")[0];
  const idx = noQuery.lastIndexOf("/");
  if (idx === -1 || idx === noQuery.length - 1) {
    return "";
  }
  try {
    return decodeURIComponent(noQuery.slice(idx + 1));
  } catch {
    return noQuery.slice(idx + 1);
  }
}

async function tableExists(conn, tableName) {
  const database = parseDatabaseName(process.env.DATABASE_URL);
  if (!database) {
    return false;
  }
  const [rows] = await conn.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
    [database, tableName],
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function getUserCount(conn) {
  if (!(await tableExists(conn, "users"))) {
    return 0;
  }
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM `users` WHERE `deleted_at` IS NULL",
  );
  const row = rows[0];
  return Number(row?.c ?? 0);
}

async function runSqlFile(conn, absolutePath, label) {
  if (!fs.existsSync(absolutePath)) {
    console.warn(`[bootstrap-db] 跳过不存在的文件: ${label}`);
    return;
  }
  const sql = fs.readFileSync(absolutePath, "utf8");
  if (!sql.trim()) {
    return;
  }
  console.log(`[bootstrap-db] 执行 SQL: ${label}`);
  await conn.query(sql);
}

async function main() {
  loadEnv();
  const { reset, noExtra, seedOnly } = parseArgs(process.argv.slice(2));

  if (reset && seedOnly) {
    console.error("[bootstrap-db] 不能同时使用 --reset 与 --seed-only");
    process.exit(1);
  }

  if (!seedOnly) {
    if (reset) {
      console.log(
        "[bootstrap-db] --reset：将执行 prisma migrate reset（清空业务数据并重建表）…",
      );
      runPrisma("npx prisma migrate reset --force --skip-seed");
    } else {
      console.log("[bootstrap-db] 执行 prisma migrate deploy …");
      runPrisma("npx prisma migrate deploy");
    }
  } else {
    console.log(
      "[bootstrap-db] --seed-only：跳过迁移，仅根据 User 表是否为空决定是否执行 prisma/seed.sql",
    );
  }

  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true,
    charset: "utf8mb4",
  });

  try {
    if (!reset) {
      const userCount = await getUserCount(conn);
      if (userCount > 0) {
        console.log(
          `[bootstrap-db] 检测到已有 ${userCount} 条未删除用户，跳过主种子 prisma/seed.sql（避免主键冲突）。`,
        );
        console.log(
          "[bootstrap-db] 若需清空重来，请备份后使用: node scripts/bootstrap-db.cjs --reset",
        );
      } else {
        await runSqlFile(conn, MAIN_SEED, "prisma/seed.sql");
      }
    } else {
      await runSqlFile(conn, MAIN_SEED, "prisma/seed.sql");
    }

    if (!noExtra) {
      for (const rel of DEFAULT_EXTRA_SEEDS) {
        await runSqlFile(conn, path.join(SERVER_ROOT, rel), rel);
      }
    }

    console.log("");
    console.log("[bootstrap-db] 完成。");
    console.log(
      "  默认账号见 prisma/seed.sql 注释（如 admin / 密码按项目前端 hash 规则为 123456）。",
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[bootstrap-db] 失败:", err.message || err);
  process.exit(1);
});
