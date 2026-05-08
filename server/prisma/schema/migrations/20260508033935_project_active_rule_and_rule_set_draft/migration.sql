-- AlterTable
ALTER TABLE `project` ADD COLUMN `activeRuleSetVersionId` INTEGER NULL;

-- AlterTable
ALTER TABLE `rule_set` ADD COLUMN `draftDefinition` JSON NULL,
    ADD COLUMN `draftUpdatedAt` DATETIME(3) NULL,
    ADD COLUMN `draftVariables` JSON NULL;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_activeRuleSetVersionId_fkey` FOREIGN KEY (`activeRuleSetVersionId`) REFERENCES `rule_set_version`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
