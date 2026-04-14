-- 已有测试用例的历史任务回填为软件开发领域（与业务规则一致）
UPDATE `task`
SET `workDomain` = 'SOFTWARE_DEVELOPMENT'
WHERE EXISTS (
  SELECT 1 FROM `test_case` WHERE `test_case`.`taskId` = `task`.`id`
);
