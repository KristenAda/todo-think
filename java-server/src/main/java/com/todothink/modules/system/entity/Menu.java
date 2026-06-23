package com.todothink.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("menus")
public class Menu {

    @TableId(type = IdType.AUTO)
    private Integer id;
    private Integer parentId;
    private String name;
    private String title;
    private String path;
    private String component;
    private String icon;
    private Integer type;
    private Integer sort;
    private Boolean isEnable;
    private Boolean keepAlive;
    private Boolean isIframe;
    private Boolean isHide;
    private Boolean isHideTab;
    private String link;
    private Boolean showBadge;
    private String showTextBadge;
    private Boolean fixedTab;
    private String activePath;
    private Boolean isFullPage;
    private String roles;
    private String authList;
    @TableField("created_at")
    private LocalDateTime createTime;
    @TableField("updated_at")
    private LocalDateTime updateTime;
}
