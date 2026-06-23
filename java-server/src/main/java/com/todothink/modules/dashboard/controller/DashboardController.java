package com.todothink.modules.dashboard.controller;

import com.todothink.core.exception.BusinessException;
import com.todothink.core.result.Result;
import com.todothink.core.security.SecurityUtils;
import com.todothink.modules.dashboard.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/workbench")
    public Result<?> workbench() {
        Integer userId = SecurityUtils.currentUserId();
        if (userId == null) {
            throw new BusinessException("未登录", 401);
        }
        Map<String, Object> data = dashboardService.workbench(userId);
        return Result.success(data);
    }
}
