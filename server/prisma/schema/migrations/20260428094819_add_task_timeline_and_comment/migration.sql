-- CreateTable
CREATE TABLE `task_comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `task_comment_taskId_createdAt_idx`(`taskId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_comment_attachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `commentId` INTEGER NOT NULL,
    `attachmentId` INTEGER NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `task_comment_attachment_attachmentId_idx`(`attachmentId`),
    UNIQUE INDEX `task_comment_attachment_commentId_attachmentId_key`(`commentId`, `attachmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_timeline` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskId` INTEGER NOT NULL,
    `eventType` VARCHAR(40) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `content` TEXT NULL,
    `fromStatus` ENUM('PENDING', 'IN_PROGRESS', 'SELF_TESTING', 'QA_REVIEW', 'REJECTED', 'COMPLETED', 'PAUSED', 'CANCELLED') NULL,
    `toStatus` ENUM('PENDING', 'IN_PROGRESS', 'SELF_TESTING', 'QA_REVIEW', 'REJECTED', 'COMPLETED', 'PAUSED', 'CANCELLED') NULL,
    `operatorId` INTEGER NULL,
    `payload` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `task_timeline_taskId_createdAt_idx`(`taskId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `task_comment` ADD CONSTRAINT `task_comment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_comment` ADD CONSTRAINT `task_comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_comment_attachment` ADD CONSTRAINT `task_comment_attachment_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `task_comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_comment_attachment` ADD CONSTRAINT `task_comment_attachment_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_timeline` ADD CONSTRAINT `task_timeline_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_timeline` ADD CONSTRAINT `task_timeline_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
