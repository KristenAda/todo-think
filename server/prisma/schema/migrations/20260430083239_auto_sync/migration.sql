-- AlterTable
ALTER TABLE `task` ADD COLUMN `baseScore` DOUBLE NULL,
    ADD COLUMN `baseScoreSource` VARCHAR(20) NOT NULL DEFAULT 'AUTO',
    ADD COLUMN `suggestedBaseScore` DOUBLE NULL;
