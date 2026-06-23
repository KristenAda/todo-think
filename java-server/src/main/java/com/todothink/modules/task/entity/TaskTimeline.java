package com.todothink.modules.task.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("task_timeline")
public class TaskTimeline {

    @TableId(type = IdType.AUTO)
    private Integer id;
    @TableField("task_id")
    private Integer taskId;
    @TableField("event_type")
    private String eventType;
    private String title;
    private String content;
    @TableField("from_status")
    private String fromStatus;
    @TableField("to_status")
    private String toStatus;
    @TableField("operator_id")
    private Integer operatorId;
    private String payload;
    @TableField("created_at")
    private LocalDateTime createTime;
}
