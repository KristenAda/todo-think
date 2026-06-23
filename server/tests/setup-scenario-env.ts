/**
 * 场景黑盒测试专用：优先加载 server/.env.test（覆盖终端里的 DATABASE_URL）
 * 须在导入 createApp（进而加载 AuthUtil / Prisma）之前执行。
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

process.env.VITEST = "true";

const root = path.resolve(__dirname, "..");
const envTestPath = path.join(root, ".env.test");

function parseDbName(url: string): string {
  const noQuery = url.split("?")[0];
  const i = noQuery.lastIndexOf("/");
  if (i === -1 || i === noQuery.length - 1) return "";
  try {
    return decodeURIComponent(noQuery.slice(i + 1));
  } catch {
    return noQuery.slice(i + 1);
  }
}

if (!fs.existsSync(envTestPath)) {
  process.env.SKIP_SCENARIO_BLACKBOX = "1";
  console.warn(
    `[scenario-blackbox] 未找到 ${envTestPath}，已设置 SKIP_SCENARIO_BLACKBOX=1（跳过场景黑盒测试）。`,
  );
} else {
  dotenv.config({ path: envTestPath, override: true });
  const dbName = parseDbName(process.env.DATABASE_URL ?? "");
  if (!process.env.DATABASE_URL) {
    process.env.SKIP_SCENARIO_BLACKBOX = "1";
    console.warn(
      "[scenario-blackbox] .env.test 未解析到 DATABASE_URL，跳过场景黑盒测试。",
    );
  } else if (!/test/i.test(dbName)) {
    process.env.SKIP_SCENARIO_BLACKBOX = "1";
    console.warn(
      `[scenario-blackbox] 库名「${dbName}」不含 test，跳过场景黑盒测试（防止误连开发库）。`,
    );
  }
}
