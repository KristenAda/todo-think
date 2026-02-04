import Router from "@koa/router";
import roleController from "./role.controller";

const router = new Router({ prefix: "/sys/role" });

// 全是 POST，看着整齐划一
router.post("/list", roleController.list);
router.post("/add", roleController.add);
router.post("/update", roleController.update);
router.post("/delete", roleController.delete);

// 权限分配相关
router.post("/assignPerms", roleController.assignPerms); // 分配
router.post("/getPerms", roleController.getPerms); // 回显

export default router;
