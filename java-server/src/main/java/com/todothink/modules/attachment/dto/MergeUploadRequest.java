package com.todothink.modules.attachment.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class MergeUploadRequest {

    @NotBlank
    private String uploadId;
}
