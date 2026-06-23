package com.todothink.modules.task.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.util.ArrayList;
import java.util.List;

@Data
public class SubmitTestRequest {

    private List<TestCaseSelfResultItem> testCaseResults = new ArrayList<TestCaseSelfResultItem>();

    @Data
    public static class TestCaseSelfResultItem {

        @NotNull
        @Positive
        private Integer id;

        @NotNull
        private String selfTestStatus;

        private String selfTestRemark;
    }
}
