-- CreateTable
CREATE TABLE `project_task_rule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `requireEstimateHours` BOOLEAN NOT NULL DEFAULT false,
    `requireDueDate` BOOLEAN NOT NULL DEFAULT false,
    `requireTestEvidenceForDev` BOOLEAN NOT NULL DEFAULT true,
    `allowCoAssigneeSubmitQa` BOOLEAN NOT NULL DEFAULT false,
    `allowQaRejectWithoutHours` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `project_task_rule_projectId_key`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `project_task_rule` ADD CONSTRAINT `project_task_rule_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
