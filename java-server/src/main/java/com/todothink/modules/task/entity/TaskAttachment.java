package com.todothink.modules.task.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("task_attachment")
public class TaskAttachment {

    @TableId(type = IdType.AUTO)
    private Integer id;
    @TableField("task_id")
    private Integer taskId;
    @TableField("attachment_id")
    private Integer attachmentId;
    private Integer sort;
    @TableField("created_at")
    private LocalDateTime createTime;
}
