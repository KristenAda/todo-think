// 最优先加载环境变量，确保后续所有模块都能读到
import "dotenv/config";
// dashboard module loaded

import Koa from "koa";
import bodyParser from "@koa/bodyparser";
import cors from "@koa/cors";
import jwt from "koa-jwt";
import { loadRoutes } from "./routers";
import { AuthUtil } from "./core/auth.util";
import { errorHandler } from "./middlewares/error";
import { requestLogger } from "./middlewares/logger";
import logger from "./core/logger";
import prisma from "./core/prisma";

const app = new Koa();

app.use(cors());
app.use(bodyParser());

// 全局错误处理（最外层，捕获所有异常）
app.use(errorHandler);

// 请求日志
app.use(requestLogger);

// JWT 拦截器
app.use(
  jwt({ secret: AuthUtil.getSecret() }).unless({
    path: [/^\/auth\/login/, /^\/auth\/register/, /^\/docs/],
  }),
);

const start = async () => {
  const router = await loadRoutes();
  app.use(router.routes()).use(router.allowedMethods());

  const server = app.listen(3000, () => {
    logger.info("Server running at http://localhost:3000");
  });

  // 优雅关闭：收到终止信号时先停止接收新请求，再断开数据库连接
  const shutdown = async (signal: string) => {
    logger.info(`收到 ${signal} 信号，正在优雅关闭服务器...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info("数据库连接已断开，进程退出");
      process.exit(0);
    });

    // 超过 10s 强制退出，防止卡死
    setTimeout(() => {
      logger.error("优雅关闭超时，强制退出");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start();
