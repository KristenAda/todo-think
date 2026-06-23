package com.todothink.modules.performance.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.exception.BusinessException;
import com.todothink.modules.performance.entity.PerfItem;
import com.todothink.modules.performance.entity.PerfSettlement;
import com.todothink.modules.performance.entity.PointsAccount;
import com.todothink.modules.performance.entity.PointsLedgerEntry;
import com.todothink.modules.performance.entity.RuleSet;
import com.todothink.modules.performance.entity.RuleSetVersion;
import com.todothink.modules.performance.mapper.PerfItemMapper;
import com.todothink.modules.performance.mapper.PerfSettlementMapper;
import com.todothink.modules.performance.mapper.PointsAccountMapper;
import com.todothink.modules.performance.mapper.PointsLedgerEntryMapper;
import com.todothink.modules.performance.mapper.RuleSetMapper;
import com.todothink.modules.performance.mapper.RuleSetVersionMapper;
import com.todothink.modules.performance.support.PerfJson;
import com.todothink.modules.system.entity.User;
import com.todothink.modules.system.mapper.UserMapper;
import com.todothink.modules.task.entity.Project;
import com.todothink.modules.task.entity.Task;
import com.todothink.modules.task.entity.TaskCoAssignee;
import com.todothink.modules.task.entity.TaskTimeline;
import com.todothink.modules.task.entity.TestCase;
import com.todothink.modules.task.entity.WorkLog;
import com.todothink.modules.task.mapper.ProjectMapper;
import com.todothink.modules.task.mapper.TaskCoAssigneeMapper;
import com.todothink.modules.task.mapper.TaskMapper;
import com.todothink.modules.task.mapper.TaskTimelineMapper;
import com.todothink.modules.task.mapper.TestCaseMapper;
import com.todothink.modules.task.mapper.WorkLogMapper;
import com.todothink.modules.task.service.ProjectService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PerformanceService {

    private final ProjectService projectService;
    private final ProjectMapper projectMapper;
    private final TaskMapper taskMapper;
    private final TaskCoAssigneeMapper taskCoAssigneeMapper;
    private final TestCaseMapper testCaseMapper;
    private final WorkLogMapper workLogMapper;
    private final TaskTimelineMapper taskTimelineMapper;
    private final PointsAccountMapper pointsAccountMapper;
    private final PointsLedgerEntryMapper pointsLedgerEntryMapper;
    private final RuleSetVersionMapper ruleSetVersionMapper;
    private final RuleSetMapper ruleSetMapper;
    private final PerfSettlementMapper perfSettlementMapper;
    private final PerfItemMapper perfItemMapper;
    private final UserMapper userMapper;
    private final SettlementService settlementService;
    private final ObjectMapper objectMapper;

    public PerformanceService(ProjectService projectService, ProjectMapper projectMapper, TaskMapper taskMapper,
            TaskCoAssigneeMapper taskCoAssigneeMapper, TestCaseMapper testCaseMapper, WorkLogMapper workLogMapper,
            TaskTimelineMapper taskTimelineMapper, PointsAccountMapper pointsAccountMapper,
            PointsLedgerEntryMapper pointsLedgerEntryMapper, RuleSetVersionMapper ruleSetVersionMapper,
            RuleSetMapper ruleSetMapper, PerfSettlementMapper perfSettlementMapper, PerfItemMapper perfItemMapper,
            UserMapper userMapper, SettlementService settlementService, ObjectMapper objectMapper) {
        this.projectService = projectService;
        this.projectMapper = projectMapper;
        this.taskMapper = taskMapper;
        this.taskCoAssigneeMapper = taskCoAssigneeMapper;
        this.testCaseMapper = testCaseMapper;
        this.workLogMapper = workLogMapper;
        this.taskTimelineMapper = taskTimelineMapper;
        this.pointsAccountMapper = pointsAccountMapper;
        this.pointsLedgerEntryMapper = pointsLedgerEntryMapper;
        this.ruleSetVersionMapper = ruleSetVersionMapper;
        this.ruleSetMapper = ruleSetMapper;
        this.perfSettlementMapper = perfSettlementMapper;
        this.perfItemMapper = perfItemMapper;
        this.userMapper = userMapper;
        this.settlementService = settlementService;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> myTotalPoints(Integer userId) {
        PointsAccount account = pointsAccountMapper.selectOne(new LambdaQueryWrapper<PointsAccount>()
                .eq(PointsAccount::getOwnerType, "USER")
                .eq(PointsAccount::getOwnerId, userId));
        if (account == null) {
            Map<String, Object> empty = new HashMap<String, Object>();
            empty.put("totalPoints", 0);
            return empty;
        }
        List<PointsLedgerEntry> entries = pointsLedgerEntryMapper.selectList(new LambdaQueryWrapper<PointsLedgerEntry>()
                .eq(PointsLedgerEntry::getAccountId, account.getId()));
        int total = 0;
        for (PointsLedgerEntry entry : entries) {
            total += entry.getAmount() != null ? entry.getAmount() : 0;
        }
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("totalPoints", total);
        return result;
    }

    public Map<String, Object> stats(int page, int pageSize, Integer projectId, String startAt, String endAt,
            boolean pickSelf, Integer userId) {
        List<Integer> orgIds = projectService.getOrgIdsForUser(userId);
        if (orgIds.isEmpty()) {
            return emptyStats(page, pageSize);
        }

        List<Project> allowedProjects = projectMapper.selectList(new LambdaQueryWrapper<Project>()
                .in(Project::getOrgId, orgIds)
                .isNull(Project::getDeletedAt)
                .select(Project::getId));
        List<Integer> allowedProjectIds = new ArrayList<Integer>();
        for (Project project : allowedProjects) {
            allowedProjectIds.add(project.getId());
        }
        if (allowedProjectIds.isEmpty()) {
            return emptyStats(page, pageSize);
        }

        List<Integer> projectFilter = new ArrayList<Integer>();
        if (projectId != null) {
            if (!allowedProjectIds.contains(projectId)) {
                return emptyStats(page, pageSize);
            }
            projectFilter.add(projectId);
        } else {
            projectFilter.addAll(allowedProjectIds);
        }

        LocalDateTime start = parseDateTime(startAt);
        LocalDateTime end = parseDateTime(endAt);

        LambdaQueryWrapper<Task> taskWrapper = new LambdaQueryWrapper<Task>()
                .eq(Task::getStatus, "COMPLETED")
                .in(Task::getProjectId, projectFilter);
        applyTaskDateFilter(taskWrapper, start, end);
        List<Task> completedTasks = taskMapper.selectList(taskWrapper);

        LambdaQueryWrapper<PointsLedgerEntry> ledgerWrapper = new LambdaQueryWrapper<PointsLedgerEntry>()
                .in(PointsLedgerEntry::getBizType, "task_settlement", "adjustment", "reversal")
                .in(PointsLedgerEntry::getProjectId, projectFilter);
        if (start != null) {
            ledgerWrapper.ge(PointsLedgerEntry::getOccurredAt, start);
        }
        if (end != null) {
            ledgerWrapper.le(PointsLedgerEntry::getOccurredAt, end);
        }
        List<PointsLedgerEntry> ledger = pointsLedgerEntryMapper.selectList(ledgerWrapper);

        List<TaskTimeline> rejectTimelines = taskTimelineMapper.selectList(new LambdaQueryWrapper<TaskTimeline>()
                .eq(TaskTimeline::getEventType, "QA_REJECTED")
                .ge(start != null, TaskTimeline::getCreateTime, start)
                .le(end != null, TaskTimeline::getCreateTime, end));

        Map<Integer, Integer> qaRejectByUser = new HashMap<Integer, Integer>();
        for (TaskTimeline timeline : rejectTimelines) {
            Task task = taskMapper.selectById(timeline.getTaskId());
            if (task == null || !projectFilter.contains(task.getProjectId())) {
                continue;
            }
            Set<Integer> ids = new HashSet<Integer>();
            if (task.getMainAssigneeId() != null) {
                ids.add(task.getMainAssigneeId());
            }
            List<TaskCoAssignee> coAssignees = taskCoAssigneeMapper.selectList(new LambdaQueryWrapper<TaskCoAssignee>()
                    .eq(TaskCoAssignee::getTaskId, task.getId()));
            for (TaskCoAssignee coAssignee : coAssignees) {
                ids.add(coAssignee.getUserId());
            }
            for (Integer uid : ids) {
                qaRejectByUser.put(uid, qaRejectByUser.getOrDefault(uid, 0) + 1);
            }
        }

        Map<Integer, Double> workLogByUser = new HashMap<Integer, Double>();
        List<WorkLog> workLogs = workLogMapper.selectList(new LambdaQueryWrapper<WorkLog>()
                .ge(start != null, WorkLog::getCreateTime, start)
                .le(end != null, WorkLog::getCreateTime, end));
        for (WorkLog workLog : workLogs) {
            Task task = taskMapper.selectById(workLog.getTaskId());
            if (task == null || !projectFilter.contains(task.getProjectId())) {
                continue;
            }
            double hours = workLog.getHours() != null ? workLog.getHours() : 0;
            workLogByUser.put(workLog.getUserId(), workLogByUser.getOrDefault(workLog.getUserId(), 0.0) + hours);
        }

        Map<Integer, PointsAgg> pointsByUser = new HashMap<Integer, PointsAgg>();
        int totalPointsAll = 0;
        for (PointsLedgerEntry entry : ledger) {
            PointsAccount account = pointsAccountMapper.selectById(entry.getAccountId());
            if (account == null || !"USER".equals(account.getOwnerType())) {
                continue;
            }
            int uid = account.getOwnerId();
            if (!pointsByUser.containsKey(uid)) {
                pointsByUser.put(uid, new PointsAgg());
            }
            PointsAgg agg = pointsByUser.get(uid);
            agg.totalPoints += entry.getAmount() != null ? entry.getAmount() : 0;
            String pointsType = entry.getPointsType();
            agg.byType.put(pointsType, agg.byType.getOrDefault(pointsType, 0)
                    + (entry.getAmount() != null ? entry.getAmount() : 0));
            totalPointsAll += entry.getAmount() != null ? entry.getAmount() : 0;
        }

        Map<String, Integer> tasksByType = new HashMap<String, Integer>();
        Map<String, Integer> tasksByPriority = new HashMap<String, Integer>();
        Map<Integer, StatAgg> statMap = new HashMap<Integer, StatAgg>();

        for (Task task : completedTasks) {
            String type = task.getType() != null ? task.getType() : "FEATURE";
            tasksByType.put(type, tasksByType.getOrDefault(type, 0) + 1);
            String priority = task.getPriority() != null ? task.getPriority() : "P2";
            tasksByPriority.put(priority, tasksByPriority.getOrDefault(priority, 0) + 1);

            if (task.getMainAssigneeId() == null) {
                continue;
            }
            int uid = task.getMainAssigneeId();
            if (!statMap.containsKey(uid)) {
                StatAgg stat = new StatAgg();
                stat.user = userMapper.selectById(uid);
                statMap.put(uid, stat);
            }
            StatAgg stat = statMap.get(uid);
            stat.totalTasks += 1;
            stat.mainResponsibleTasks += 1;
            stat.totalActualHours += task.getActualHours() != null ? task.getActualHours() : 0;
            stat.totalEstimatedHours += task.getEstimatedHours() != null ? task.getEstimatedHours() : 0;

            List<TestCase> testCases = testCaseMapper.selectList(new LambdaQueryWrapper<TestCase>()
                    .eq(TestCase::getTaskId, task.getId()));
            int bugCount = 0;
            for (TestCase testCase : testCases) {
                bugCount += testCase.getBugCount() != null ? testCase.getBugCount() : 0;
            }
            stat.totalBugCount += bugCount;
            if (bugCount == 0) {
                stat.firstPassCount += 1;
            }

            LocalDateTime acceptedAt = task.getAcceptedAt() != null ? task.getAcceptedAt() : task.getUpdateTime();
            double leadDays = Math.max(0, daysBetween(task.getCreateTime(), acceptedAt));
            stat.leadDaysList.add(leadDays);

            if (task.getDueDate() != null) {
                stat.tasksWithDue += 1;
                double delayHours = Math.max(0, hoursBetween(task.getDueDate(), acceptedAt));
                stat.delayHoursSum += delayHours;
                if (delayHours <= 0) {
                    stat.onTimeHits += 1;
                }
                stat.onTimeWithDue += 1;
            }
        }

        List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
        for (StatAgg stat : statMap.values()) {
            rows.add(buildStatRow(stat, pointsByUser, qaRejectByUser, workLogByUser));
        }

        if (rows.isEmpty()) {
            return emptyStats(page, pageSize);
        }

        applyCompositeScores(rows);
        Collections.sort(rows, new Comparator<Map<String, Object>>() {
            @Override
            public int compare(Map<String, Object> a, Map<String, Object> b) {
                int scoreDiff = ((Number) b.get("compositeScore")).intValue() - ((Number) a.get("compositeScore")).intValue();
                if (scoreDiff != 0) {
                    return scoreDiff;
                }
                Map<String, Object> userA = (Map<String, Object>) a.get("user");
                Map<String, Object> userB = (Map<String, Object>) b.get("user");
                return ((Number) userA.get("id")).intValue() - ((Number) userB.get("id")).intValue();
            }
        });

        List<Map<String, Object>> displayRows = rows;
        if (pickSelf) {
            displayRows = new ArrayList<Map<String, Object>>();
            for (Map<String, Object> row : rows) {
                Map<String, Object> user = (Map<String, Object>) row.get("user");
                if (userId.equals(user.get("id"))) {
                    displayRows.add(row);
                }
            }
        }

        double totalWorkLogHours = 0;
        for (Double hours : workLogByUser.values()) {
            totalWorkLogHours += hours;
        }
        Map<String, Object> summary = new LinkedHashMap<String, Object>();
        summary.put("tasksByType", tasksByType);
        summary.put("tasksByPriority", tasksByPriority);
        Map<String, Object> totals = new LinkedHashMap<String, Object>();
        totals.put("headcount", rows.size());
        totals.put("completedTasks", completedTasks.size());
        totals.put("totalWorkLogHours", round1(totalWorkLogHours));
        totals.put("totalPoints", totalPointsAll);
        totals.put("totalQaRejects", rejectTimelines.size());
        int compositeSum = 0;
        int onTimeSum = 0;
        for (Map<String, Object> row : rows) {
            compositeSum += ((Number) row.get("compositeScore")).intValue();
            onTimeSum += ((Number) row.get("onTimeRate")).intValue();
        }
        totals.put("avgCompositeScore", round1(compositeSum * 1.0 / rows.size()));
        totals.put("avgOnTimeRate", round1(onTimeSum * 1.0 / rows.size()));
        summary.put("totals", totals);

        int total = displayRows.size();
        int skip = (page - 1) * pageSize;
        int endIndex = Math.min(skip + pageSize, total);
        List<Map<String, Object>> list = skip >= total ? Collections.<Map<String, Object>>emptyList()
                : displayRows.subList(skip, endIndex);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("list", list);
        result.put("total", total);
        result.put("page", page);
        result.put("pageSize", pageSize);
        result.put("totalPage", (int) Math.ceil(total * 1.0 / pageSize));
        result.put("summary", summary);
        return result;
    }

    public Map<String, Object> reconcileTask(Integer taskId, Integer userId) {
        projectService.assertUserCanAccessTask(userId, taskId);
        List<PerfSettlement> settlements = perfSettlementMapper.selectList(new LambdaQueryWrapper<PerfSettlement>()
                .eq(PerfSettlement::getTaskId, taskId)
                .orderByAsc(PerfSettlement::getOccurredAt)
                .orderByAsc(PerfSettlement::getCreateTime));
        List<String> settlementIds = new ArrayList<String>();
        for (PerfSettlement settlement : settlements) {
            settlementIds.add(String.valueOf(settlement.getId()));
        }
        List<PointsLedgerEntry> ledgers;
        if (settlementIds.isEmpty()) {
            ledgers = Collections.emptyList();
        } else {
            ledgers = pointsLedgerEntryMapper.selectList(new LambdaQueryWrapper<PointsLedgerEntry>()
                    .eq(PointsLedgerEntry::getTaskId, taskId)
                    .in(PointsLedgerEntry::getBizId, settlementIds)
                    .orderByAsc(PointsLedgerEntry::getCreateTime));
        }

        List<Map<String, Object>> settlementRows = new ArrayList<Map<String, Object>>();
        for (PerfSettlement settlement : settlements) {
            Map<String, Object> row = settlementToMap(settlement);
            List<PerfItem> items = perfItemMapper.selectList(new LambdaQueryWrapper<PerfItem>()
                    .eq(PerfItem::getSettlementId, settlement.getId()));
            row.put("items", items);
            settlementRows.add(row);
        }

        List<Map<String, Object>> ledgerRows = new ArrayList<Map<String, Object>>();
        for (PointsLedgerEntry entry : ledgers) {
            Map<String, Object> row = ledgerEntryToMap(entry);
            PointsAccount account = pointsAccountMapper.selectById(entry.getAccountId());
            row.put("account", account);
            ledgerRows.add(row);
        }

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("taskId", taskId);
        result.put("settlements", settlementRows);
        result.put("ledgers", ledgerRows);
        return result;
    }

    public Map<String, Object> ledgerPage(int page, int pageSize, Integer projectId, Integer taskId,
            Integer userOwnerId, String bizType, String startAt, String endAt, Integer userId, boolean selfOnly) {
        List<Integer> orgIds = projectService.getOrgIdsForUser(userId);
        if (orgIds.isEmpty()) {
            return emptyLedger(page, pageSize);
        }
        List<Project> allowedProjects = projectMapper.selectList(new LambdaQueryWrapper<Project>()
                .in(Project::getOrgId, orgIds)
                .isNull(Project::getDeletedAt)
                .select(Project::getId));
        List<Integer> allowedProjectIds = new ArrayList<Integer>();
        for (Project project : allowedProjects) {
            allowedProjectIds.add(project.getId());
        }
        if (allowedProjectIds.isEmpty()) {
            return emptyLedger(page, pageSize);
        }

        List<Integer> projectFilter;
        if (projectId != null) {
            if (!allowedProjectIds.contains(projectId)) {
                return emptyLedger(page, pageSize);
            }
            projectFilter = Collections.singletonList(projectId);
        } else {
            projectFilter = allowedProjectIds;
        }

        LambdaQueryWrapper<PointsLedgerEntry> wrapper = new LambdaQueryWrapper<PointsLedgerEntry>()
                .in(PointsLedgerEntry::getProjectId, projectFilter);
        if (StringUtils.hasText(bizType)) {
            wrapper.eq(PointsLedgerEntry::getBizType, bizType);
        } else {
            wrapper.in(PointsLedgerEntry::getBizType, "task_settlement", "adjustment", "reversal", "manual");
        }
        if (taskId != null) {
            wrapper.eq(PointsLedgerEntry::getTaskId, taskId);
        }
        LocalDateTime start = parseDateTime(startAt);
        LocalDateTime end = parseDateTime(endAt);
        if (start != null) {
            wrapper.ge(PointsLedgerEntry::getOccurredAt, start);
        }
        if (end != null) {
            wrapper.le(PointsLedgerEntry::getOccurredAt, end);
        }
        if (selfOnly) {
            PointsAccount account = pointsAccountMapper.selectOne(new LambdaQueryWrapper<PointsAccount>()
                    .eq(PointsAccount::getOwnerType, "USER")
                    .eq(PointsAccount::getOwnerId, userId));
            if (account == null) {
                return emptyLedger(page, pageSize);
            }
            wrapper.eq(PointsLedgerEntry::getAccountId, account.getId());
        } else if (userOwnerId != null) {
            PointsAccount account = pointsAccountMapper.selectOne(new LambdaQueryWrapper<PointsAccount>()
                    .eq(PointsAccount::getOwnerType, "USER")
                    .eq(PointsAccount::getOwnerId, userOwnerId));
            if (account == null) {
                return emptyLedger(page, pageSize);
            }
            wrapper.eq(PointsLedgerEntry::getAccountId, account.getId());
        }

        List<PointsLedgerEntry> allRows = pointsLedgerEntryMapper.selectList(wrapper.orderByDesc(PointsLedgerEntry::getOccurredAt));
        int sumAmount = 0;
        for (PointsLedgerEntry entry : allRows) {
            sumAmount += entry.getAmount() != null ? entry.getAmount() : 0;
        }
        int total = allRows.size();
        int skip = (page - 1) * pageSize;
        int endIndex = Math.min(skip + pageSize, total);
        List<PointsLedgerEntry> pageRows = skip >= total ? Collections.<PointsLedgerEntry>emptyList()
                : allRows.subList(skip, endIndex);

        Map<Integer, String> taskTitleMap = new HashMap<Integer, String>();
        Map<Integer, String> projectNameMap = new HashMap<Integer, String>();
        Map<Integer, User> userMap = new HashMap<Integer, User>();
        Map<Integer, RuleSetVersion> versionMap = new HashMap<Integer, RuleSetVersion>();
        Map<Integer, RuleSet> ruleSetMap = new HashMap<Integer, RuleSet>();

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        for (PointsLedgerEntry entry : pageRows) {
            if (entry.getTaskId() != null && !taskTitleMap.containsKey(entry.getTaskId())) {
                Task task = taskMapper.selectById(entry.getTaskId());
                taskTitleMap.put(entry.getTaskId(), task != null ? task.getTitle() : null);
            }
            if (entry.getProjectId() != null && !projectNameMap.containsKey(entry.getProjectId())) {
                Project project = projectMapper.selectById(entry.getProjectId());
                projectNameMap.put(entry.getProjectId(), project != null ? project.getName() : null);
            }
            PointsAccount account = pointsAccountMapper.selectById(entry.getAccountId());
            Integer ownerUserId = null;
            String ownerDisplayName = null;
            if (account != null && "USER".equals(account.getOwnerType())) {
                ownerUserId = account.getOwnerId();
                if (!userMap.containsKey(ownerUserId)) {
                    userMap.put(ownerUserId, userMapper.selectById(ownerUserId));
                }
                User owner = userMap.get(ownerUserId);
                ownerDisplayName = owner != null
                        ? (StringUtils.hasText(owner.getNickName()) ? owner.getNickName() : owner.getUserName())
                        : null;
            }
            String ruleSetName = null;
            String ruleSetCode = null;
            Integer ruleVersionNo = null;
            if (entry.getRuleSetVersionId() != null) {
                if (!versionMap.containsKey(entry.getRuleSetVersionId())) {
                    versionMap.put(entry.getRuleSetVersionId(),
                            ruleSetVersionMapper.selectById(entry.getRuleSetVersionId()));
                }
                RuleSetVersion version = versionMap.get(entry.getRuleSetVersionId());
                if (version != null) {
                    ruleVersionNo = version.getVersion();
                    if (!ruleSetMap.containsKey(version.getRuleSetId())) {
                        ruleSetMap.put(version.getRuleSetId(), ruleSetMapper.selectById(version.getRuleSetId()));
                    }
                    RuleSet ruleSet = ruleSetMap.get(version.getRuleSetId());
                    if (ruleSet != null) {
                        ruleSetName = ruleSet.getName();
                        ruleSetCode = ruleSet.getCode();
                    }
                }
            }

            Map<String, Object> row = new LinkedHashMap<String, Object>();
            row.put("id", String.valueOf(entry.getId()));
            row.put("bizType", entry.getBizType());
            row.put("bizId", entry.getBizId());
            row.put("projectId", entry.getProjectId());
            row.put("projectName", entry.getProjectId() != null ? projectNameMap.get(entry.getProjectId()) : null);
            row.put("taskId", entry.getTaskId());
            row.put("taskTitle", entry.getTaskId() != null ? taskTitleMap.get(entry.getTaskId()) : null);
            row.put("occurredAt", entry.getOccurredAt());
            row.put("pointsType", entry.getPointsType());
            row.put("amount", entry.getAmount());
            row.put("ownerUserId", ownerUserId);
            row.put("ownerDisplayName", ownerDisplayName);
            row.put("ruleSetVersionId", entry.getRuleSetVersionId());
            row.put("ruleSetName", ruleSetName);
            row.put("ruleSetCode", ruleSetCode);
            row.put("ruleVersionNo", ruleVersionNo);
            row.put("explain", parseJson(entry.getExplain()));
            list.add(row);
        }

        Map<String, Object> summary = new HashMap<String, Object>();
        summary.put("sumAmount", sumAmount);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("list", list);
        result.put("total", total);
        result.put("summary", summary);
        return result;
    }

    public Map<String, Object> ledgerDetail(String entryIdStr, Integer userId) {
        Long id;
        try {
            id = Long.valueOf(entryIdStr);
        } catch (NumberFormatException ex) {
            throw new BusinessException("无效的记录 ID", 400);
        }
        PointsLedgerEntry entry = pointsLedgerEntryMapper.selectById(id);
        if (entry == null) {
            throw new BusinessException("记录不存在", 404);
        }
        if (entry.getProjectId() != null) {
            projectService.assertUserCanAccessProject(userId, entry.getProjectId());
        }

        PointsAccount account = pointsAccountMapper.selectById(entry.getAccountId());
        User ownerUser = null;
        if (account != null && "USER".equals(account.getOwnerType())) {
            ownerUser = userMapper.selectById(account.getOwnerId());
        }
        Task task = entry.getTaskId() != null ? taskMapper.selectById(entry.getTaskId()) : null;
        Project project = entry.getProjectId() != null ? projectMapper.selectById(entry.getProjectId()) : null;

        Map<String, Object> settlement = null;
        Map<String, Object> evaluation = null;
        if ("task_settlement".equals(entry.getBizType()) || "adjustment".equals(entry.getBizType())
                || "reversal".equals(entry.getBizType())) {
            try {
                PerfSettlement s = perfSettlementMapper.selectById(Long.valueOf(entry.getBizId()));
                if (s != null) {
                    settlement = settlementToMap(s);
                    Map<String, Object> def = null;
                    if (s.getRuleSetVersionId() != null) {
                        RuleSetVersion version = ruleSetVersionMapper.selectById(s.getRuleSetVersionId());
                        if (version != null) {
                            def = PerfJson.parseMap(objectMapper, version.getDefinition());
                        }
                    }
                    Map<String, Object> input = PerfJson.parseMap(objectMapper, s.getInputSnapshot());
                    if (def != null) {
                        evaluation = settlementService.simulateRuleSetDefinition(def, input);
                    }
                }
            } catch (NumberFormatException ex) {
                settlement = null;
            }
        }

        Map<String, Object> entryMap = new LinkedHashMap<String, Object>();
        entryMap.put("id", String.valueOf(entry.getId()));
        entryMap.put("bizType", entry.getBizType());
        entryMap.put("bizId", entry.getBizId());
        entryMap.put("pointsType", entry.getPointsType());
        entryMap.put("amount", entry.getAmount());
        entryMap.put("occurredAt", entry.getOccurredAt());
        entryMap.put("createdAt", entry.getCreateTime());
        entryMap.put("explain", parseJson(entry.getExplain()));
        entryMap.put("idempotencyKey", entry.getIdempotencyKey());

        Map<String, Object> ownerBrief = null;
        if (ownerUser != null) {
            ownerBrief = new LinkedHashMap<String, Object>();
            ownerBrief.put("id", ownerUser.getId());
            ownerBrief.put("userName", ownerUser.getUserName());
            ownerBrief.put("nickName", ownerUser.getNickName());
        }

        Map<String, Object> taskBrief = null;
        if (task != null) {
            taskBrief = new LinkedHashMap<String, Object>();
            taskBrief.put("id", task.getId());
            taskBrief.put("title", task.getTitle());
        }

        Map<String, Object> projectBrief = null;
        if (project != null) {
            projectBrief = new LinkedHashMap<String, Object>();
            projectBrief.put("id", project.getId());
            projectBrief.put("name", project.getName());
        }

        Map<String, Object> ruleSetVersion = null;
        if (entry.getRuleSetVersionId() != null) {
            RuleSetVersion version = ruleSetVersionMapper.selectById(entry.getRuleSetVersionId());
            if (version != null) {
                RuleSet ruleSet = ruleSetMapper.selectById(version.getRuleSetId());
                ruleSetVersion = new LinkedHashMap<String, Object>();
                ruleSetVersion.put("id", version.getId());
                ruleSetVersion.put("version", version.getVersion());
                ruleSetVersion.put("checksum", version.getChecksum());
                if (ruleSet != null) {
                    Map<String, Object> rs = new LinkedHashMap<String, Object>();
                    rs.put("id", ruleSet.getId());
                    rs.put("name", ruleSet.getName());
                    rs.put("code", ruleSet.getCode());
                    ruleSetVersion.put("ruleSet", rs);
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("entry", entryMap);
        result.put("ownerUser", ownerBrief);
        result.put("task", taskBrief);
        result.put("project", projectBrief);
        result.put("ruleSetVersion", ruleSetVersion);
        result.put("settlement", settlement);
        result.put("evaluation", evaluation);
        result.put("recordedPostings", settlement != null ? settlement.get("outputSnapshot") : null);
        result.put("matchedRecordedPosting", null);
        result.put("taskFactRows", Collections.emptyList());
        return result;
    }

    private Map<String, Object> buildStatRow(StatAgg stat, Map<Integer, PointsAgg> pointsByUser,
            Map<Integer, Integer> qaRejectByUser, Map<Integer, Double> workLogByUser) {
        int uid = stat.user != null ? stat.user.getId() : 0;
        int firstPassRate = stat.totalTasks > 0 ? Math.round(stat.firstPassCount * 100f / stat.totalTasks) : 0;
        double medianLeadTimeDays = perfMedian(stat.leadDaysList);
        double avgDelayHours = stat.tasksWithDue > 0 ? stat.delayHoursSum / stat.tasksWithDue : 0;
        int onTimeRate = stat.onTimeWithDue > 0 ? Math.round(stat.onTimeHits * 100f / stat.onTimeWithDue) : 0;

        Map<String, Object> user = new LinkedHashMap<String, Object>();
        if (stat.user != null) {
            user.put("id", stat.user.getId());
            user.put("userName", stat.user.getUserName());
            user.put("nickName", stat.user.getNickName());
            user.put("avatar", stat.user.getAvatar());
            user.put("userEmail", stat.user.getUserEmail());
        }

        PointsAgg points = pointsByUser.get(uid);
        Map<String, Object> row = new LinkedHashMap<String, Object>();
        row.put("user", user);
        row.put("totalTasks", stat.totalTasks);
        row.put("mainResponsibleTasks", stat.mainResponsibleTasks);
        row.put("totalActualHours", stat.totalActualHours);
        row.put("totalEstimatedHours", stat.totalEstimatedHours);
        row.put("totalBugCount", stat.totalBugCount);
        row.put("firstPassCount", stat.firstPassCount);
        row.put("firstPassRate", firstPassRate);
        row.put("totalPoints", points != null ? points.totalPoints : 0);
        row.put("pointsByType", points != null ? points.byType : Collections.emptyMap());
        row.put("medianLeadTimeDays", round1(medianLeadTimeDays));
        row.put("avgDelayHours", round1(avgDelayHours));
        row.put("onTimeRate", onTimeRate);
        row.put("hoursAccuracyAvg", 0);
        row.put("qaRejectCount", qaRejectByUser.getOrDefault(uid, 0));
        row.put("workLogHours", round1(workLogByUser.getOrDefault(uid, 0.0)));
        row.put("coAssigneeCompletedCount", 0);
        row.put("testerCompletedCount", 0);
        row.put("wipCount", 0);
        row.put("compositeScore", 0);
        row.put("compositeTier", "C");
        Map<String, Object> subScores = new LinkedHashMap<String, Object>();
        subScores.put("throughput", 0);
        subScores.put("quality", 0);
        subScores.put("punctuality", 0);
        subScores.put("speed", 0);
        subScores.put("stability", 0);
        row.put("subScores", subScores);
        return row;
    }

    private void applyCompositeScores(List<Map<String, Object>> rows) {
        List<Integer> tasksArr = new ArrayList<Integer>();
        List<Double> leadArr = new ArrayList<Double>();
        List<Integer> onTimeArr = new ArrayList<Integer>();
        List<Integer> qualArr = new ArrayList<Integer>();
        List<Double> rejPerTask = new ArrayList<Double>();
        for (Map<String, Object> row : rows) {
            tasksArr.add(((Number) row.get("totalTasks")).intValue());
            leadArr.add(((Number) row.get("medianLeadTimeDays")).doubleValue());
            onTimeArr.add(((Number) row.get("onTimeRate")).intValue());
            qualArr.add(((Number) row.get("firstPassRate")).intValue());
            int totalTasks = ((Number) row.get("totalTasks")).intValue();
            int qaRejectCount = ((Number) row.get("qaRejectCount")).intValue();
            rejPerTask.add(totalTasks > 0 ? qaRejectCount * 1.0 / totalTasks : 0);
        }
        int tMin = minInt(tasksArr);
        int tMax = maxInt(tasksArr);
        double leadMin = minDouble(leadArr);
        double leadMax = maxDouble(leadArr);
        int otMin = minInt(onTimeArr);
        int otMax = maxInt(onTimeArr);
        int qMin = minInt(qualArr);
        int qMax = maxInt(qualArr);
        double rpMin = minDouble(rejPerTask);
        double rpMax = maxDouble(rejPerTask);

        for (Map<String, Object> row : rows) {
            int totalTasks = ((Number) row.get("totalTasks")).intValue();
            if (totalTasks == 0) {
                continue;
            }
            double throughput = perfNormMinMax(((Number) row.get("totalTasks")).doubleValue(), tMin, tMax);
            double speed = 100 - perfNormMinMax(((Number) row.get("medianLeadTimeDays")).doubleValue(), leadMin, leadMax);
            double punctuality = perfNormMinMax(((Number) row.get("onTimeRate")).doubleValue(), otMin, otMax);
            double quality = perfNormMinMax(((Number) row.get("firstPassRate")).doubleValue(), qMin, qMax);
            double stability = 100 - perfNormMinMax(
                    ((Number) row.get("qaRejectCount")).doubleValue() / totalTasks, rpMin, rpMax);
            Map<String, Object> subScores = new LinkedHashMap<String, Object>();
            subScores.put("throughput", Math.round(throughput));
            subScores.put("quality", Math.round(quality));
            subScores.put("punctuality", Math.round(punctuality));
            subScores.put("speed", Math.round(speed));
            subScores.put("stability", Math.round(stability));
            row.put("subScores", subScores);
            int compositeScore = (int) Math.round(throughput * 0.18 + quality * 0.22 + punctuality * 0.22
                    + speed * 0.22 + stability * 0.16);
            row.put("compositeScore", compositeScore);
            row.put("compositeTier", perfTierFromScore(compositeScore));
        }
    }

    private Map<String, Object> settlementToMap(PerfSettlement settlement) {
        Map<String, Object> map = new LinkedHashMap<String, Object>();
        map.put("id", String.valueOf(settlement.getId()));
        map.put("settlementKey", settlement.getSettlementKey());
        map.put("settlementType", settlement.getSettlementType());
        map.put("projectId", settlement.getProjectId());
        map.put("taskId", settlement.getTaskId());
        map.put("occurredAt", settlement.getOccurredAt());
        map.put("status", settlement.getStatus());
        map.put("errorMessage", settlement.getErrorMessage());
        map.put("ruleSetVersionId", settlement.getRuleSetVersionId());
        map.put("replacesSettlementId",
                settlement.getReplacesSettlementId() != null ? String.valueOf(settlement.getReplacesSettlementId()) : null);
        map.put("inputSnapshot", parseJson(settlement.getInputSnapshot()));
        map.put("outputSnapshot", parseJson(settlement.getOutputSnapshot()));
        map.put("createdAt", settlement.getCreateTime());
        map.put("updatedAt", settlement.getUpdateTime());
        map.put("settledAt", settlement.getSettledAt());
        return map;
    }

    private Map<String, Object> ledgerEntryToMap(PointsLedgerEntry entry) {
        Map<String, Object> map = new LinkedHashMap<String, Object>();
        map.put("id", String.valueOf(entry.getId()));
        map.put("accountId", String.valueOf(entry.getAccountId()));
        map.put("bizType", entry.getBizType());
        map.put("bizId", entry.getBizId());
        map.put("projectId", entry.getProjectId());
        map.put("taskId", entry.getTaskId());
        map.put("ruleSetVersionId", entry.getRuleSetVersionId());
        map.put("pointsType", entry.getPointsType());
        map.put("amount", entry.getAmount());
        map.put("occurredAt", entry.getOccurredAt());
        map.put("createdAt", entry.getCreateTime());
        map.put("idempotencyKey", entry.getIdempotencyKey());
        map.put("explain", parseJson(entry.getExplain()));
        return map;
    }

    private Object parseJson(String json) {
        if (!StringUtils.hasText(json)) {
            return null;
        }
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception ex) {
            return json;
        }
    }

    private Map<String, Object> emptyStats(int page, int pageSize) {
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("list", Collections.emptyList());
        result.put("total", 0);
        result.put("page", page);
        result.put("pageSize", pageSize);
        result.put("totalPage", 0);
        result.put("summary", emptySummary());
        return result;
    }

    private Map<String, Object> emptySummary() {
        Map<String, Object> summary = new LinkedHashMap<String, Object>();
        summary.put("tasksByType", Collections.emptyMap());
        summary.put("tasksByPriority", Collections.emptyMap());
        Map<String, Object> totals = new LinkedHashMap<String, Object>();
        totals.put("headcount", 0);
        totals.put("completedTasks", 0);
        totals.put("totalWorkLogHours", 0);
        totals.put("totalPoints", 0);
        totals.put("totalQaRejects", 0);
        totals.put("avgCompositeScore", 0);
        totals.put("avgOnTimeRate", 0);
        summary.put("totals", totals);
        return summary;
    }

    private Map<String, Object> emptyLedger(int page, int pageSize) {
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("list", Collections.emptyList());
        result.put("total", 0);
        Map<String, Object> summary = new HashMap<String, Object>();
        summary.put("sumAmount", 0);
        result.put("summary", summary);
        return result;
    }

    private void applyTaskDateFilter(LambdaQueryWrapper<Task> wrapper, LocalDateTime start, LocalDateTime end) {
        if (start == null && end == null) {
            return;
        }
        wrapper.and(w -> w.and(a -> {
            if (start != null) {
                a.ge(Task::getAcceptedAt, start);
            }
            if (end != null) {
                a.le(Task::getAcceptedAt, end);
            }
        }).or(o -> {
            o.isNull(Task::getAcceptedAt);
            if (start != null) {
                o.ge(Task::getUpdateTime, start);
            }
            if (end != null) {
                o.le(Task::getUpdateTime, end);
            }
        }));
    }

    private LocalDateTime parseDateTime(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (DateTimeParseException ex) {
            return LocalDateTime.parse(value.replace(" ", "T"));
        }
    }

    private double daysBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return 0;
        }
        long diff = end.atZone(java.time.ZoneOffset.ofHours(8)).toInstant().toEpochMilli()
                - start.atZone(java.time.ZoneOffset.ofHours(8)).toInstant().toEpochMilli();
        return diff / 86400000.0;
    }

    private double hoursBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return 0;
        }
        long diff = end.atZone(java.time.ZoneOffset.ofHours(8)).toInstant().toEpochMilli()
                - start.atZone(java.time.ZoneOffset.ofHours(8)).toInstant().toEpochMilli();
        return diff / 3600000.0;
    }

    private double perfMedian(List<Double> nums) {
        if (nums.isEmpty()) {
            return 0;
        }
        List<Double> sorted = new ArrayList<Double>(nums);
        Collections.sort(sorted);
        int mid = sorted.size() / 2;
        if (sorted.size() % 2 == 1) {
            return sorted.get(mid);
        }
        return (sorted.get(mid - 1) + sorted.get(mid)) / 2.0;
    }

    private double perfNormMinMax(double value, double min, double max) {
        if (!Double.isFinite(value)) {
            return 50;
        }
        if (max <= min) {
            return 50;
        }
        return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    }

    private String perfTierFromScore(int score) {
        int s = Math.max(0, Math.min(100, score));
        if (s <= 49) {
            return "C";
        }
        if (s <= 69) {
            return "B";
        }
        if (s <= 79) {
            return "A";
        }
        if (s <= 84) {
            return "S-";
        }
        if (s <= 89) {
            return "S";
        }
        if (s <= 94) {
            return "S+";
        }
        if (s <= 98) {
            return "SS";
        }
        return "SSS";
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private int minInt(List<Integer> values) {
        int min = Integer.MAX_VALUE;
        for (Integer value : values) {
            min = Math.min(min, value);
        }
        return min;
    }

    private int maxInt(List<Integer> values) {
        int max = Integer.MIN_VALUE;
        for (Integer value : values) {
            max = Math.max(max, value);
        }
        return max;
    }

    private double minDouble(List<Double> values) {
        double min = Double.MAX_VALUE;
        for (Double value : values) {
            min = Math.min(min, value);
        }
        return min;
    }

    private double maxDouble(List<Double> values) {
        double max = -Double.MAX_VALUE;
        for (Double value : values) {
            max = Math.max(max, value);
        }
        return max;
    }

    private static class PointsAgg {
        private int totalPoints;
        private Map<String, Integer> byType = new HashMap<String, Integer>();
    }

    private static class StatAgg {
        private User user;
        private int totalTasks;
        private int mainResponsibleTasks;
        private double totalActualHours;
        private double totalEstimatedHours;
        private int totalBugCount;
        private int firstPassCount;
        private List<Double> leadDaysList = new ArrayList<Double>();
        private int onTimeWithDue;
        private int onTimeHits;
        private double delayHoursSum;
        private int tasksWithDue;
    }
}
