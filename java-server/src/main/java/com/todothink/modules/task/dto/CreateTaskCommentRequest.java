package com.todothink.modules.task.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Size;
import java.util.List;

@Data
public class CreateTaskCommentRequest {

    @NotBlank(message = "评论内容不能为空")
    @Size(max = 2000)
    private String content;

    @Size(max = 20)
    private List<@Positive Integer> attachmentIds;
}
