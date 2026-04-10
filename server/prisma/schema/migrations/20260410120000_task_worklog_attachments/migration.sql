-- CreateTable
CREATE TABLE `task_attachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskId` INTEGER NOT NULL,
    `attachmentId` INTEGER NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `task_attachment_taskId_attachmentId_key`(`taskId`, `attachmentId`),
    INDEX `task_attachment_attachmentId_idx`(`attachmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_log_attachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workLogId` INTEGER NOT NULL,
    `attachmentId` INTEGER NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `work_log_attachment_workLogId_attachmentId_key`(`workLogId`, `attachmentId`),
    INDEX `work_log_attachment_attachmentId_idx`(`attachmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `task_attachment` ADD CONSTRAINT `task_attachment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_attachment` ADD CONSTRAINT `task_attachment_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_log_attachment` ADD CONSTRAINT `work_log_attachment_workLogId_fkey` FOREIGN KEY (`workLogId`) REFERENCES `work_log`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_log_attachment` ADD CONSTRAINT `work_log_attachment_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
