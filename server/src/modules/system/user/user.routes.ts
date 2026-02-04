// src/modules/system/user/user.routes.ts
import Router from "@koa/router";
import userController from "./user.controller";

const router = new Router({ prefix: "/sys/user" });

router.post("/list", userController.list);
router.post("/add", userController.add);
router.post("/update", userController.update);
router.post("/delete", userController.delete);
router.post("/assignRoles", userController.assignRoles);

export default router;
