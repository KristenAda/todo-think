// src/modules/system/dept/dept.routes.ts
import Router from "@koa/router";
import deptController from "./dept.controller";

const router = new Router({ prefix: "/sys/dept" });

// 部门自身的 CRUD
router.post("/tree", deptController.tree);
router.post("/add", deptController.add);
router.post("/update", deptController.update);
router.post("/delete", deptController.delete);

// 部门人员管理
router.post("/employees", deptController.getEmployees); // 查人
router.post("/addEmployee", deptController.addEmployee); // 加人
router.post("/removeEmployee", deptController.removeEmployee); // 踢人

export default router;
