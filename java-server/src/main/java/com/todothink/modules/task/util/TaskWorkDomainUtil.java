package com.todothink.modules.task.util;

public final class TaskWorkDomainUtil {

    private TaskWorkDomainUtil() {
    }

    /** 仅软件开发类任务启用测试用例与提测/验收流程 */
    public static boolean taskSupportsTestCases(String workDomain) {
        return "SOFTWARE_DEVELOPMENT".equals(workDomain);
    }
}
