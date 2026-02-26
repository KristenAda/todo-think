const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const RELEASE_DIR = path.join(DIST_DIR, "release");

console.log("=========================================");
console.log("  Todo-Think 后端自动化打包脚本启动");
console.log("=========================================");

// 1. 彻底删除旧的 dist 目录 (防止旧文件/幽灵文件残留)
if (fs.existsSync(DIST_DIR)) {
  console.log("正在清理历史 dist 目录...");
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}

// 2. 执行 tsc 编译代码
console.log("正在编译 TypeScript 代码 (tsc)...");
execSync("npm run build:ts", { stdio: "inherit", cwd: ROOT_DIR });

// 3. 构建发布包专属目录
console.log("正在构建发布包结构...");
const releaseDistDir = path.join(RELEASE_DIR, "dist");
fs.mkdirSync(releaseDistDir, { recursive: true });

// 4. 将 tsc 生成的代码直接“剪切”到 release 中，拒绝套娃
console.log("正在整理编译产物...");
const distFiles = fs.readdirSync(DIST_DIR);
distFiles.forEach((file) => {
  if (file !== "release") {
    const srcPath = path.join(DIST_DIR, file);
    const destPath = path.join(releaseDistDir, file);
    fs.renameSync(srcPath, destPath);
  }
});

// 5. 收集外部部署文件 (数据库模型、配置文件)
console.log("正在收集部署文件...");
const prismaSrc = path.join(ROOT_DIR, "prisma");
if (fs.existsSync(prismaSrc)) {
  fs.cpSync(prismaSrc, path.join(RELEASE_DIR, "prisma"), { recursive: true });
}

const copyFiles = ["package-lock.json", "prisma.config.ts", ".env"];
copyFiles.forEach((file) => {
  const src = path.join(ROOT_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(RELEASE_DIR, file));
  } else {
    console.warn(
      `\x1b[33m[警告] 找不到文件: ${file}，请确保根目录下有此文件\x1b[0m`
    );
  }
});

// 6. ★ 动态生成一键部署批处理脚本 (强制使用 dotenv-cli 注入环境变量)
console.log("正在动态生成 deploy.bat 部署脚本...");
const batLines = [
  "@echo off",
  "chcp 65001 >nul",
  "",
  'cd /d "%~dp0"',
  "",
  "echo ========================================",
  "echo   Todo-Think 后端部署脚本开始执行",
  "echo ========================================",
  "",
  "echo.",
  "echo [1/4] 正在安装生产环境依赖...",
  "call npm install --omit=dev",
  "",
  "echo.",
  "echo [2/4] 正在生成 Prisma 客户端...",
  ":: 使用 dotenv-cli 强行注入环境变量，防止 Prisma 6 漏读",
  "call npx --yes dotenv-cli -e .env -- npx prisma generate",
  "",
  "echo.",
  "echo [3/4] 正在同步数据库表结构...",
  ":: 使用 dotenv-cli 强行注入环境变量，解决 P1012 报错",
  "call npx --yes dotenv-cli -e .env -- npx prisma migrate deploy",
  "",
  "echo.",
  "echo [4/4] 正在使用 PM2 启动/更新服务...",
  'call pm2 start dist/app.js --name "todo-think-api" || call pm2 reload "todo-think-api"',
  "call pm2 save",
  "",
  "echo.",
  "echo ========================================",
  "echo   部署完成！",
  "echo ========================================",
  "echo.",
  "pause",
];

fs.writeFileSync(path.join(RELEASE_DIR, "deploy.bat"), batLines.join("\r\n"));

// 7. 动态处理 package.json
console.log("正在优化生产环境 package.json...");
const pkg = require("../package.json");

delete pkg.devDependencies;
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies["@prisma/client"] = "^6.19.2";
pkg.dependencies["prisma"] = "^6.19.2";
pkg.scripts = {
  start: "node dist/app.js",
};

fs.writeFileSync(
  path.join(RELEASE_DIR, "package.json"),
  JSON.stringify(pkg, null, 2)
);

console.log("=========================================");
console.log("  🎉 终极纯净版打包完成！");
console.log("  发布包路径: server/dist/release");
console.log(
  "  使用方法: 将 release 文件夹丢到服务器，双击 deploy.bat 即可全自动上线！"
);
console.log("=========================================");
