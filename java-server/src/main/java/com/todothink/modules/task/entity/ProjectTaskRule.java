package com.todothink.modules.task.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("project_task_rule")
public class ProjectTaskRule {

    @TableId(type = IdType.AUTO)
    private Integer id;
    @TableField("project_id")
    private Integer projectId;
    @TableField("require_estimate_hours")
    private Boolean requireEstimateHours;
    @TableField("require_due_date")
    private Boolean requireDueDate;
    @TableField("require_test_evidence_for_dev")
    private Boolean requireTestEvidenceForDev;
    @TableField("allow_co_assignee_submit_qa")
    private Boolean allowCoAssigneeSubmitQa;
    @TableField("allow_qa_reject_without_hours")
    private Boolean allowQaRejectWithoutHours;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
