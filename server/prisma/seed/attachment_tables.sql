-- 附件模块表（与 prisma/schema/system/attachment.prisma 一致）
-- 若已用 `npx prisma migrate dev` 则无需执行本脚本

CREATE TABLE IF NOT EXISTS `attachment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `originalName` VARCHAR(191) NOT NULL,
  `storedPath` VARCHAR(1024) NOT NULL,
  `mimeType` VARCHAR(200) NULL,
  `size` INT NOT NULL,
  `uploadedById` INT NOT NULL,
  `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `attachment_uploadedById_idx` (`uploadedById`),
  INDEX `attachment_createTime_idx` (`createTime`),
  CONSTRAINT `attachment_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `upload_session` (
  `id` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(200) NULL,
  `totalSize` INT NOT NULL,
  `chunkSize` INT NOT NULL,
  `totalChunks` INT NOT NULL,
  `userId` INT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `attachmentId` INT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `upload_session_attachmentId_key` (`attachmentId`),
  INDEX `upload_session_userId_idx` (`userId`),
  CONSTRAINT `upload_session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `upload_session_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `attachment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
