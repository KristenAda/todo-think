package com.todothink.modules.performance.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("perf_settlement")
public class PerfSettlement {

    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("settlement_key")
    private String settlementKey;
    @TableField("settlement_type")
    private String settlementType;
    @TableField("project_id")
    private Integer projectId;
    @TableField("task_id")
    private Integer taskId;
    @TableField("occurred_at")
    private LocalDateTime occurredAt;
    private String status;
    @TableField("error_message")
    private String errorMessage;
    @TableField("rule_set_version_id")
    private Integer ruleSetVersionId;
    @TableField("replaces_settlement_id")
    private Long replacesSettlementId;
    @TableField("input_snapshot")
    private String inputSnapshot;
    @TableField("output_snapshot")
    private String outputSnapshot;
    @TableField("created_at")
    private LocalDateTime createTime;
    @TableField("updated_at")
    private LocalDateTime updateTime;
    @TableField("settled_at")
    private LocalDateTime settledAt;
}
