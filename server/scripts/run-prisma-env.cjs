/**
 * 在指定 env 文件下运行 prisma CLI（解决 prisma.config.ts + Prisma 6 会忽略外层 dotenv-cli 注入的问题）。
 *
 * 用法（在 server 目录）：
 *   node scripts/run-prisma-env.cjs .env.test migrate deploy
 */

const path = require("path");
const { spawnSync } = require("child_process");

const SERVER_ROOT = path.resolve(__dirname, "..");
const envFile = process.argv[2];
const prismaArgs = process.argv.slice(3);

if (!envFile || prismaArgs.length === 0) {
  console.error(
    "用法: node scripts/run-prisma-env.cjs <env文件> <prisma 子命令及参数...>\n示例: node scripts/run-prisma-env.cjs .env.test migrate deploy",
  );
  process.exit(1);
}

process.env.PRISMA_ENV_FILE = envFile;

const r = spawnSync("npx", ["prisma", ...prismaArgs], {
  cwd: SERVER_ROOT,
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

process.exit(typeof r.status === "number" ? r.status : 1);
