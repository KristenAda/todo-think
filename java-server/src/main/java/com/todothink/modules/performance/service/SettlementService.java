package com.todothink.modules.performance.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.ws.WsHub;
import com.todothink.modules.performance.engine.RuleSetEngine;
import com.todothink.modules.performance.entity.PerfItem;
import com.todothink.modules.performance.entity.PerfSettlement;
import com.todothink.modules.performance.entity.PointsAccount;
import com.todothink.modules.performance.entity.PointsLedgerEntry;
import com.todothink.modules.performance.entity.RuleExecution;
import com.todothink.modules.performance.entity.RuleSet;
import com.todothink.modules.performance.entity.RuleSetVersion;
import com.todothink.modules.performance.mapper.PerfItemMapper;
import com.todothink.modules.performance.mapper.PerfSettlementMapper;
import com.todothink.modules.performance.mapper.PointsAccountMapper;
import com.todothink.modules.performance.mapper.PointsLedgerEntryMapper;
import com.todothink.modules.performance.mapper.RuleExecutionMapper;
import com.todothink.modules.performance.mapper.RuleSetMapper;
import com.todothink.modules.performance.mapper.RuleSetVersionMapper;
import com.todothink.modules.performance.support.PerfJson;
import com.todothink.modules.task.entity.Project;
import com.todothink.modules.task.entity.Task;
import com.todothink.modules.task.entity.TaskCoAssignee;
import com.todothink.modules.task.entity.TaskTimeline;
import com.todothink.modules.task.entity.TestCase;
import com.todothink.modules.task.mapper.ProjectMapper;
import com.todothink.modules.task.mapper.TaskCoAssigneeMapper;
import com.todothink.modules.task.mapper.TaskMapper;
import com.todothink.modules.task.mapper.TaskTimelineMapper;
import com.todothink.modules.task.mapper.TestCaseMapper;
import com.todothink.modules.task.support.TaskComplexityTier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class SettlementService {

    private static final Logger log = LoggerFactory.getLogger(SettlementService.class);

    private final PerfSettlementMapper perfSettlementMapper;
    private final PerfItemMapper perfItemMapper;
    private final RuleSetMapper ruleSetMapper;
    private final RuleSetVersionMapper ruleSetVersionMapper;
    private final RuleExecutionMapper ruleExecutionMapper;
    private final PointsAccountMapper pointsAccountMapper;
    private final PointsLedgerEntryMapper pointsLedgerEntryMapper;
    private final TaskMapper taskMapper;
    private final TaskCoAssigneeMapper taskCoAssigneeMapper;
    private final TestCaseMapper testCaseMapper;
    private final TaskTimelineMapper taskTimelineMapper;
    private final ProjectMapper projectMapper;
    private final WsHub wsHub;
    private final ObjectMapper objectMapper;

    public SettlementService(PerfSettlementMapper perfSettlementMapper, PerfItemMapper perfItemMapper,
            RuleSetMapper ruleSetMapper, RuleSetVersionMapper ruleSetVersionMapper,
            RuleExecutionMapper ruleExecutionMapper, PointsAccountMapper pointsAccountMapper,
            PointsLedgerEntryMapper pointsLedgerEntryMapper, TaskMapper taskMapper,
            TaskCoAssigneeMapper taskCoAssigneeMapper, TestCaseMapper testCaseMapper,
            TaskTimelineMapper taskTimelineMapper, ProjectMapper projectMapper, WsHub wsHub,
            ObjectMapper objectMapper) {
        this.perfSettlementMapper = perfSettlementMapper;
        this.perfItemMapper = perfItemMapper;
        this.ruleSetMapper = ruleSetMapper;
        this.ruleSetVersionMapper = ruleSetVersionMapper;
        this.ruleExecutionMapper = ruleExecutionMapper;
        this.pointsAccountMapper = pointsAccountMapper;
        this.pointsLedgerEntryMapper = pointsLedgerEntryMapper;
        this.taskMapper = taskMapper;
        this.taskCoAssigneeMapper = taskCoAssigneeMapper;
        this.testCaseMapper = testCaseMapper;
        this.taskTimelineMapper = taskTimelineMapper;
        this.projectMapper = projectMapper;
        this.wsHub = wsHub;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> simulateRuleSetDefinition(Map<String, Object> definition, Map<String, Object> inputSnapshot) {
        return RuleSetEngine.simulateRuleSetDefinition(definition, inputSnapshot);
    }

    @Transactional
    public void createFirstSettlementForAcceptedTask(Integer taskId) {
        Task task = taskMapper.selectById(taskId);
        if (task == null) {
            throw new IllegalArgumentException("task not found");
        }
        if (task.getAcceptedAt() == null) {
            throw new IllegalArgumentException("task.acceptedAt missing");
        }

        LocalDateTime occurredAt = task.getAcceptedAt();
        Integer ruleSetVersionId = getEffectiveRuleSetVersionId(task.getProjectId(), occurredAt);
        Map<String, Object> inputSnapshot = buildTaskFact(task);
        String settlementKey = "task:" + taskId + ":first:" + occurredAt.toInstant(ZoneOffset.ofHours(8));

        PerfSettlement settlement = new PerfSettlement();
        settlement.setSettlementKey(settlementKey);
        settlement.setSettlementType("first");
        settlement.setProjectId(task.getProjectId());
        settlement.setTaskId(taskId);
        settlement.setOccurredAt(occurredAt);
        settlement.setStatus("PENDING");
        settlement.setRuleSetVersionId(ruleSetVersionId);
        settlement.setInputSnapshot(PerfJson.write(objectMapper, inputSnapshot));
        perfSettlementMapper.insert(settlement);
    }

    @Transactional
    public void createReversalSettlement(Integer taskId, LocalDateTime occurredAt) {
        PerfSettlement last = perfSettlementMapper.selectOne(new LambdaQueryWrapper<PerfSettlement>()
                .eq(PerfSettlement::getTaskId, taskId)
                .eq(PerfSettlement::getStatus, "SUCCEEDED")
                .ne(PerfSettlement::getSettlementType, "reversal")
                .orderByDesc(PerfSettlement::getOccurredAt)
                .last("LIMIT 1"));
        if (last == null) {
            return;
        }

        String settlementKey = "task:" + taskId + ":reversal:" + occurredAt.toInstant(ZoneOffset.ofHours(8)) + ":"
                + last.getId();
        PerfSettlement settlement = new PerfSettlement();
        settlement.setSettlementKey(settlementKey);
        settlement.setSettlementType("reversal");
        settlement.setProjectId(last.getProjectId());
        settlement.setTaskId(taskId);
        settlement.setOccurredAt(occurredAt);
        settlement.setStatus("PENDING");
        settlement.setRuleSetVersionId(last.getRuleSetVersionId());
        settlement.setReplacesSettlementId(last.getId());
        settlement.setInputSnapshot(last.getInputSnapshot());
        perfSettlementMapper.insert(settlement);
    }

    @Transactional
    public PerfSettlement createAdjustmentSettlementForTask(Integer taskId, Integer ruleSetVersionId,
            LocalDateTime occurredAt) {
        PerfSettlement lastEffective = perfSettlementMapper.selectOne(new LambdaQueryWrapper<PerfSettlement>()
                .eq(PerfSettlement::getTaskId, taskId)
                .eq(PerfSettlement::getStatus, "SUCCEEDED")
                .in(PerfSettlement::getSettlementType, "first", "adjustment")
                .orderByDesc(PerfSettlement::getOccurredAt)
                .last("LIMIT 1"));
        if (lastEffective == null) {
            throw new IllegalArgumentException("no effective settlement found for adjustment");
        }

        Integer finalRuleSetVersionId = ruleSetVersionId != null ? ruleSetVersionId
                : getEffectiveRuleSetVersionId(lastEffective.getProjectId(), occurredAt);
        String settlementKey = "task:" + taskId + ":adjustment:" + occurredAt.toInstant(ZoneOffset.ofHours(8)) + ":"
                + lastEffective.getId();

        PerfSettlement settlement = new PerfSettlement();
        settlement.setSettlementKey(settlementKey);
        settlement.setSettlementType("adjustment");
        settlement.setProjectId(lastEffective.getProjectId());
        settlement.setTaskId(taskId);
        settlement.setOccurredAt(occurredAt);
        settlement.setStatus("PENDING");
        settlement.setRuleSetVersionId(finalRuleSetVersionId);
        settlement.setReplacesSettlementId(lastEffective.getId());
        settlement.setInputSnapshot(lastEffective.getInputSnapshot());
        perfSettlementMapper.insert(settlement);
        return settlement;
    }

    @Transactional
    public void settleOnePending(Long settlementId) {
        int claimed = perfSettlementMapper.update(null, new LambdaUpdateWrapper<PerfSettlement>()
                .eq(PerfSettlement::getId, settlementId)
                .eq(PerfSettlement::getStatus, "PENDING")
                .set(PerfSettlement::getStatus, "RUNNING"));
        if (claimed == 0) {
            return;
        }

        PerfSettlement settlement = perfSettlementMapper.selectById(settlementId);
        if (settlement == null) {
            return;
        }

        try {
            if ("reversal".equals(settlement.getSettlementType())) {
                processReversal(settlement);
            } else if ("adjustment".equals(settlement.getSettlementType())) {
                processAdjustment(settlement);
            } else {
                processRuleSettlement(settlement);
            }
            PerfSettlement done = new PerfSettlement();
            done.setId(settlementId);
            done.setStatus("SUCCEEDED");
            done.setSettledAt(LocalDateTime.now());
            perfSettlementMapper.updateById(done);
            notifyPointsSettlementWebSocket(settlementId, settlement.getTaskId());
        } catch (Exception ex) {
            log.error("[perf] settle failed id={}: {}", settlementId, ex.getMessage());
            PerfSettlement failed = new PerfSettlement();
            failed.setId(settlementId);
            failed.setStatus("FAILED");
            failed.setErrorMessage(ex.getMessage());
            perfSettlementMapper.updateById(failed);
        }
    }

    private void processReversal(PerfSettlement settlement) {
        if (settlement.getReplacesSettlementId() == null) {
            throw new IllegalArgumentException("reversal missing replacesSettlementId");
        }
        String originalId = String.valueOf(settlement.getReplacesSettlementId());
        List<PointsLedgerEntry> originalEntries = pointsLedgerEntryMapper.selectList(
                new LambdaQueryWrapper<PointsLedgerEntry>()
                        .eq(PointsLedgerEntry::getBizType, "task_settlement")
                        .eq(PointsLedgerEntry::getBizId, originalId));
        for (PointsLedgerEntry entry : originalEntries) {
            PointsLedgerEntry reversal = new PointsLedgerEntry();
            reversal.setAccountId(entry.getAccountId());
            reversal.setBizType("reversal");
            reversal.setBizId(String.valueOf(settlement.getId()));
            reversal.setProjectId(entry.getProjectId());
            reversal.setTaskId(entry.getTaskId());
            reversal.setRuleSetVersionId(entry.getRuleSetVersionId());
            reversal.setPointsType(entry.getPointsType());
            reversal.setAmount(-entry.getAmount());
            reversal.setOccurredAt(settlement.getOccurredAt());
            reversal.setIdempotencyKey(settlement.getId() + ":rev:" + entry.getId());
            Map<String, Object> explain = new LinkedHashMap<String, Object>();
            explain.put("kind", "reversal");
            explain.put("originalEntryId", String.valueOf(entry.getId()));
            explain.put("originalSettlementId", originalId);
            reversal.setExplain(PerfJson.write(objectMapper, explain));
            pointsLedgerEntryMapper.insert(reversal);
        }
    }

    private void processRuleSettlement(PerfSettlement settlement) {
        if (settlement.getRuleSetVersionId() == null) {
            throw new IllegalArgumentException("missing ruleSetVersionId");
        }
        RuleSetVersion version = ruleSetVersionMapper.selectById(settlement.getRuleSetVersionId());
        if (version == null) {
            throw new IllegalArgumentException("ruleSetVersion not found");
        }

        Map<String, Object> def = PerfJson.parseMap(objectMapper, version.getDefinition());
        Map<String, Object> input = PerfJson.parseMap(objectMapper, settlement.getInputSnapshot());
        Map<String, Object> outputSnapshot = simulateRuleSetDefinition(def, input);

        PerfSettlement outputUpdate = new PerfSettlement();
        outputUpdate.setId(settlement.getId());
        outputUpdate.setOutputSnapshot(PerfJson.write(objectMapper, outputSnapshot));
        perfSettlementMapper.updateById(outputUpdate);

        RuleExecution execution = new RuleExecution();
        execution.setRuleSetVersionId(version.getId());
        execution.setTriggerType("TaskAccepted");
        execution.setTriggerId(String.valueOf(settlement.getId()));
        execution.setStatus("SUCCEEDED");
        execution.setInputSnapshot(settlement.getInputSnapshot());
        execution.setOutputSnapshot(PerfJson.write(objectMapper, outputSnapshot));
        execution.setEndedAt(LocalDateTime.now());
        ruleExecutionMapper.insert(execution);

        List<Map<String, Object>> postings = castList(outputSnapshot.get("postings"));
        List<Map<String, Object>> metrics = castList(outputSnapshot.get("metrics"));
        for (Map<String, Object> posting : postings) {
            int subjectId = toInt(posting.get("subjectId"));
            PointsAccount account = ensurePointsAccount("USER", subjectId);
            PointsLedgerEntry entry = new PointsLedgerEntry();
            entry.setAccountId(account.getId());
            entry.setBizType("task_settlement");
            entry.setBizId(String.valueOf(settlement.getId()));
            entry.setProjectId(settlement.getProjectId());
            entry.setTaskId(settlement.getTaskId());
            entry.setRuleSetVersionId(version.getId());
            entry.setPointsType(String.valueOf(posting.get("pointsType")));
            entry.setAmount(toInt(posting.get("amount")));
            entry.setOccurredAt(settlement.getOccurredAt());
            entry.setIdempotencyKey(settlement.getId() + ":" + posting.get("ruleId") + ":" + subjectId + ":"
                    + posting.get("pointsType") + ":" + posting.get("amount"));
            Map<String, Object> explain = new LinkedHashMap<String, Object>();
            explain.put("reasonCode", posting.get("reasonCode"));
            explain.put("ruleId", posting.get("ruleId"));
            entry.setExplain(PerfJson.write(objectMapper, explain));
            pointsLedgerEntryMapper.insert(entry);

            PerfItem item = new PerfItem();
            item.setSettlementId(settlement.getId());
            item.setSubjectType("USER");
            item.setSubjectId(subjectId);
            item.setMetricCode("points_" + posting.get("pointsType"));
            item.setValue(BigDecimal.valueOf(toInt(posting.get("amount"))));
            item.setSourceLedgerEntryId(entry.getId());
            Map<String, Object> itemExplain = new LinkedHashMap<String, Object>();
            itemExplain.put("kind", "posting");
            itemExplain.put("reasonCode", posting.get("reasonCode"));
            itemExplain.put("ruleId", posting.get("ruleId"));
            item.setExplain(PerfJson.write(objectMapper, itemExplain));
            perfItemMapper.insert(item);
        }
        for (Map<String, Object> metric : metrics) {
            PerfItem item = new PerfItem();
            item.setSettlementId(settlement.getId());
            item.setSubjectType(String.valueOf(metric.get("subjectType")));
            item.setSubjectId(toInt(metric.get("subjectId")));
            item.setMetricCode(String.valueOf(metric.get("metricCode")));
            item.setValue(BigDecimal.valueOf(toDouble(metric.get("value"))));
            Map<String, Object> itemExplain = new LinkedHashMap<String, Object>();
            itemExplain.put("kind", "metric");
            itemExplain.put("reasonCode", metric.get("reasonCode"));
            itemExplain.put("ruleId", metric.get("ruleId"));
            item.setExplain(PerfJson.write(objectMapper, itemExplain));
            perfItemMapper.insert(item);
        }
    }

    private void processAdjustment(PerfSettlement settlement) {
        if (settlement.getRuleSetVersionId() == null) {
            throw new IllegalArgumentException("missing ruleSetVersionId for adjustment");
        }
        if (settlement.getReplacesSettlementId() == null) {
            throw new IllegalArgumentException("missing replacesSettlementId for adjustment");
        }
        RuleSetVersion version = ruleSetVersionMapper.selectById(settlement.getRuleSetVersionId());
        if (version == null) {
            throw new IllegalArgumentException("ruleSetVersion not found");
        }
        PerfSettlement baseSettlement = perfSettlementMapper.selectById(settlement.getReplacesSettlementId());
        if (baseSettlement == null) {
            throw new IllegalArgumentException("base settlement not found");
        }

        Map<String, Object> def = PerfJson.parseMap(objectMapper, version.getDefinition());
        Map<String, Object> input = PerfJson.parseMap(objectMapper, settlement.getInputSnapshot());
        Map<String, Object> expected = simulateRuleSetDefinition(def, input);
        Map<String, Integer> expectedAgg = aggregatePostings(castList(expected.get("postings")));
        Map<String, Object> baseOutput = PerfJson.parseMap(objectMapper, baseSettlement.getOutputSnapshot());
        Map<String, Integer> baseAgg = aggregatePostings(castList(baseOutput.get("postings")));

        Set<String> allKeys = new HashSet<String>();
        allKeys.addAll(expectedAgg.keySet());
        allKeys.addAll(baseAgg.keySet());
        List<Map<String, Object>> diffPostings = new ArrayList<Map<String, Object>>();
        for (String key : allKeys) {
            int expectedAmount = expectedAgg.containsKey(key) ? expectedAgg.get(key) : 0;
            int baseAmount = baseAgg.containsKey(key) ? baseAgg.get(key) : 0;
            int delta = expectedAmount - baseAmount;
            if (delta == 0) {
                continue;
            }
            String[] parts = key.split(":");
            Map<String, Object> posting = new LinkedHashMap<String, Object>();
            posting.put("subjectType", parts.length > 0 ? parts[0] : "USER");
            posting.put("subjectId", parts.length > 1 ? Integer.valueOf(parts[1]) : 0);
            posting.put("pointsType", parts.length > 2 ? parts[2] : "base");
            posting.put("amount", delta);
            posting.put("reasonCode", "ADJUSTMENT_DIFF");
            posting.put("ruleId", "ADJUSTMENT_DIFF");
            diffPostings.add(posting);
        }

        Map<String, Object> outputSnapshot = new LinkedHashMap<String, Object>();
        outputSnapshot.put("expectedPostings", expected.get("postings"));
        outputSnapshot.put("basePostings", baseOutput.get("postings"));
        outputSnapshot.put("postings", diffPostings);
        outputSnapshot.put("metrics", expected.get("metrics"));
        outputSnapshot.put("explains", expected.get("explains"));

        PerfSettlement outputUpdate = new PerfSettlement();
        outputUpdate.setId(settlement.getId());
        outputUpdate.setOutputSnapshot(PerfJson.write(objectMapper, outputSnapshot));
        perfSettlementMapper.updateById(outputUpdate);

        RuleExecution execution = new RuleExecution();
        execution.setRuleSetVersionId(version.getId());
        execution.setTriggerType("Adjustment");
        execution.setTriggerId(String.valueOf(settlement.getId()));
        execution.setStatus("SUCCEEDED");
        execution.setInputSnapshot(settlement.getInputSnapshot());
        execution.setOutputSnapshot(PerfJson.write(objectMapper, outputSnapshot));
        execution.setEndedAt(LocalDateTime.now());
        ruleExecutionMapper.insert(execution);

        for (Map<String, Object> posting : diffPostings) {
            int subjectId = toInt(posting.get("subjectId"));
            PointsAccount account = ensurePointsAccount("USER", subjectId);
            PointsLedgerEntry entry = new PointsLedgerEntry();
            entry.setAccountId(account.getId());
            entry.setBizType("adjustment");
            entry.setBizId(String.valueOf(settlement.getId()));
            entry.setProjectId(settlement.getProjectId());
            entry.setTaskId(settlement.getTaskId());
            entry.setRuleSetVersionId(version.getId());
            entry.setPointsType(String.valueOf(posting.get("pointsType")));
            entry.setAmount(toInt(posting.get("amount")));
            entry.setOccurredAt(settlement.getOccurredAt());
            entry.setIdempotencyKey(settlement.getId() + ":adj:" + subjectId + ":" + posting.get("pointsType") + ":"
                    + posting.get("amount"));
            Map<String, Object> explain = new LinkedHashMap<String, Object>();
            explain.put("reasonCode", posting.get("reasonCode"));
            explain.put("ruleId", posting.get("ruleId"));
            explain.put("replacesSettlementId", String.valueOf(settlement.getReplacesSettlementId()));
            entry.setExplain(PerfJson.write(objectMapper, explain));
            pointsLedgerEntryMapper.insert(entry);

            PerfItem item = new PerfItem();
            item.setSettlementId(settlement.getId());
            item.setSubjectType("USER");
            item.setSubjectId(subjectId);
            item.setMetricCode("points_" + posting.get("pointsType"));
            item.setValue(BigDecimal.valueOf(toInt(posting.get("amount"))));
            item.setSourceLedgerEntryId(entry.getId());
            Map<String, Object> itemExplain = new LinkedHashMap<String, Object>();
            itemExplain.put("kind", "adjustment");
            itemExplain.put("reasonCode", posting.get("reasonCode"));
            itemExplain.put("ruleId", posting.get("ruleId"));
            item.setExplain(PerfJson.write(objectMapper, itemExplain));
            perfItemMapper.insert(item);
        }
    }

    private Map<String, Integer> aggregatePostings(List<Map<String, Object>> postings) {
        Map<String, Integer> map = new HashMap<String, Integer>();
        if (postings == null) {
            return map;
        }
        for (Map<String, Object> posting : postings) {
            String subjectType = posting.get("subjectType") != null ? String.valueOf(posting.get("subjectType")) : "USER";
            String key = subjectType + ":" + posting.get("subjectId") + ":" + posting.get("pointsType");
            int amount = toInt(posting.get("amount"));
            map.put(key, map.getOrDefault(key, 0) + amount);
        }
        return map;
    }

    private PointsAccount ensurePointsAccount(String ownerType, Integer ownerId) {
        PointsAccount existing = pointsAccountMapper.selectOne(new LambdaQueryWrapper<PointsAccount>()
                .eq(PointsAccount::getOwnerType, ownerType)
                .eq(PointsAccount::getOwnerId, ownerId));
        if (existing != null) {
            return existing;
        }
        PointsAccount account = new PointsAccount();
        account.setOwnerType(ownerType);
        account.setOwnerId(ownerId);
        account.setStatus("ACTIVE");
        pointsAccountMapper.insert(account);
        return account;
    }

    private Integer getEffectiveRuleSetVersionId(Integer projectId, LocalDateTime occurredAt) {
        Project project = projectMapper.selectById(projectId);
        if (project != null && project.getActiveRuleSetVersionId() != null) {
            RuleSetVersion pinned = ruleSetVersionMapper.selectById(project.getActiveRuleSetVersionId());
            if (pinned != null && isVersionEffective(pinned, occurredAt)) {
                RuleSet ruleSet = ruleSetMapper.selectById(pinned.getRuleSetId());
                if (ruleSet != null && "ACTIVE".equals(ruleSet.getStatus()) && appliesRuleSet(ruleSet, projectId)) {
                    return pinned.getId();
                }
            }
        }

        List<RuleSet> projectRuleSets = ruleSetMapper.selectList(new LambdaQueryWrapper<RuleSet>()
                .eq(RuleSet::getScope, "PROJECT")
                .eq(RuleSet::getProjectId, projectId)
                .eq(RuleSet::getStatus, "ACTIVE"));
        if (!projectRuleSets.isEmpty()) {
            Integer versionId = findLatestEffectiveVersion(projectRuleSets, occurredAt);
            if (versionId != null) {
                return versionId;
            }
        }

        List<RuleSet> globalRuleSets = ruleSetMapper.selectList(new LambdaQueryWrapper<RuleSet>()
                .eq(RuleSet::getScope, "GLOBAL")
                .eq(RuleSet::getStatus, "ACTIVE"));
        if (!globalRuleSets.isEmpty()) {
            Integer versionId = findLatestEffectiveVersion(globalRuleSets, occurredAt);
            if (versionId != null) {
                return versionId;
            }
        }

        RuleSet builtin = ensureGlobalDefaultRuleSet();
        RuleSetVersion builtinVersion = ensureGlobalDefaultRuleSetVersion(builtin.getId());
        return builtinVersion.getId();
    }

    private Integer findLatestEffectiveVersion(List<RuleSet> ruleSets, LocalDateTime occurredAt) {
        List<Integer> ruleSetIds = new ArrayList<Integer>();
        for (RuleSet ruleSet : ruleSets) {
            ruleSetIds.add(ruleSet.getId());
        }
        List<RuleSetVersion> versions = ruleSetVersionMapper.selectList(new LambdaQueryWrapper<RuleSetVersion>()
                .in(RuleSetVersion::getRuleSetId, ruleSetIds)
                .orderByDesc(RuleSetVersion::getPublishedAt)
                .orderByDesc(RuleSetVersion::getVersion));
        for (RuleSetVersion version : versions) {
            if (isVersionEffective(version, occurredAt)) {
                return version.getId();
            }
        }
        return null;
    }

    private boolean isVersionEffective(RuleSetVersion version, LocalDateTime occurredAt) {
        if (version.getEffectiveFrom() != null && occurredAt.isBefore(version.getEffectiveFrom())) {
            return false;
        }
        if (version.getEffectiveTo() != null && occurredAt.isAfter(version.getEffectiveTo())) {
            return false;
        }
        return true;
    }

    private boolean appliesRuleSet(RuleSet ruleSet, Integer projectId) {
        return "GLOBAL".equals(ruleSet.getScope())
                || ("PROJECT".equals(ruleSet.getScope()) && projectId.equals(ruleSet.getProjectId()));
    }

    private RuleSet ensureGlobalDefaultRuleSet() {
        RuleSet existing = ruleSetMapper.selectOne(new LambdaQueryWrapper<RuleSet>()
                .eq(RuleSet::getCode, "global-default"));
        if (existing != null) {
            return existing;
        }
        RuleSet created = new RuleSet();
        created.setCode("global-default");
        created.setName("全局默认规则");
        created.setScope("GLOBAL");
        created.setStatus("ACTIVE");
        ruleSetMapper.insert(created);
        return created;
    }

    private RuleSetVersion ensureGlobalDefaultRuleSetVersion(Integer ruleSetId) {
        RuleSetVersion latest = ruleSetVersionMapper.selectOne(new LambdaQueryWrapper<RuleSetVersion>()
                .eq(RuleSetVersion::getRuleSetId, ruleSetId)
                .orderByDesc(RuleSetVersion::getVersion)
                .last("LIMIT 1"));
        if (latest != null) {
            return latest;
        }

        Map<String, Object> def = new LinkedHashMap<String, Object>();
        def.put("params", Collections.<String, Object>emptyMap());
        List<Map<String, Object>> variables = new ArrayList<Map<String, Object>>();
        Map<String, Object> delayVar = new LinkedHashMap<String, Object>();
        delayVar.put("code", "delayHours");
        Map<String, Object> delayExpr = new LinkedHashMap<String, Object>();
        delayExpr.put("path", "task.delayHours");
        delayVar.put("expr", delayExpr);
        variables.add(delayVar);
        def.put("variables", variables);

        List<Map<String, Object>> rules = new ArrayList<Map<String, Object>>();
        Map<String, Object> rule = new LinkedHashMap<String, Object>();
        rule.put("id", "base_points");
        rule.put("name", "验收通过基础积分");
        rule.put("priority", 100);
        Map<String, Object> when = new LinkedHashMap<String, Object>();
        when.put("op", "gt");
        Map<String, Object> left = new LinkedHashMap<String, Object>();
        left.put("path", "task.actualHours");
        when.put("left", left);
        when.put("right", 0);
        rule.put("when", when);
        List<Map<String, Object>> then = new ArrayList<Map<String, Object>>();
        Map<String, Object> action = new LinkedHashMap<String, Object>();
        action.put("type", "emitPosting");
        Map<String, Object> subject = new LinkedHashMap<String, Object>();
        subject.put("ref", "task.mainAssigneeId");
        action.put("subject", subject);
        action.put("pointsType", "base");
        action.put("amount", 10);
        action.put("reasonCode", "TASK_ACCEPTED_BASE");
        then.add(action);
        rule.put("then", then);
        rules.add(rule);
        def.put("rules", rules);

        String definitionText = PerfJson.write(objectMapper, def);
        RuleSetVersion version = new RuleSetVersion();
        version.setRuleSetId(ruleSetId);
        version.setVersion(1);
        version.setChecksum(sha256(definitionText));
        version.setDefinition(definitionText);
        ruleSetVersionMapper.insert(version);
        return version;
    }

    private Map<String, Object> buildTaskFact(Task task) {
        LocalDateTime dueDate = task.getDueDate();
        LocalDateTime acceptedAt = task.getAcceptedAt() != null ? task.getAcceptedAt() : task.getUpdateTime();
        double delayHours = 0;
        double aheadDays = 0;
        if (dueDate != null && acceptedAt != null) {
            long diffMs = acceptedAt.atZone(ZoneOffset.ofHours(8)).toInstant().toEpochMilli()
                    - dueDate.atZone(ZoneOffset.ofHours(8)).toInstant().toEpochMilli();
            delayHours = Math.max(0, diffMs / 3600000.0);
            aheadDays = Math.floor((dueDate.atZone(ZoneOffset.ofHours(8)).toInstant().toEpochMilli()
                    - acceptedAt.atZone(ZoneOffset.ofHours(8)).toInstant().toEpochMilli()) / 86400000.0);
        }

        List<TestCase> testCases = testCaseMapper.selectList(new LambdaQueryWrapper<TestCase>()
                .eq(TestCase::getTaskId, task.getId()));
        int bugCount = 0;
        for (TestCase testCase : testCases) {
            bugCount += testCase.getBugCount() != null ? testCase.getBugCount() : 0;
        }

        List<TaskCoAssignee> coAssignees = taskCoAssigneeMapper.selectList(new LambdaQueryWrapper<TaskCoAssignee>()
                .eq(TaskCoAssignee::getTaskId, task.getId()));
        List<Integer> coAssigneeIds = new ArrayList<Integer>();
        for (TaskCoAssignee coAssignee : coAssignees) {
            coAssigneeIds.add(coAssignee.getUserId());
        }

        Long rejectCount = taskTimelineMapper.selectCount(new LambdaQueryWrapper<TaskTimeline>()
                .eq(TaskTimeline::getTaskId, task.getId())
                .eq(TaskTimeline::getEventType, "QA_REJECTED"));

        Map<String, Object> taskFact = new LinkedHashMap<String, Object>();
        taskFact.put("id", task.getId());
        taskFact.put("projectId", task.getProjectId());
        taskFact.put("workDomain", task.getWorkDomain());
        taskFact.put("priority", task.getPriority());
        taskFact.put("dueDate", dueDate);
        taskFact.put("acceptedAt", acceptedAt);
        taskFact.put("estimatedHours", task.getEstimatedHours());
        taskFact.put("actualHours", task.getActualHours() != null ? task.getActualHours() : 0);
        taskFact.put("mainAssigneeId", task.getMainAssigneeId());
        taskFact.put("testerId", task.getTesterId());
        taskFact.put("coAssigneeIds", coAssigneeIds);
        taskFact.put("rejectCount", rejectCount != null ? rejectCount.intValue() : 0);
        taskFact.put("testCaseBugCount", bugCount);
        taskFact.put("delayHours", delayHours);
        taskFact.put("aheadDays", aheadDays);
        double baseScore = task.getBaseScore() != null ? task.getBaseScore()
                : (task.getSuggestedBaseScore() != null ? task.getSuggestedBaseScore()
                        : (task.getEstimatedHours() != null ? task.getEstimatedHours() : 0));
        taskFact.put("baseScore", baseScore);
        String tier = task.getComplexityTier() != null ? task.getComplexityTier() : "STANDARD";
        taskFact.put("complexityTier", tier);
        taskFact.put("complexity", TaskComplexityTier.coefficientForTierOrDefault(tier));

        Map<String, Object> snapshot = new LinkedHashMap<String, Object>();
        snapshot.put("task", taskFact);
        return snapshot;
    }

    private void notifyPointsSettlementWebSocket(Long settlementId, Integer taskId) {
        try {
            List<PointsLedgerEntry> entries = pointsLedgerEntryMapper.selectList(
                    new LambdaQueryWrapper<PointsLedgerEntry>().eq(PointsLedgerEntry::getBizId, String.valueOf(settlementId)));
            Map<Integer, Integer> deltaByUser = new HashMap<Integer, Integer>();
            for (PointsLedgerEntry entry : entries) {
                PointsAccount account = pointsAccountMapper.selectById(entry.getAccountId());
                if (account == null || !"USER".equals(account.getOwnerType())) {
                    continue;
                }
                int uid = account.getOwnerId();
                deltaByUser.put(uid, deltaByUser.getOrDefault(uid, 0) + entry.getAmount());
            }
            if (deltaByUser.isEmpty()) {
                return;
            }
            Task task = taskMapper.selectById(taskId);
            for (Map.Entry<Integer, Integer> entry : deltaByUser.entrySet()) {
                int earnedPoints = entry.getValue();
                if (earnedPoints == 0) {
                    continue;
                }
                Map<String, Object> payload = new HashMap<String, Object>();
                payload.put("event", "points_settlement");
                Map<String, Object> data = new HashMap<String, Object>();
                data.put("settlementId", String.valueOf(settlementId));
                data.put("taskId", taskId);
                data.put("taskTitle", task != null ? task.getTitle() : null);
                data.put("earnedPoints", earnedPoints);
                data.put("totalPoints", getUserTotalPointsSnapshot(entry.getKey()));
                payload.put("data", data);
                wsHub.pushJsonToUser(entry.getKey(), payload);
            }
        } catch (Exception ex) {
            log.error("[perf] notifyPointsSettlementWebSocket failed: {}", ex.getMessage());
        }
    }

    private int getUserTotalPointsSnapshot(Integer userId) {
        PointsAccount account = pointsAccountMapper.selectOne(new LambdaQueryWrapper<PointsAccount>()
                .eq(PointsAccount::getOwnerType, "USER")
                .eq(PointsAccount::getOwnerId, userId));
        if (account == null) {
            return 0;
        }
        List<PointsLedgerEntry> entries = pointsLedgerEntryMapper.selectList(new LambdaQueryWrapper<PointsLedgerEntry>()
                .eq(PointsLedgerEntry::getAccountId, account.getId()));
        int total = 0;
        for (PointsLedgerEntry entry : entries) {
            total += entry.getAmount() != null ? entry.getAmount() : 0;
        }
        return total;
    }

    private String sha256(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castList(Object value) {
        if (!(value instanceof List)) {
            return Collections.emptyList();
        }
        List<Map<String, Object>> out = new ArrayList<Map<String, Object>>();
        for (Object item : (List<?>) value) {
            if (item instanceof Map) {
                out.add((Map<String, Object>) item);
            }
        }
        return out;
    }

    private int toInt(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return (int) Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private double toDouble(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
