package com.todothink.modules.attachment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("attachment")
public class Attachment {

    @TableId(type = IdType.AUTO)
    private Integer id;
    private String originalName;
    private String storedPath;
    private String mimeType;
    private Integer size;
    private Integer uploadedById;
    @TableField("created_at")
    private LocalDateTime createTime;
    private LocalDateTime deletedAt;
}
