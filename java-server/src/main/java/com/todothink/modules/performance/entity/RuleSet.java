package com.todothink.modules.performance.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("rule_set")
public class RuleSet {

    @TableId(type = IdType.AUTO)
    private Integer id;
    private String code;
    private String name;
    private String scope;
    @TableField("project_id")
    private Integer projectId;
    private String status;
    @TableField("draft_definition")
    private String draftDefinition;
    @TableField("draft_variables")
    private String draftVariables;
    @TableField("draft_updated_at")
    private LocalDateTime draftUpdatedAt;
    @TableField("created_at")
    private LocalDateTime createTime;
    @TableField("updated_at")
    private LocalDateTime updateTime;
}
