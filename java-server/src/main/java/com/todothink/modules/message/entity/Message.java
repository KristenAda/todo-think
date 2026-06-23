package com.todothink.modules.message.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("message")
public class Message {

    @TableId(type = IdType.AUTO)
    private Integer id;
    private String title;
    private String content;
    private String messageType;
    private Integer senderId;
    private Integer receiverId;
    private Boolean isRead;
    private LocalDateTime readTime;
    private String extra;
    @TableField("create_time")
    private LocalDateTime createTime;
    @TableField("update_time")
    private LocalDateTime updateTime;
    private LocalDateTime deletedAt;
}
