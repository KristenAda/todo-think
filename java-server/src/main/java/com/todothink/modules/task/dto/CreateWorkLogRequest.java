package com.todothink.modules.task.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Size;
import java.util.List;

@Data
public class CreateWorkLogRequest {

    @Positive(message = "工时必须大于0")
    private Double hours;

    @NotBlank(message = "工作内容不能为空")
    private String content;

    @Size(max = 50)
    private List<@Positive Integer> attachmentIds;
}
