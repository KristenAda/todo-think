package com.todothink.modules.performance.controller;

import com.todothink.core.exception.BusinessException;
import com.todothink.core.result.Result;
import com.todothink.core.security.SecurityUtils;
import com.todothink.modules.performance.service.PerformanceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class PerformanceController {

    private final PerformanceService performanceService;

    public PerformanceController(PerformanceService performanceService) {
        this.performanceService = performanceService;
    }

    @GetMapping("/performance/my-total-points")
    public Result<?> myTotalPoints() {
        Integer userId = SecurityUtils.currentUserId();
        return Result.success(performanceService.myTotalPoints(userId));
    }

    @GetMapping("/performance/stats")
    public Result<?> stats(@RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Integer projectId,
            @RequestParam(required = false) String startAt,
            @RequestParam(required = false) String endAt,
            @RequestParam(required = false, defaultValue = "false") boolean pickSelf) {
        if (page <= 0 || pageSize <= 0 || pageSize > 1000) {
            return Result.error("参数错误");
        }
        Map<String, Object> data = performanceService.stats(page, pageSize, projectId, startAt, endAt, pickSelf,
                SecurityUtils.currentUserId());
        return Result.success(data);
    }

    @GetMapping("/performance/reconcile/{id}")
    public Result<?> reconcileTask(@PathVariable("id") Integer taskId) {
        if (taskId == null || taskId <= 0) {
            return Result.error("taskId 参数错误");
        }
        try {
            return Result.success(performanceService.reconcileTask(taskId, SecurityUtils.currentUserId()));
        } catch (BusinessException ex) {
            return Result.error(ex.getMessage(), ex.getCode());
        }
    }

    @GetMapping("/performance/points-ledger/mine")
    public Result<?> pointsLedgerPageMine(@RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) Integer projectId,
            @RequestParam(required = false) Integer taskId,
            @RequestParam(required = false) String bizType,
            @RequestParam(required = false) String startAt,
            @RequestParam(required = false) String endAt) {
        return pointsLedgerPageInternal(page, pageSize, projectId, taskId, null, bizType, startAt, endAt, true);
    }

    @GetMapping("/performance/points-ledger")
    public Result<?> pointsLedgerPage(@RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) Integer projectId,
            @RequestParam(required = false) Integer taskId,
            @RequestParam(required = false) Integer userOwnerId,
            @RequestParam(required = false) String bizType,
            @RequestParam(required = false) String startAt,
            @RequestParam(required = false) String endAt) {
        return pointsLedgerPageInternal(page, pageSize, projectId, taskId, userOwnerId, bizType, startAt, endAt, false);
    }

    @GetMapping("/performance/points-ledger/{entryId}")
    public Result<?> pointsLedgerDetail(@PathVariable String entryId) {
        if (entryId == null || entryId.trim().isEmpty()) {
            return Result.error("记录 ID 不能为空");
        }
        try {
            return Result.success(performanceService.ledgerDetail(entryId.trim(), SecurityUtils.currentUserId()));
        } catch (BusinessException ex) {
            return Result.error(ex.getMessage(), ex.getCode());
        }
    }

    private Result<?> pointsLedgerPageInternal(int page, int pageSize, Integer projectId, Integer taskId,
            Integer userOwnerId, String bizType, String startAt, String endAt, boolean selfOnly) {
        if (page <= 0 || pageSize <= 0 || pageSize > 200) {
            return Result.error("参数错误");
        }
        Map<String, Object> raw = performanceService.ledgerPage(page, pageSize, projectId, taskId, userOwnerId, bizType,
                startAt, endAt, SecurityUtils.currentUserId(), selfOnly);
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("list", raw.get("list"));
        data.put("total", raw.get("total"));
        data.put("page", page);
        data.put("pageSize", pageSize);
        long total = raw.get("total") instanceof Number ? ((Number) raw.get("total")).longValue() : 0L;
        data.put("totalPage", (int) Math.ceil(total * 1.0 / pageSize));
        data.put("summary", raw.get("summary"));
        return Result.success(data);
    }
}
