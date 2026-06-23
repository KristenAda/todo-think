package com.todothink.modules.task.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("test_case")
public class TestCase {

    @TableId(type = IdType.AUTO)
    private Integer id;
    @TableField("task_id")
    private Integer taskId;
    private String description;
    @TableField("expected_result")
    private String expectedResult;
    @TableField("self_test_status")
    private String selfTestStatus;
    @TableField("self_test_remark")
    private String selfTestRemark;
    @TableField("qa_status")
    private String qaStatus;
    @TableField("qa_remark")
    private String qaRemark;
    @TableField("bug_count")
    private Integer bugCount;
    @TableField("created_at")
    private LocalDateTime createTime;
    @TableField("updated_at")
    private LocalDateTime updateTime;
}
