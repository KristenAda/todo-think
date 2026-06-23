package com.todothink.modules.task.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("task")
public class Task {

    @TableId(type = IdType.AUTO)
    private Integer id;
    @TableField("project_id")
    private Integer projectId;
    @TableField("org_id")
    private Integer orgId;
    private Integer version;
    @TableField("parent_id")
    private Integer parentId;
    private String type;
    @TableField("work_domain")
    private String workDomain;
    private String priority;
    @TableField("due_date")
    private LocalDateTime dueDate;
    private String title;
    private String description;
    private String status;
    @TableField("manager_id")
    private Integer managerId;
    @TableField("main_assignee_id")
    private Integer mainAssigneeId;
    @TableField("tester_id")
    private Integer testerId;
    @TableField("estimated_hours")
    private Double estimatedHours;
    @TableField("actual_hours")
    private Double actualHours;
    @TableField("suggested_base_score")
    private Double suggestedBaseScore;
    @TableField("base_score")
    private Double baseScore;
    @TableField("base_score_source")
    private String baseScoreSource;
    @TableField("complexity_tier")
    private String complexityTier;
    private Double complexity;
    @TableField("qa_reject_reason")
    private String qaRejectReason;
    @TableField("created_at")
    private LocalDateTime createTime;
    @TableField("updated_at")
    private LocalDateTime updateTime;
    @TableField("accepted_at")
    private LocalDateTime acceptedAt;
}
