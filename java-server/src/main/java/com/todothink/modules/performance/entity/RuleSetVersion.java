package com.todothink.modules.performance.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("rule_set_version")
public class RuleSetVersion {

    @TableId(type = IdType.AUTO)
    private Integer id;
    @TableField("rule_set_id")
    private Integer ruleSetId;
    private Integer version;
    @TableField("published_by")
    private Integer publishedBy;
    @TableField("published_at")
    private LocalDateTime publishedAt;
    @TableField("effective_from")
    private LocalDateTime effectiveFrom;
    @TableField("effective_to")
    private LocalDateTime effectiveTo;
    private String checksum;
    private String definition;
}
