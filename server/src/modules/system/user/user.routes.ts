// src/modules/system/user/user.routes.ts
import Router from "@koa/router";
import userController from "./user.controller";

const router = new Router({ prefix: "/user" });

router.get("/list", userController.list);
router.post("/add", userController.add);
router.post("/update", userController.update);
router.post("/delete", userController.delete);
router.post("/assignRoles", userController.assignRoles);
router.post("/roles", userController.getRoles);

export default router;
