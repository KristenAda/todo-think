package com.todothink.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("departments")
public class Department {

    @TableId(type = IdType.AUTO)
    private Integer id;
    private Integer parentId;
    private String ancestors;
    private String name;
    private Integer sort;
    private String leader;
    private String phone;
    private String email;
    private Integer status;
    @TableField("created_at")
    private LocalDateTime createTime;
    @TableField("updated_at")
    private LocalDateTime updateTime;
    private LocalDateTime deletedAt;
}
