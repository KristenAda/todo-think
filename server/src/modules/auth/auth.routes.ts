import Router from "@koa/router";
import authController from "./auth.controller";

const router = new Router({ prefix: "/auth" });

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/info", authController.info);

export default router;
