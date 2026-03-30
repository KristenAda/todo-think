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
// 个人中心
router.get("/profile", userController.profile);
router.post("/profile", userController.updateProfile);
router.post("/change-password", userController.changePassword);

export default router;
