package com.todothink.modules.system.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("dept_managers")
public class DeptManager {

    private Integer deptId;
    private Integer userId;
    private LocalDateTime createdAt;
}
