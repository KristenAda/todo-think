import Router from "@koa/router";
import roleController from "./role.controller";

const router = new Router({ prefix: "/role" });

router.get("/list", roleController.list);
router.post("/add", roleController.add);
router.post("/update", roleController.update);
router.post("/delete", roleController.delete);

// 权限分配相关
router.post("/assignMenus", roleController.assignMenus);
router.post("/getMenus", roleController.getMenus);
router.post("/updateDataScope", roleController.updateDataScope);

export default router;
