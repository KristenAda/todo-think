import Router from "@koa/router";
import roleController from "./role.controller";

const router = new Router({ prefix: "/sys/role" });

// 全是 POST，看着整齐划一
router.post("/list", roleController.list);
router.post("/add", roleController.add);
router.post("/update", roleController.update);
router.post("/delete", roleController.delete);

// 权限分配相关
router.post("/assignPerms", roleController.assignPerms); // 分配菜单权限
router.post("/getPerms", roleController.getPerms); // 获取菜单权限回显
router.post("/updateDataScope", roleController.updateDataScope); // 分配数据权限

export default router;
