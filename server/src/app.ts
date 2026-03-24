import Koa from "koa";
import bodyParser from "@koa/bodyparser";
import cors from "@koa/cors";
import jwt from "koa-jwt";
import { loadRoutes } from "./routers";
import { AuthUtil } from "./core/auth.util";
import { errorHandler } from "./middlewares/error";
import { requestLogger } from "./middlewares/logger";
import logger from "./core/logger";

const app = new Koa();

app.use(cors());
app.use(bodyParser());

// === 全局错误处理（最外层，捕获所有异常） ===
app.use(errorHandler);

// === 请求日志（记录每次接口调用） ===
app.use(requestLogger);

// === JWT 拦截器 ===
app.use(
  jwt({ secret: AuthUtil.getSecret() }).unless({
    path: [/^\/auth\/login/, /^\/auth\/register/, /^\/docs/],
  }),
);

const start = async () => {
  const router = await loadRoutes();
  app.use(router.routes()).use(router.allowedMethods());

  app.listen(3000, () => {
    logger.info("Server running at http://localhost:3000");
  });
};

start();
