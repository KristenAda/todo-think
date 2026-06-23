package com.todothink.modules.performance.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("rule_execution")
public class RuleExecution {

    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("rule_set_version_id")
    private Integer ruleSetVersionId;
    @TableField("trigger_type")
    private String triggerType;
    @TableField("trigger_id")
    private String triggerId;
    private String status;
    @TableField("error_message")
    private String errorMessage;
    @TableField("input_snapshot")
    private String inputSnapshot;
    @TableField("output_snapshot")
    private String outputSnapshot;
    @TableField("started_at")
    private LocalDateTime startedAt;
    @TableField("ended_at")
    private LocalDateTime endedAt;
}
