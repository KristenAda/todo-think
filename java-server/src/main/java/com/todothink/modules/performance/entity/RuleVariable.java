package com.todothink.modules.performance.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("rule_variable")
public class RuleVariable {

    @TableId(type = IdType.AUTO)
    private Integer id;
    private String code;
    private String label;
    @TableField("value_type")
    private String valueType;
    private String description;
    @TableField("source_path")
    private String sourcePath;
    @TableField("default_value")
    private BigDecimal defaultValue;
    private String scope;
    @TableField("project_id")
    private Integer projectId;
    private Boolean enabled;
    private Integer sort;
    @TableField("created_at")
    private LocalDateTime createTime;
    @TableField("updated_at")
    private LocalDateTime updateTime;
}
