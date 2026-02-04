import Koa from "koa";
import bodyParser from "@koa/bodyparser";
import cors from "@koa/cors";
import jwt from "koa-jwt"; //
import { loadRoutes } from "./routers"; // <--- 引入加载器
import { AuthUtil } from "./core/auth.util"; // [新增]

const app = new Koa();

app.use(cors());
app.use(bodyParser());

// === [新增] 全局错误处理 (捕获 401 未授权) ===
app.use(async (ctx, next) => {
  return next().catch((err) => {
    if (err.status === 401) {
      // 🔥🔥🔥 新增这一行：打印具体的错误原因到控制台！！！
      console.error(
        "鉴权失败原因:",
        err.originalError ? err.originalError.message : err.message
      );

      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: "身份验证失败",
        debug: err.originalError ? err.originalError.message : err.message, // 临时把错误返给前端看
      };
    } else {
      throw err;
    }
  });
});

// === [新增] JWT 拦截器 ===
// unless 里的路径不需要登录就能访问
app.use(
  jwt({ secret: AuthUtil.getSecret() }).unless({
    path: [/^\/auth\/login/, /^\/auth\/register/, /^\/docs/],
  })
);
const start = async () => {
  // 1. 动态加载所有路由
  const router = await loadRoutes();

  // 2. 注册路由
  app.use(router.routes()).use(router.allowedMethods());

  // 3. 启动监听
  app.listen(3000, () => {
    console.log("🚀 Server running at http://localhost:3000");
  });
};

start();
