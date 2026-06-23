-- 附件模块表（与 prisma/schema/system/attachment.prisma 一致）
-- 若已用 `npx prisma migrate dev` 则无需执行本脚本

CREATE TABLE IF NOT EXISTS `attachment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `original_name` VARCHAR(191) NOT NULL,
  `stored_path` VARCHAR(1024) NOT NULL,
  `mime_type` VARCHAR(200) NULL,
  `size` INT NOT NULL,
  `uploaded_by_id` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `attachment_uploadedById_idx` (`uploaded_by_id`),
  INDEX `attachment_createTime_idx` (`created_at`),
  CONSTRAINT `attachment_uploadedById_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `upload_session` (
  `id` VARCHAR(191) NOT NULL,
  `file_name` VARCHAR(191) NOT NULL,
  `mime_type` VARCHAR(200) NULL,
  `total_size` INT NOT NULL,
  `chunk_size` INT NOT NULL,
  `total_chunks` INT NOT NULL,
  `user_id` INT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `attachment_id` INT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `upload_session_attachmentId_key` (`attachment_id`),
  INDEX `upload_session_userId_idx` (`user_id`),
  CONSTRAINT `upload_session_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `upload_session_attachmentId_fkey` FOREIGN KEY (`attachment_id`) REFERENCES `attachment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
