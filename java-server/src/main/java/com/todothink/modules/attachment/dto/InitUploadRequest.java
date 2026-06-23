package com.todothink.modules.attachment.dto;

import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Data
public class InitUploadRequest {

    @NotBlank
    private String fileName;

    @NotNull
    @Positive
    private Integer totalSize;

    @NotNull
    @Positive
    private Integer chunkSize;

    private String mimeType;
}
