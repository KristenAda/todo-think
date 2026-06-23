package com.todothink.modules.performance.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("points_ledger_entry")
public class PointsLedgerEntry {

    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("account_id")
    private Long accountId;
    @TableField("biz_type")
    private String bizType;
    @TableField("biz_id")
    private String bizId;
    @TableField("project_id")
    private Integer projectId;
    @TableField("task_id")
    private Integer taskId;
    @TableField("rule_set_version_id")
    private Integer ruleSetVersionId;
    @TableField("points_type")
    private String pointsType;
    private Integer amount;
    @TableField("occurred_at")
    private LocalDateTime occurredAt;
    @TableField("created_at")
    private LocalDateTime createTime;
    @TableField("idempotency_key")
    private String idempotencyKey;
    @TableField("`explain`")
    private String explain;
}
