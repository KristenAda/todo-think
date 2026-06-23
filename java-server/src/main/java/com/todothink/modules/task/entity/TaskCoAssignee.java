package com.todothink.modules.task.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("task_co_assignee")
public class TaskCoAssignee {

    @TableId(type = IdType.AUTO)
    private Integer id;
    @TableField("task_id")
    private Integer taskId;
    @TableField("user_id")
    private Integer userId;
    @TableField("created_at")
    private LocalDateTime createTime;
}
