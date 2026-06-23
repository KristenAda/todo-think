package com.todothink.modules.performance.controller;

import com.todothink.core.result.Result;
import com.todothink.core.security.SecurityUtils;
import com.todothink.modules.performance.entity.PerfSettlement;
import com.todothink.modules.performance.entity.RuleSet;
import com.todothink.modules.performance.entity.RuleSetVersion;
import com.todothink.modules.performance.service.RuleSetService;
import com.todothink.modules.performance.service.RuleVariableService;
import com.todothink.modules.performance.service.SettlementService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
public class PerformanceRuleController {

    private final RuleSetService ruleSetService;
    private final RuleVariableService ruleVariableService;
    private final SettlementService settlementService;

    public PerformanceRuleController(RuleSetService ruleSetService, RuleVariableService ruleVariableService,
            SettlementService settlementService) {
        this.ruleSetService = ruleSetService;
        this.ruleVariableService = ruleVariableService;
        this.settlementService = settlementService;
    }

    @GetMapping("/rule-sets")
    public Result<?> ruleSetList(@RequestParam(required = false) Integer projectId) {
        return Result.success(ruleSetService.listRuleSets(projectId));
    }

    @PostMapping("/rule-sets")
    public Result<?> ruleSetCreate(@RequestBody Map<String, Object> body) {
        try {
            RuleSet created = ruleSetService.createRuleSet(body);
            return Result.success(created, "创建成功");
        } catch (IllegalArgumentException ex) {
            return Result.error(ex.getMessage());
        }
    }

    @PutMapping("/rule-sets/{id}")
    public Result<?> ruleSetUpdate(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            RuleSet updated = ruleSetService.updateRuleSet(id, body);
            return Result.success(updated, "更新成功");
        } catch (IllegalArgumentException ex) {
            return Result.error(ex.getMessage());
        }
    }

    @PutMapping("/rule-sets/{id}/draft")
    public Result<?> ruleSetDraftSave(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        if (id == null || id <= 0) {
            return Result.error("规则集ID错误");
        }
        try {
            RuleSet updated = ruleSetService.saveDraft(id, body);
            return Result.success(updated, "草稿已保存");
        } catch (IllegalArgumentException ex) {
            return Result.error(ex.getMessage());
        }
    }

    @DeleteMapping("/rule-sets/{id}")
    public Result<?> ruleSetDelete(@PathVariable Integer id) {
        if (id == null || id <= 0) {
            return Result.error("规则集ID错误");
        }
        try {
            RuleSet updated = ruleSetService.deleteRuleSet(id);
            return Result.success(updated, "删除成功");
        } catch (IllegalArgumentException ex) {
            return Result.error(ex.getMessage());
        }
    }

    @GetMapping("/rule-sets/{id}/versions")
    public Result<?> ruleSetVersionList(@PathVariable Integer id) {
        return Result.success(ruleSetService.listVersions(id));
    }

    @GetMapping("/rule-set-versions/{versionId}")
    public Result<?> ruleSetVersionDetail(@PathVariable Integer versionId) {
        if (versionId == null || versionId <= 0) {
            return Result.error("versionId 参数错误");
        }
        Map<String, Object> detail = ruleSetService.versionDetail(versionId);
        if (detail == null) {
            return Result.error("规则版本不存在", 404);
        }
        return Result.success(detail);
    }

    @PostMapping("/rule-sets/{id}/publish")
    public Result<?> ruleSetPublish(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            RuleSetVersion created = ruleSetService.publish(id, body, SecurityUtils.currentUserId());
            return Result.success(created, "发布成功");
        } catch (IllegalArgumentException ex) {
            return Result.error(ex.getMessage());
        }
    }

    @PostMapping("/rule-sets/simulate")
    public Result<?> ruleSetSimulate(@RequestBody Map<String, Object> body) {
        try {
            return Result.success(ruleSetService.simulate(body));
        } catch (IllegalArgumentException ex) {
            return Result.error(ex.getMessage(), ex.getMessage().contains("不存在") ? 404 : 500);
        }
    }

    @PostMapping("/rule-sets/adjustments")
    public Result<?> createTaskAdjustment(@RequestBody Map<String, Object> body) {
        try {
            Integer taskId = parsePositiveInt(body.get("taskId"));
            if (taskId == null) {
                return Result.error("参数错误");
            }
            Integer ruleSetVersionId = parsePositiveInt(body.get("ruleSetVersionId"));
            LocalDateTime occurredAt = parseDateTime(body.get("occurredAt"));
            if (occurredAt == null) {
                occurredAt = LocalDateTime.now();
            }
            PerfSettlement settlement = settlementService.createAdjustmentSettlementForTask(taskId, ruleSetVersionId,
                    occurredAt);
            return Result.success(settlement, "已创建补差结算任务");
        } catch (IllegalArgumentException ex) {
            return Result.error(ex.getMessage());
        }
    }

    @GetMapping("/rule-variables")
    public Result<?> variableList(@RequestParam(required = false) Integer projectId) {
        return Result.success(ruleVariableService.listVariables(projectId));
    }

    @PostMapping("/rule-variables/upsert")
    public Result<?> variableUpsert(@RequestBody Map<String, Object> body) {
        try {
            return Result.success(ruleVariableService.upsertVariables(body), "变量配置保存成功");
        } catch (IllegalArgumentException ex) {
            return Result.error(ex.getMessage());
        }
    }

    private Integer parsePositiveInt(Object value) {
        if (value == null || "null".equalsIgnoreCase(String.valueOf(value))) {
            return null;
        }
        int n = Integer.parseInt(String.valueOf(value));
        return n > 0 ? n : null;
    }

    private LocalDateTime parseDateTime(Object value) {
        if (value == null || "null".equalsIgnoreCase(String.valueOf(value))) {
            return null;
        }
        String text = String.valueOf(value);
        try {
            return OffsetDateTime.parse(text).toLocalDateTime();
        } catch (DateTimeParseException ex) {
            return LocalDateTime.parse(text.replace(" ", "T"));
        }
    }
}
