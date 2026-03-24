// src/modules/system/menu/menu.routes.ts
import Router from "@koa/router";
import menuController from "./menu.controller";

const router = new Router({ prefix: "/menu" });

router.get("/list", menuController.list);
router.get("/tree", menuController.tree);
router.post("/add", menuController.add);
router.post("/update", menuController.update);
router.post("/delete", menuController.delete);

export default router;
