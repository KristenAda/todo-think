// 最优先加载环境变量，确保后续所有模块都能读到
import "dotenv/config";
// dashboard module loaded

import Koa from "koa";
import bodyParser from "@koa/bodyparser";
import cors from "@koa/cors";
import jwt from "koa-jwt";
import { WebSocketServer } from "ws";
import jsonwebtoken from "jsonwebtoken";
import { loadRoutes } from "./routers";
import { AuthUtil } from "./core/auth.util";
import { errorHandler } from "./middlewares/error";
import { responseDateFormat } from "./middlewares/response.date";
import { requestLogger } from "./middlewares/logger";
import logger from "./core/logger";
import prisma from "./core/prisma";
import { bindUserSocket, unbindUserSocket } from "./core/wsHub";

const app = new Koa();

// 最外层：在路由处理完成后统一格式化响应中的日期字段
app.use(responseDateFormat);

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

  /**
   * WebSocketServer 与 HTTP 同端口：
   * - 客户端通过 query 参数携带 token（例如：ws://host:3000/ws?token=xxx）
   * - 连接建立后解析 token 得到 userId，并写入全局 userId->ws 映射
   * - 心跳机制：收到 "ping" 立即回 "pong"（对接前端既有心跳）
   */
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    let userId: number | null = null;

    try {
      const url = new URL(req.url ?? "", `http://${req.headers.host ?? "localhost"}`);
      const token = url.searchParams.get("token");
      if (!token) {
        ws.close(1008, "Missing token");
        return;
      }

      const decoded = jsonwebtoken.verify(token, AuthUtil.getSecret()) as any;
      userId = Number(decoded?.id);
      if (!userId || Number.isNaN(userId)) {
        ws.close(1008, "Invalid token payload");
        return;
      }

      bindUserSocket(userId, ws);
    } catch (e) {
      ws.close(1008, "Unauthorized");
      return;
    }

    ws.on("message", (data) => {
      // 兼容前端：心跳发送的是纯字符串 "ping"
      if (typeof data === "string") {
        if (data === "ping") ws.send("pong");
        return;
      }
      // ws 库在 Node 侧通常是 Buffer，这里按 UTF-8 尝试解析
      const text = (data as Buffer).toString("utf8");
      if (text === "ping") ws.send("pong");
    });

    ws.on("close", () => {
      if (userId != null) unbindUserSocket(userId, ws);
    });

    ws.on("error", () => {
      if (userId != null) unbindUserSocket(userId, ws);
    });
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
