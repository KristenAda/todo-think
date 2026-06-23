/**
 * Prisma `///` 注释相关流程统一入口（迁移 SQL 补丁 + 库内 COMMENT 同步）。
 *
 *   node scripts/prisma-comments-cli.cjs migrate   # 仅：create-only → 补丁 migration.sql → migrate dev
 *   node scripts/prisma-comments-cli.cjs apply     # 仅：ALTER 写 MySQL 表/列 COMMENT
 *   node scripts/prisma-comments-cli.cjs all       # 先 migrate 再 apply（完整链路）
 *
 * 快捷（package.json）：
 *   npm run comments:migrate
 *   npm run comments:apply
 *   npm run comments
 *
 * 测试库（.env.test，见 .env.test.example）：
 *   npm run db:test:comments       — migrate deploy + 写库 COMMENT（与 dev 的 comments 链路对应）
 *   npm run db:test:comments:apply — 仅将 /// 同步到测试库 COMMENT（无待迁移时可单独跑）
 */

const path = require("path");
const { spawnSync, execSync } = require("child_process");

const SERVER_ROOT = path.resolve(__dirname, "..");

function runNode(script, args = []) {
  const scriptPath = path.join(SERVER_ROOT, "scripts", script);
  const r = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: SERVER_ROOT,
    stdio: "inherit",
    env: { ...process.env },
  });
  if (r.error) {
    console.error("[comments]", r.error);
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

function runMigratePipeline() {
  console.log("[comments] 阶段 migrate：create-only → 补丁 migration.sql → migrate dev …");
  sh(
    "npx prisma migrate dev --name auto_sync --create-only && node scripts/prismaMysqlComments.js && npx prisma migrate dev",
  );
}

function runApplyPipeline() {
  console.log("[comments] 阶段 apply：将 schema /// 同步到 MySQL COMMENT …");
  runNode("prismaMysqlApplyComments.js");
}

const phase = (process.argv[2] || "").toLowerCase();

if (phase === "migrate" || phase === "m") {
  runMigratePipeline();
} else if (phase === "apply" || phase === "a") {
  runApplyPipeline();
} else if (phase === "all" || phase === "") {
  runMigratePipeline();
  runApplyPipeline();
  console.log("[comments] all 完成。");
} else if (phase === "help" || phase === "-h" || phase === "--help") {
  console.log(`
用法（在 server 目录）:
  node scripts/prisma-comments-cli.cjs migrate | apply | all

  migrate   生成 auto_sync 迁移（仅 create）→ prismaMysqlComments 补丁 → migrate dev
  apply     直接对当前库执行 ALTER … COMMENT（无结构变更时也可用）
  all       migrate 完成后立刻 apply（原 sync-comments + comment-apply 一条链）

npm 快捷:
  npm run comments:migrate
  npm run comments:apply
  npm run comments          （等同 all）

测试库（.env.test）:
  npm run db:test:comments       migrate deploy + COMMENT
  npm run db:test:comments:apply 仅 COMMENT
`);
} else {
  console.error(`[comments] 未知参数: ${process.argv[2]}`);
  console.error("使用: migrate | apply | all，或 node scripts/prisma-comments-cli.cjs help");
  process.exit(1);
}
