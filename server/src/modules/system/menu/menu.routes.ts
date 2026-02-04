// src/modules/system/menu/menu.routes.ts
import Router from "@koa/router";
import menuController from "./menu.controller";

const router = new Router({ prefix: "/sys/menu" });

// 统一为 POST + 动词
router.post("/list", menuController.list);
router.post("/add", menuController.add); // <--- 这里定义的是 /add
router.post("/update", menuController.update);
router.post("/delete", menuController.delete);

export default router;
