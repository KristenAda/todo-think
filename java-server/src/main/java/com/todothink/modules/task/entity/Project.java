package com.todothink.modules.task.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("project")
public class Project {

    @TableId(type = IdType.AUTO)
    private Integer id;
    private String name;
    private String description;
    @TableField("org_id")
    private Integer orgId;
    private Integer version;
    @TableField("manager_id")
    private Integer managerId;
    private String status;
    @TableField("start_date")
    private LocalDateTime startDate;
    @TableField("end_date")
    private LocalDateTime endDate;
    @TableField("created_at")
    private LocalDateTime createTime;
    @TableField("updated_at")
    private LocalDateTime updateTime;
    @TableField("deleted_at")
    private LocalDateTime deletedAt;
    @TableField("active_rule_set_version_id")
    private Integer activeRuleSetVersionId;
}
