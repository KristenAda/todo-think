-- AlterTable
ALTER TABLE `task` ADD COLUMN `acceptedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `perf_settlement` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `settlementKey` VARCHAR(80) NOT NULL,
    `settlementType` VARCHAR(30) NOT NULL,
    `projectId` INTEGER NOT NULL,
    `taskId` INTEGER NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `errorMessage` TEXT NULL,
    `ruleSetVersionId` INTEGER NULL,
    `replacesSettlementId` BIGINT NULL,
    `inputSnapshot` JSON NOT NULL,
    `outputSnapshot` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `settledAt` DATETIME(3) NULL,

    UNIQUE INDEX `perf_settlement_settlementKey_key`(`settlementKey`),
    INDEX `perf_settlement_taskId_occurredAt_idx`(`taskId`, `occurredAt`),
    INDEX `perf_settlement_projectId_occurredAt_idx`(`projectId`, `occurredAt`),
    INDEX `perf_settlement_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perf_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `settlementId` BIGINT NOT NULL,
    `subjectType` VARCHAR(20) NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `metricCode` VARCHAR(40) NOT NULL,
    `value` DECIMAL(18, 6) NOT NULL,
    `sourceLedgerEntryId` BIGINT NULL,
    `explain` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `perf_item_subjectType_subjectId_idx`(`subjectType`, `subjectId`),
    INDEX `perf_item_metricCode_idx`(`metricCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `points_account` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `ownerType` VARCHAR(20) NOT NULL,
    `ownerId` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `points_account_ownerType_ownerId_key`(`ownerType`, `ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `points_ledger_entry` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `accountId` BIGINT NOT NULL,
    `bizType` VARCHAR(30) NOT NULL,
    `bizId` VARCHAR(64) NOT NULL,
    `projectId` INTEGER NULL,
    `taskId` INTEGER NULL,
    `ruleSetVersionId` INTEGER NULL,
    `pointsType` VARCHAR(40) NOT NULL,
    `amount` INTEGER NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `idempotencyKey` VARCHAR(128) NOT NULL,
    `explain` JSON NULL,

    UNIQUE INDEX `points_ledger_entry_idempotencyKey_key`(`idempotencyKey`),
    INDEX `points_ledger_entry_bizType_bizId_idx`(`bizType`, `bizId`),
    INDEX `points_ledger_entry_projectId_occurredAt_idx`(`projectId`, `occurredAt`),
    INDEX `points_ledger_entry_taskId_idx`(`taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rule_set` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `scope` VARCHAR(20) NOT NULL DEFAULT 'PROJECT',
    `projectId` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rule_set_code_key`(`code`),
    INDEX `rule_set_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rule_set_version` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ruleSetId` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `publishedBy` INTEGER NULL,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `effectiveFrom` DATETIME(3) NULL,
    `effectiveTo` DATETIME(3) NULL,
    `checksum` VARCHAR(128) NOT NULL,
    `definition` JSON NOT NULL,

    INDEX `rule_set_version_ruleSetId_publishedAt_idx`(`ruleSetId`, `publishedAt`),
    UNIQUE INDEX `rule_set_version_ruleSetId_version_key`(`ruleSetId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rule_execution` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `ruleSetVersionId` INTEGER NOT NULL,
    `triggerType` VARCHAR(40) NOT NULL,
    `triggerId` VARCHAR(64) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `errorMessage` TEXT NULL,
    `inputSnapshot` JSON NOT NULL,
    `outputSnapshot` JSON NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    INDEX `rule_execution_ruleSetVersionId_startedAt_idx`(`ruleSetVersionId`, `startedAt`),
    INDEX `rule_execution_triggerType_triggerId_idx`(`triggerType`, `triggerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `perf_settlement` ADD CONSTRAINT `perf_settlement_ruleSetVersionId_fkey` FOREIGN KEY (`ruleSetVersionId`) REFERENCES `rule_set_version`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perf_settlement` ADD CONSTRAINT `perf_settlement_replacesSettlementId_fkey` FOREIGN KEY (`replacesSettlementId`) REFERENCES `perf_settlement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perf_item` ADD CONSTRAINT `perf_item_settlementId_fkey` FOREIGN KEY (`settlementId`) REFERENCES `perf_settlement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perf_item` ADD CONSTRAINT `perf_item_sourceLedgerEntryId_fkey` FOREIGN KEY (`sourceLedgerEntryId`) REFERENCES `points_ledger_entry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `points_ledger_entry` ADD CONSTRAINT `points_ledger_entry_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `points_account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `points_ledger_entry` ADD CONSTRAINT `points_ledger_entry_ruleSetVersionId_fkey` FOREIGN KEY (`ruleSetVersionId`) REFERENCES `rule_set_version`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rule_set_version` ADD CONSTRAINT `rule_set_version_ruleSetId_fkey` FOREIGN KEY (`ruleSetId`) REFERENCES `rule_set`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rule_execution` ADD CONSTRAINT `rule_execution_ruleSetVersionId_fkey` FOREIGN KEY (`ruleSetVersionId`) REFERENCES `rule_set_version`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
