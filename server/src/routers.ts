import Router from "@koa/router";
import { glob } from "glob";
import path from "path";
// 🚀 删除了 import { pathToFileURL } from 'url'; 我们不再需要它了

function isRouterLike(m: unknown): m is Router {
  return (
    !!m &&
    typeof (m as Router).routes === "function" &&
    typeof (m as Router).allowedMethods === "function"
  );
}

const router = new Router();

// 动态获取当前文件的后缀名 (.ts 或 .js)
const ext = path.extname(__filename);
const pattern = path
  .join(__dirname, "modules", "**", `*.routes${ext}`)
  .replace(/\\/g, "/");

export const loadRoutes = async () => {
  const files = await glob(pattern);

  if (files.length === 0) {
    console.warn(
      `[Route] Warning: 路由挂载失败！未找到任何匹配的文件: ${pattern}`
    );
  }

  for (const file of files) {
    try {
      // 🚀 核心修复：直接使用原生 require 动态加载模块
      // CommonJS 下的 require 直接接受绝对路径，完美避开 file:// 协议错误
      const routeModule = require(file);

      // 兼容 ES6 的 "export default" 和 CommonJS 导出
      const moduleRouter = routeModule.default || routeModule;

      if (isRouterLike(moduleRouter)) {
        router.use(moduleRouter.routes());
        router.use(moduleRouter.allowedMethods());
        console.log(`[Route] Loaded: ${path.basename(file)}`);
      } else {
        console.warn(
          `[Route] Warning: ${path.basename(
            file
          )} did not export a Router instance.`
        );
      }
    } catch (err) {
      console.error(`[Route] Error loading ${file}:`, err);
    }
  }

  return router;
};
