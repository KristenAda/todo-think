package com.todothink.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {

    @TableId(type = IdType.AUTO)
    private Integer id;
    private String userName;
    private String password;
    private String nickName;
    private String userPhone;
    private String userEmail;
    private String userGender;
    private String avatar;
    private String status;
    private String remark;
    private String tags;
    private String createBy;
    @TableField("created_at")
    private LocalDateTime createTime;
    private String updateBy;
    @TableField("updated_at")
    private LocalDateTime updateTime;
    private LocalDateTime deletedAt;
}
