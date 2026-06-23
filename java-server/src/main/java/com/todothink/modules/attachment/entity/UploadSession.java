package com.todothink.modules.attachment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("upload_session")
public class UploadSession {

    @TableId(type = IdType.INPUT)
    private String id;
    private String fileName;
    private String mimeType;
    private Integer totalSize;
    private Integer chunkSize;
    private Integer totalChunks;
    private Integer userId;
    private String status;
    private Integer attachmentId;
    private LocalDateTime expiresAt;
    @TableField("created_at")
    private LocalDateTime createTime;
}
