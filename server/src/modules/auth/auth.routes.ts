import Router from "@koa/router";
import authController from "./auth.controller";
import { loginRateLimit } from "@/middlewares/ratelimit";

const router = new Router({ prefix: "/auth" });

// 登录接口加限流：同一 IP 15 分钟内最多尝试 10 次
router.post("/login", loginRateLimit, authController.login);
router.post("/register", authController.register);
router.get("/info", authController.info);

export default router;
