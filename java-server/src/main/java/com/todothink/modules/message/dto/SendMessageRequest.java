package com.todothink.modules.message.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Data
public class SendMessageRequest {

    @NotNull
    @Positive
    private Integer receiverId;

    private String title;

    @NotBlank
    private String content;

    private String messageType;

    private Object extra;
}
