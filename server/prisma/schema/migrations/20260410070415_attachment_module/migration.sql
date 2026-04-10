-- CreateTable
CREATE TABLE `attachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `originalName` VARCHAR(191) NOT NULL,
    `storedPath` VARCHAR(1024) NOT NULL,
    `mimeType` VARCHAR(200) NULL,
    `size` INTEGER NOT NULL,
    `uploadedById` INTEGER NOT NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `attachment_uploadedById_idx`(`uploadedById`),
    INDEX `attachment_createTime_idx`(`createTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `upload_session` (
    `id` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(200) NULL,
    `totalSize` INTEGER NOT NULL,
    `chunkSize` INTEGER NOT NULL,
    `totalChunks` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `attachmentId` INTEGER NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `upload_session_attachmentId_key`(`attachmentId`),
    INDEX `upload_session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attachment` ADD CONSTRAINT `attachment_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upload_session` ADD CONSTRAINT `upload_session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upload_session` ADD CONSTRAINT `upload_session_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
