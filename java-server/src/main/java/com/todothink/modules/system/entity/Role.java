package com.todothink.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("roles")
public class Role {

    @TableId(type = IdType.AUTO)
    private Integer id;
    private String roleName;
    private String roleCode;
    private String description;
    private Boolean enabled;
    private Integer sort;
    private Integer dataScope;
    private Boolean isDefaultRole;
    private String remark;
    @TableField("created_at")
    private LocalDateTime createTime;
    @TableField("updated_at")
    private LocalDateTime updateTime;
    private LocalDateTime deletedAt;
}
