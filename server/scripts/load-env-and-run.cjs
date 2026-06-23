/**
 * 先加载指定 env 文件再执行子命令（用于 dev:testdb，避免仅依赖 dotenv-cli 在 Windows/npx 下失效）。
 *
 * 用法: node scripts/load-env-and-run.cjs .env.test npx tsx watch --clear-screen=false src/app.ts
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const SERVER_ROOT = path.resolve(__dirname, "..");
const envRel = process.argv[2];
const cmd = process.argv.slice(3);

if (!envRel || cmd.length === 0) {
  console.error(
    "用法: node scripts/load-env-and-run.cjs <env文件> <命令> [参数...]",
  );
  process.exit(1);
}

const envPath = path.isAbsolute(envRel) ? envRel : path.join(SERVER_ROOT, envRel);
if (!fs.existsSync(envPath)) {
  console.error(`[load-env-and-run] 找不到环境文件: ${envPath}`);
  process.exit(1);
}

require("dotenv").config({ path: envPath });

const [exe, ...args] = cmd;
const r = spawnSync(exe, args, {
  cwd: SERVER_ROOT,
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

process.exit(typeof r.status === "number" ? r.status : 1);
