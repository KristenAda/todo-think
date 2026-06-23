package com.todothink.modules.task.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@Data
public class QaAuditRequest {

    private List<TestCaseQaResultItem> testCaseResults = new ArrayList<TestCaseQaResultItem>();

    @Positive
    private Double actualHours;

    private String decision;

    @Size(min = 1, max = 500)
    private String qaRejectReason;

    @Data
    public static class TestCaseQaResultItem {

        @NotNull
        @Positive
        private Integer id;

        @NotNull
        private String qaStatus;

        private String qaRemark;
    }
}
