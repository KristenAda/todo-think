-- CreateTable
CREATE TABLE `message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `title` VARCHAR(200) NULL COMMENT '消息标题（可为空；用于通知类消息的短标题）',
    `content` LONGTEXT NOT NULL COMMENT '消息内容（正文）',
    `message_type` ENUM('SYSTEM', 'TASK', 'DIRECT') NOT NULL DEFAULT 'SYSTEM' COMMENT '消息类型（SYSTEM/TASK/DIRECT）',
    `sender_id` INTEGER NULL COMMENT '发送者用户ID（系统消息可为空）',
    `receiver_id` INTEGER NOT NULL COMMENT '接收者用户ID',
    `is_read` BOOLEAN NOT NULL DEFAULT false COMMENT '是否已读',
    `read_time` DATETIME(3) NULL COMMENT '已读时间（首次标记已读时写入）',
    `extra` JSON NULL COMMENT '扩展数据（可选；用于携带业务跳转信息等，JSON）',
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `update_time` DATETIME(3) NOT NULL COMMENT '更新时间',
    `deleted_at` DATETIME(3) NULL COMMENT '软删除时间（为空表示未删除）',

    INDEX `idx_message_receiver_read_time`(`receiver_id`, `is_read`, `create_time`),
    INDEX `idx_message_sender_time`(`sender_id`, `create_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='站内消息';

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
