/**
 * 数据库与本地环境统一入口。
 *
 *   npm run setup              新人一键：无 .env 时从 .env.example 复制 → 建库 + migrate + 种子
 *   npm run db -- <子命令>     见下方 printHelp
 */

const fs = require("fs");
const path = require("path");
const { spawnSync, execSync } = require("child_process");

const SERVER_ROOT = path.resolve(__dirname, "..");
const ENV_EXAMPLE = path.join(SERVER_ROOT, ".env.example");
const ENV_FILE = path.join(SERVER_ROOT, ".env");

function runNode(script, args = []) {
  const scriptPath = path.join(SERVER_ROOT, "scripts", script);
  const r = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: SERVER_ROOT,
    stdio: "inherit",
    env: { ...process.env },
  });
  if (r.error) {
    console.error("[db]", r.error);
    process.exit(1);
  }
  const code = r.status;
  if (code !== 0 && code !== null) process.exit(code);
}

function sh(cmd) {
  execSync(cmd, {
    cwd: SERVER_ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env },
  });
}

function ensureEnvFromExample() {
  if (fs.existsSync(ENV_FILE)) {
    console.log("[db] .env 已存在，跳过从 .env.example 复制。");
    return;
  }
  if (!fs.existsSync(ENV_EXAMPLE)) {
    console.error(
      `[db] 未找到 .env.example，无法自动创建 .env。请在 ${SERVER_ROOT} 手动创建 .env。`,
    );
    process.exit(1);
  }
  fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
  console.log(
    "[db] 已从 .env.example 创建 .env；请确认 DATABASE_URL、JWT_SECRET 正确后再依赖后续步骤。",
  );
}

function printHelp() {
  console.log(`
数据库 / 本地环境 CLI（在 server 目录执行）

  npm run setup
      新人一键：若无 .env 则从 .env.example 复制 → 建空库 → prisma generate
      → migrate deploy → 种子（User 已有则跳过种子）

  npm run db -- <子命令> [参数...]

子命令:
  setup           与 npm run setup 相同
  init            建空库 + migrate + 种子（需已有 .env；不含复制 .env.example）
  bootstrap       node scripts/bootstrap-db.cjs [参数]
                  例: npm run db -- bootstrap --seed-only
  deploy          prisma migrate deploy
  generate        prisma generate
  migrate         prisma migrate dev [可追加 Prisma 参数]
  sync            prisma migrate dev --name auto_sync
  comments        Prisma /// 注释全流程：迁移补丁 + 写库 COMMENT（同 npm run comments）
  comments-migrate  仅迁移链（create-only → 补丁 migration → migrate dev）
  comments-apply    仅将 /// 同步到 MySQL（同 npm run comments:apply）
  seed-build      从 prisma/seed/todo_think_db.sql 生成 prisma/seed.sql

  （兼容旧名：sync-comments → comments-migrate；comment-apply → comments-apply）
`);
}

const cmd = process.argv[2];

if (!cmd || cmd === "help" || cmd === "-h" || cmd === "--help") {
  printHelp();
  process.exit(0);
}

try {
  switch (cmd) {
    case "setup":
      ensureEnvFromExample();
      runNode("init-database.cjs");
      console.log("[db] setup 完成。执行 npm run dev 启动后端。");
      break;
    case "init":
      runNode("init-database.cjs");
      break;
    case "bootstrap":
      runNode("bootstrap-db.cjs", process.argv.slice(3));
      break;
    case "deploy":
      sh("npx prisma migrate deploy");
      break;
    case "generate":
      sh("npx prisma generate");
      break;
    case "migrate": {
      const rest = process.argv.slice(3).join(" ").trim();
      sh(rest ? `npx prisma migrate dev ${rest}` : "npx prisma migrate dev");
      break;
    }
    case "sync":
      sh("npx prisma migrate dev --name auto_sync");
      break;
    case "comments":
      runNode("prisma-comments-cli.cjs", ["all"]);
      break;
    case "comments-migrate":
    case "sync-comments":
      runNode("prisma-comments-cli.cjs", ["migrate"]);
      break;
    case "comments-apply":
    case "comment-apply":
      runNode("prisma-comments-cli.cjs", ["apply"]);
      break;
    case "seed-build":
      runNode("build-seed-from-dump.cjs");
      break;
    default:
      console.error(`[db] 未知命令: ${cmd}\n`);
      printHelp();
      process.exit(1);
  }
} catch (e) {
  console.error("[db]", e.message || e);
  process.exit(1);
}
