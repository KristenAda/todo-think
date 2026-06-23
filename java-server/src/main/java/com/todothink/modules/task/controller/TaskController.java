package com.todothink.modules.task.controller;

import com.todothink.core.exception.BusinessException;
import com.todothink.core.result.Result;
import com.todothink.core.security.SecurityUtils;
import com.todothink.modules.task.dto.CreateTaskCommentRequest;
import com.todothink.modules.task.dto.CreateWorkLogRequest;
import com.todothink.modules.task.dto.QaAuditRequest;
import com.todothink.modules.task.dto.SubmitTestRequest;
import com.todothink.modules.task.service.TaskService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@Validated
@RestController
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/tasks")
    public Result<?> page(@RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Integer projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer mainAssigneeId,
            @RequestParam(required = false) String keyword) {
        if (page <= 0) {
            return Result.error("参数错误");
        }
        if (pageSize <= 0 || pageSize > 100) {
            return Result.error("参数错误");
        }
        Map<String, Object> res = taskService.page(page, pageSize, projectId, status, mainAssigneeId, keyword,
                SecurityUtils.currentUserId());
        return Result.page((List<?>) res.get("list"), (Long) res.get("total"), page, pageSize);
    }

    @GetMapping("/tasks/{id}")
    public Result<?> info(@PathVariable Integer id) {
        Map<String, Object> data = taskService.info(id, SecurityUtils.currentUserId());
        if (data == null) {
            return Result.error("任务不存在", 404);
        }
        return Result.success(data);
    }

    @PostMapping("/tasks")
    public Result<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        try {
            return Result.success(taskService.create(body, SecurityUtils.currentUserId()), "创建成功");
        } catch (BusinessException ex) {
            return Result.error(ex.getMessage(), ex.getCode());
        }
    }

    @PutMapping("/tasks/{id}")
    public Result<Map<String, Object>> update(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            return Result.success(taskService.update(id, body, SecurityUtils.currentUserId()), "更新成功");
        } catch (BusinessException ex) {
            return Result.error(ex.getMessage(), ex.getCode());
        }
    }

    @DeleteMapping("/tasks/{id}")
    public Result<?> delete(@PathVariable Integer id) {
        try {
            taskService.delete(id, SecurityUtils.currentUserId());
            return Result.success(null, "删除成功");
        } catch (BusinessException ex) {
            return Result.error(ex.getMessage(), ex.getCode());
        }
    }

    @PostMapping("/tasks/{id}/start-work")
    public Result<Map<String, Object>> startWork(@PathVariable Integer id) {
        return Result.success(taskService.startWork(id, SecurityUtils.currentUserId()), "已开始开发");
    }

    @PostMapping("/tasks/{id}/worklogs")
    public Result<Map<String, Object>> addWorkLog(@PathVariable Integer id,
            @Valid @RequestBody CreateWorkLogRequest body) {
        return Result.success(taskService.addWorkLog(id, SecurityUtils.currentUserId(), body), "工时登记成功");
    }

    @PostMapping("/tasks/{id}/comments")
    public Result<Map<String, Object>> addComment(@PathVariable Integer id,
            @Valid @RequestBody CreateTaskCommentRequest body) {
        return Result.success(taskService.addComment(id, SecurityUtils.currentUserId(), body), "评论发布成功");
    }

    @PostMapping("/tasks/{id}/submit-test")
    public Result<Map<String, Object>> submitTest(@PathVariable Integer id,
            @Valid @RequestBody SubmitTestRequest body) {
        return Result.success(taskService.submitTest(id, SecurityUtils.currentUserId(), body), "已提交验收");
    }

    @PostMapping("/tasks/{id}/qa-audit")
    public Result<Map<String, Object>> qaAudit(@PathVariable Integer id,
            @Valid @RequestBody QaAuditRequest body) {
        return Result.success(taskService.qaAudit(id, SecurityUtils.currentUserId(), body), "验收完成");
    }

    @PostMapping("/tasks/{id}/pause")
    public Result<Map<String, Object>> pauseTask(@PathVariable Integer id) {
        return Result.success(taskService.pauseTask(id, SecurityUtils.currentUserId()), "任务已暂停");
    }

    @PostMapping("/tasks/{id}/resume")
    public Result<Map<String, Object>> resumeTask(@PathVariable Integer id) {
        return Result.success(taskService.resumeTask(id, SecurityUtils.currentUserId()), "任务已恢复开发");
    }

    @PostMapping("/tasks/{id}/reopen")
    public Result<Map<String, Object>> reopenTask(@PathVariable Integer id) {
        return Result.success(taskService.reopenTask(id, SecurityUtils.currentUserId()), "任务已重新打开");
    }
}
