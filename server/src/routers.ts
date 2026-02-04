import Router from "@koa/router";
import { glob } from "glob";
import path from "path";
import { pathToFileURL } from "url"; // <--- 1. 新增这个导入

const router = new Router();

// 1. 定义扫描路径
const pattern = path
  .join(__dirname, "modules", "**", "*.routes.ts")
  .replace(/\\/g, "/");

// 2. 异步加载路由
export const loadRoutes = async () => {
  // 查找所有匹配的文件
  const files = await glob(pattern);

  for (const file of files) {
    try {
      // 动态导入模块
      // ❌ 旧代码：直接传物理路径，Windows 下会报错
      // const routeModule = await import(file);

      // ✅ 新代码：将物理路径转换为 file:// URL
      const routeModule = await import(pathToFileURL(file).href);

      // 约定：每个路由文件必须 export default 一个 Router 实例
      const moduleRouter = routeModule.default;

      if (moduleRouter && moduleRouter instanceof Router) {
        // 挂载到主路由
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
