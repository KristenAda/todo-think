import Koa from "koa";
import bodyParser from "@koa/bodyparser";
import cors from "@koa/cors";
import jwt from "koa-jwt";
import { loadRoutes } from "./routers";
import { AuthUtil } from "./core/auth.util";
import { errorHandler } from "./middlewares/error";
import { responseDateFormat } from "./middlewares/response.date";
import { requestLogger } from "./middlewares/logger";

/**
 * 组装 HTTP 中间件与业务路由（不负责 listen / WebSocket / 定时任务）。
 * 供集成测试通过 supertest 注入请求。
 */
export async function createApp(): Promise<Koa> {
  const app = new Koa();

  app.use(responseDateFormat);
  app.use(cors());
  app.use(bodyParser());
  app.use(errorHandler);
  app.use(requestLogger);
  app.use(
    jwt({ secret: AuthUtil.getSecret() }).unless({
      path: [/^\/auth\/login/, /^\/auth\/register/, /^\/docs/],
    }),
  );

  const router = await loadRoutes();
  app.use(router.routes()).use(router.allowedMethods());

  return app;
}
