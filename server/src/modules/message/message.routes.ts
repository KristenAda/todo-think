import Router from "@koa/router";
import { messageController } from "./message.controller";

/**
 * 消息模块路由
 * - 该项目会自动扫描并挂载 *.routes.ts
 */
const router = new Router({ prefix: "/messages" });

router.get("/", messageController.page.bind(messageController));
router.get("/unread-count", messageController.unreadCount.bind(messageController));
router.post("/:id/read", messageController.markRead.bind(messageController));
router.post("/read-all", messageController.markAllRead.bind(messageController));

// 可选：通过 REST 发送消息（调试/后台运营）
router.post("/", messageController.send.bind(messageController));

export default router;

