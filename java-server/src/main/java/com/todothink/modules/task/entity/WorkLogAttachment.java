package com.todothink.modules.task.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("work_log_attachment")
public class WorkLogAttachment {

    @TableId(type = IdType.AUTO)
    private Integer id;
    @TableField("work_log_id")
    private Integer workLogId;
    @TableField("attachment_id")
    private Integer attachmentId;
    private Integer sort;
    @TableField("created_at")
    private LocalDateTime createTime;
}
