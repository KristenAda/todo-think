-- CreateTable
CREATE TABLE `rule_variable` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(64) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `valueType` VARCHAR(20) NOT NULL,
    `description` VARCHAR(255) NULL,
    `sourcePath` VARCHAR(100) NOT NULL,
    `defaultValue` DECIMAL(18, 6) NULL,
    `scope` VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',
    `projectId` INTEGER NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rule_variable_code_key`(`code`),
    INDEX `rule_variable_scope_projectId_enabled_sort_idx`(`scope`, `projectId`, `enabled`, `sort`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
