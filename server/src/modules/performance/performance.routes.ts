import Router from "@koa/router";
import { performanceRuleController } from "./performance.controller";

const router = new Router();

// ======================== Rules Routes ========================
router.get("/rule-sets", performanceRuleController.ruleSetList.bind(performanceRuleController));
router.post("/rule-sets", performanceRuleController.ruleSetCreate.bind(performanceRuleController));
router.put("/rule-sets/:id", performanceRuleController.ruleSetUpdate.bind(performanceRuleController));
router.delete("/rule-sets/:id", performanceRuleController.ruleSetDelete.bind(performanceRuleController));
router.get(
  "/rule-sets/:id/versions",
  performanceRuleController.ruleSetVersionList.bind(performanceRuleController),
);
router.get(
  "/rule-set-versions/:versionId",
  performanceRuleController.ruleSetVersionDetail.bind(performanceRuleController),
);
router.post(
  "/rule-sets/:id/publish",
  performanceRuleController.ruleSetPublish.bind(performanceRuleController),
);
router.post("/rule-sets/simulate", performanceRuleController.ruleSetSimulate.bind(performanceRuleController));
router.post("/rule-sets/adjustments", performanceRuleController.createTaskAdjustment.bind(performanceRuleController));
router.get("/rule-variables", performanceRuleController.variableList.bind(performanceRuleController));
router.post("/rule-variables/upsert", performanceRuleController.variableUpsert.bind(performanceRuleController));

export default router;

