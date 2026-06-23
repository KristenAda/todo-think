package com.todothink.modules.task.controller;

import com.todothink.core.exception.BusinessException;
import com.todothink.core.result.Result;
import com.todothink.core.security.SecurityUtils;
import com.todothink.modules.task.service.ProjectService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/projects")
    public Result<?> page(@RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String status) {
        if (page <= 0) {
            return Result.error("参数错误");
        }
        if (pageSize <= 0 || pageSize > 100) {
            return Result.error("参数错误");
        }
        Map<String, Object> res = projectService.page(page, pageSize, name, status,
                SecurityUtils.currentUserId());
        return Result.page((List<?>) res.get("list"), (Long) res.get("total"), page, pageSize);
    }

    @GetMapping("/projects/list")
    public Result<?> list() {
        return Result.success(projectService.list(SecurityUtils.currentUserId()));
    }

    @GetMapping("/projects/org-members")
    public Result<?> orgMembers() {
        Integer uid = SecurityUtils.currentUserId();
        if (uid == null) {
            return Result.error("未登录", 401);
        }
        return Result.success(projectService.orgMembers(uid));
    }

    @GetMapping("/projects/{id}")
    public Result<?> info(@PathVariable Integer id) {
        Map<String, Object> data = projectService.info(id, SecurityUtils.currentUserId());
        if (data == null) {
            return Result.error("项目不存在", 404);
        }
        return Result.success(data);
    }

    @PostMapping("/projects")
    public Result<?> create(@RequestBody Map<String, Object> body) {
        try {
            return Result.success(projectService.create(body, SecurityUtils.currentUserId()), "创建成功");
        } catch (BusinessException ex) {
            return Result.error(ex.getMessage(), ex.getCode());
        }
    }

    @PutMapping("/projects/{id}")
    public Result<?> update(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            return Result.success(projectService.update(id, body, SecurityUtils.currentUserId()), "更新成功");
        } catch (BusinessException ex) {
            return Result.error(ex.getMessage(), ex.getCode());
        }
    }

    @GetMapping("/projects/{id}/task-rules")
    public Result<?> taskRulesInfo(@PathVariable Integer id) {
        return Result.success(projectService.taskRulesInfo(id, SecurityUtils.currentUserId()));
    }

    @PutMapping("/projects/{id}/task-rules")
    public Result<?> taskRulesUpdate(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        projectService.taskRulesUpdate(id, SecurityUtils.currentUserId(), body);
        return Result.success(null, "规则更新成功");
    }

    @GetMapping("/projects/{id}/scoring-rule-versions")
    public Result<?> scoringRuleVersions(@PathVariable Integer id) {
        try {
            return Result.success(projectService.scoringRuleVersionOptions(id, SecurityUtils.currentUserId()));
        } catch (BusinessException ex) {
            return Result.error(ex.getMessage(), ex.getCode());
        }
    }

    @PutMapping("/projects/{id}/active-scoring-rule-version")
    public Result<?> setActiveScoringRuleVersion(@PathVariable Integer id,
            @RequestBody Map<String, Object> body) {
        Object rawVersionId = body.get("activeRuleSetVersionId");
        Integer activeRuleSetVersionId = null;
        if (rawVersionId != null && !"null".equalsIgnoreCase(String.valueOf(rawVersionId))) {
            activeRuleSetVersionId = Integer.valueOf(String.valueOf(rawVersionId));
            if (activeRuleSetVersionId <= 0) {
                return Result.error("参数错误");
            }
        }
        try {
            Map<String, Object> updated = projectService.setActiveScoringRuleVersion(id, activeRuleSetVersionId,
                    SecurityUtils.currentUserId());
            return Result.success(updated, "已更新生效规则版本");
        } catch (BusinessException ex) {
            return Result.error(ex.getMessage(), ex.getCode());
        }
    }

    @DeleteMapping("/projects/{id}")
    public Result<?> delete(@PathVariable Integer id) {
        try {
            projectService.delete(id, SecurityUtils.currentUserId());
            return Result.success(null, "删除成功");
        } catch (BusinessException ex) {
            return Result.error(ex.getMessage(), ex.getCode());
        }
    }
}
