package com.todothink.modules.performance.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("perf_item")
public class PerfItem {

    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("settlement_id")
    private Long settlementId;
    @TableField("subject_type")
    private String subjectType;
    @TableField("subject_id")
    private Integer subjectId;
    @TableField("metric_code")
    private String metricCode;
    private BigDecimal value;
    @TableField("source_ledger_entry_id")
    private Long sourceLedgerEntryId;
    @TableField("`explain`")
    private String explain;
    @TableField("created_at")
    private LocalDateTime createTime;
}
