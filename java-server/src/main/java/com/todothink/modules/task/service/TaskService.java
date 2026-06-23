package com.todothink.modules.task.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.todothink.core.exception.BusinessException;
import com.todothink.modules.attachment.entity.Attachment;
import com.todothink.modules.attachment.service.AttachmentService;
import com.todothink.modules.message.dto.SendMessageRequest;
import com.todothink.modules.message.service.MessageService;
import com.todothink.modules.performance.service.SettlementService;
import com.todothink.modules.system.entity.User;
import com.todothink.modules.system.mapper.UserMapper;
import com.todothink.modules.task.dto.CreateTaskCommentRequest;
import com.todothink.modules.task.dto.CreateWorkLogRequest;
import com.todothink.modules.task.dto.QaAuditRequest;
import com.todothink.modules.task.dto.SubmitTestRequest;
import com.todothink.modules.task.entity.Project;
import com.todothink.modules.task.entity.ProjectTaskRule;
import com.todothink.modules.task.entity.Task;
import com.todothink.modules.task.entity.TaskAttachment;
import com.todothink.modules.task.entity.TaskCoAssignee;
import com.todothink.modules.task.entity.TaskComment;
import com.todothink.modules.task.entity.TaskCommentAttachment;
import com.todothink.modules.task.entity.TaskTimeline;
import com.todothink.modules.task.entity.TestCase;
import com.todothink.modules.task.entity.WorkLog;
import com.todothink.modules.task.entity.WorkLogAttachment;
import com.todothink.modules.task.mapper.ProjectMapper;
import com.todothink.modules.task.mapper.ProjectTaskRuleMapper;
import com.todothink.modules.task.mapper.TaskAttachmentMapper;
import com.todothink.modules.task.mapper.TaskCoAssigneeMapper;
import com.todothink.modules.task.mapper.TaskCommentAttachmentMapper;
import com.todothink.modules.task.mapper.TaskCommentMapper;
import com.todothink.modules.task.mapper.TaskMapper;
import com.todothink.modules.task.mapper.TaskQueryMapper;
import com.todothink.modules.task.mapper.TaskTimelineMapper;
import com.todothink.modules.task.mapper.TestCaseMapper;
import com.todothink.modules.task.mapper.WorkLogAttachmentMapper;
import com.todothink.modules.task.mapper.WorkLogMapper;
import com.todothink.modules.task.support.TaskComplexityTier;
import com.todothink.modules.task.util.TaskWorkDomainUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TaskService {

    private static final Logger log = LoggerFactory.getLogger(TaskService.class);
    private static final Pattern MENTION_PATTERN = Pattern.compile("@([^\\s@，。,.!?;:：]{1,30})");

    private final TaskMapper taskMapper;
    private final TaskQueryMapper taskQueryMapper;
    private final TaskAttachmentMapper taskAttachmentMapper;
    private final TaskCoAssigneeMapper taskCoAssigneeMapper;
    private final TestCaseMapper testCaseMapper;
    private final WorkLogMapper workLogMapper;
    private final WorkLogAttachmentMapper workLogAttachmentMapper;
    private final TaskCommentMapper taskCommentMapper;
    private final TaskCommentAttachmentMapper taskCommentAttachmentMapper;
    private final TaskTimelineMapper taskTimelineMapper;
    private final ProjectMapper projectMapper;
    private final ProjectTaskRuleMapper projectTaskRuleMapper;
    private final ProjectService projectService;
    private final AttachmentService attachmentService;
    private final MessageService messageService;
    private final UserMapper userMapper;
    private final SettlementService settlementService;

    public TaskService(TaskMapper taskMapper, TaskQueryMapper taskQueryMapper,
            TaskAttachmentMapper taskAttachmentMapper, TaskCoAssigneeMapper taskCoAssigneeMapper,
            TestCaseMapper testCaseMapper, WorkLogMapper workLogMapper,
            WorkLogAttachmentMapper workLogAttachmentMapper, TaskCommentMapper taskCommentMapper,
            TaskCommentAttachmentMapper taskCommentAttachmentMapper, TaskTimelineMapper taskTimelineMapper,
            ProjectMapper projectMapper, ProjectTaskRuleMapper projectTaskRuleMapper,
            ProjectService projectService, AttachmentService attachmentService,
            MessageService messageService, UserMapper userMapper, SettlementService settlementService) {
        this.taskMapper = taskMapper;
        this.taskQueryMapper = taskQueryMapper;
        this.taskAttachmentMapper = taskAttachmentMapper;
        this.taskCoAssigneeMapper = taskCoAssigneeMapper;
        this.testCaseMapper = testCaseMapper;
        this.workLogMapper = workLogMapper;
        this.workLogAttachmentMapper = workLogAttachmentMapper;
        this.taskCommentMapper = taskCommentMapper;
        this.taskCommentAttachmentMapper = taskCommentAttachmentMapper;
        this.taskTimelineMapper = taskTimelineMapper;
        this.projectMapper = projectMapper;
        this.projectTaskRuleMapper = projectTaskRuleMapper;
        this.projectService = projectService;
        this.attachmentService = attachmentService;
        this.messageService = messageService;
        this.userMapper = userMapper;
        this.settlementService = settlementService;
    }

    public Map<String, Object> page(int page, int pageSize, Integer projectId, String status,
            Integer mainAssigneeId, String keyword, Integer userId) {
        List<Integer> orgIds = projectService.getOrgIdsForUser(userId);
        if (orgIds.isEmpty()) {
            Map<String, Object> empty = new HashMap<String, Object>();
            empty.put("list", Collections.emptyList());
            empty.put("total", 0L);
            return empty;
        }

        int offset = (page - 1) * pageSize;
        List<Task> tasks = taskQueryMapper.selectTaskPage(orgIds, projectId, status, mainAssigneeId, keyword,
                offset, pageSize);
        long total = taskQueryMapper.countTaskPage(orgIds, projectId, status, mainAssigneeId, keyword);

        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        for (Task task : tasks) {
            list.add(toTaskPageItem(task));
        }

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("list", list);
        result.put("total", total);
        return result;
    }

    public Map<String, Object> info(Integer id, Integer userId) {
        try {
            projectService.assertUserCanAccessTask(userId, id);
        } catch (BusinessException ex) {
            if (ex.getCode() == 404 || ex.getCode() == 403) {
                return null;
            }
            throw ex;
        }
        return loadTaskDetail(id, userId);
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body, Integer userId) {
        Integer projectId = toInt(body.get("projectId"));
        if (projectId == null || projectId <= 0) {
            throw new BusinessException("项目ID无效");
        }
        projectService.assertUserCanAccessProject(userId, projectId);

        Project proj = projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                .eq(Project::getId, projectId)
                .isNull(Project::getDeletedAt)
                .select(Project::getId, Project::getOrgId, Project::getName));
        if (proj == null || proj.getOrgId() == null) {
            throw new BusinessException("项目未绑定组织，无法创建任务");
        }

        String title = asString(body.get("title"));
        if (!StringUtils.hasText(title)) {
            throw new BusinessException("任务标题不能为空");
        }

        List<Integer> coAssigneeIds = toIntList(body.get("coAssigneeIds"));
        List<Map<String, Object>> testCases = toMapList(body.get("testCases"));
        List<Integer> attachmentIds = toIntList(body.get("attachmentIds"));

        attachmentService.assertAttachmentsOwnedByUser(attachmentIds, userId);

        Integer bodyOrgId = toInt(body.get("orgId"));
        if (bodyOrgId != null && !bodyOrgId.equals(proj.getOrgId())) {
            throw new BusinessException("任务组织必须与所属项目一致");
        }

        String type = asStringOrDefault(body.get("type"), "FEATURE");
        String priority = asStringOrDefault(body.get("priority"), "P2");
        String workDomain = asStringOrDefault(body.get("workDomain"), "GENERAL");
        Double estimatedHours = toDouble(body.get("estimatedHours"));
        LocalDateTime dueDate = parseDateTime(body.get("dueDate"));
        Integer mainAssigneeId = toInt(body.get("mainAssigneeId"));
        Integer testerId = toInt(body.get("testerId"));

        Map<String, Object> rules = projectService.taskRulesInfo(projectId, userId);
        if (Boolean.TRUE.equals(rules.get("requireEstimateHours"))
                && (estimatedHours == null || estimatedHours <= 0)) {
            throw new BusinessException("该项目要求创建任务时填写预估工时（estimatedHours），当前为空或非正数。");
        }
        if (Boolean.TRUE.equals(rules.get("requireDueDate")) && dueDate == null) {
            throw new BusinessException("该项目要求创建任务时填写截止时间（dueDate），当前为空。");
        }

        String status = mainAssigneeId != null ? "IN_PROGRESS" : "PENDING";
        double suggestedBaseScore = TaskComplexityTier.calcSuggestedBaseScore(type, priority, estimatedHours,
                workDomain);
        Double baseScore = toDouble(body.get("baseScore"));
        String baseScoreSource;
        Double resolvedBaseScore;
        if (baseScore != null) {
            resolvedBaseScore = baseScore;
            baseScoreSource = "MANUAL";
        } else {
            resolvedBaseScore = suggestedBaseScore;
            baseScoreSource = "AUTO";
        }

        String complexityTier = asStringOrDefault(body.get("complexityTier"), "STANDARD");
        double complexity = TaskComplexityTier.coefficientForTierOrDefault(complexityTier);

        Task task = new Task();
        task.setProjectId(projectId);
        task.setOrgId(proj.getOrgId());
        task.setTitle(title.trim());
        task.setStatus(status);
        task.setType(type);
        task.setPriority(priority);
        task.setWorkDomain(workDomain);
        task.setParentId(toInt(body.get("parentId")));
        task.setDescription(asString(body.get("description")));
        task.setMainAssigneeId(mainAssigneeId);
        task.setTesterId(testerId);
        task.setEstimatedHours(estimatedHours);
        task.setDueDate(dueDate);
        task.setSuggestedBaseScore(suggestedBaseScore);
        task.setBaseScore(resolvedBaseScore);
        task.setBaseScoreSource(baseScoreSource);
        task.setComplexityTier(complexityTier);
        task.setComplexity(complexity);
        task.setVersion(0);
        taskMapper.insert(task);

        Integer taskId = task.getId();
        for (Integer coId : coAssigneeIds) {
            if (coId != null) {
                TaskCoAssignee row = new TaskCoAssignee();
                row.setTaskId(taskId);
                row.setUserId(coId);
                taskCoAssigneeMapper.insert(row);
            }
        }

        if (TaskComplexityTier.taskSupportsTestCases(workDomain)) {
            for (Map<String, Object> tc : testCases) {
                String desc = asString(tc.get("description"));
                String expected = asString(tc.get("expectedResult"));
                if (StringUtils.hasText(desc) && StringUtils.hasText(expected)) {
                    TestCase row = new TestCase();
                    row.setTaskId(taskId);
                    row.setDescription(desc);
                    row.setExpectedResult(expected);
                    testCaseMapper.insert(row);
                }
            }
        }

        if (attachmentIds != null) {
            int sort = 0;
            for (Integer attachmentId : attachmentIds) {
                TaskAttachment row = new TaskAttachment();
                row.setTaskId(taskId);
                row.setAttachmentId(attachmentId);
                row.setSort(sort++);
                taskAttachmentMapper.insert(row);
            }
        }

        String timelineContent = "任务已创建" + (mainAssigneeId != null ? "并指定负责人，进入开发中" : "");
        appendTaskTimeline(taskId, "TASK_CREATED", "创建任务", timelineContent, userId, null, status);

        Task created = taskMapper.selectById(taskId);
        notifyTaskCreated(created, coAssigneeIds, userId, proj.getName());

        return loadTaskCreateResult(taskId);
    }

    @Transactional
    public Map<String, Object> update(Integer id, Map<String, Object> body, Integer userId) {
        projectService.assertUserCanAccessTask(userId, id);

        Integer version = toInt(body.get("version"));
        if (version == null || version < 0) {
            throw new BusinessException("更新时必须提供数据版本号以确保一致性");
        }

        Task existing = taskMapper.selectOne(new LambdaQueryWrapper<Task>()
                .eq(Task::getId, id)
                .eq(Task::getVersion, version));
        if (existing == null) {
            throw new BusinessException("当前任务状态或信息已被他人修改，请刷新后重试", 409);
        }

        List<Integer> coAssigneeIds = body.containsKey("coAssigneeIds") ? toIntList(body.get("coAssigneeIds")) : null;
        List<Integer> attachmentIds = body.containsKey("attachmentIds") ? toIntList(body.get("attachmentIds")) : null;
        List<Map<String, Object>> testCases = body.containsKey("testCases") ? toMapList(body.get("testCases")) : null;

        String nextWorkDomain = body.containsKey("workDomain")
                ? asString(body.get("workDomain"))
                : existing.getWorkDomain();
        boolean shouldAutoStartByAssign = !body.containsKey("status")
                && "PENDING".equals(existing.getStatus())
                && body.containsKey("mainAssigneeId")
                && toInt(body.get("mainAssigneeId")) != null;

        Map<String, Object> rules = projectService.taskRulesInfo(existing.getProjectId(), userId);
        Double nextEstimatedHours = body.containsKey("estimatedHours")
                ? toDouble(body.get("estimatedHours"))
                : existing.getEstimatedHours();
        if (Boolean.TRUE.equals(rules.get("requireEstimateHours"))
                && (nextEstimatedHours == null || nextEstimatedHours <= 0)) {
            throw new BusinessException("该项目要求任务必须填写预估工时（estimatedHours），请补全后再更新。");
        }

        LocalDateTime nextDueDate = body.containsKey("dueDate")
                ? parseDateTime(body.get("dueDate"))
                : existing.getDueDate();
        if (Boolean.TRUE.equals(rules.get("requireDueDate")) && nextDueDate == null) {
            throw new BusinessException("该项目要求任务必须填写截止时间（dueDate），请补全后再更新。");
        }

        String nextType = body.containsKey("type") ? asString(body.get("type")) : existing.getType();
        String nextPriority = body.containsKey("priority") ? asString(body.get("priority")) : existing.getPriority();
        double nextSuggestedBaseScore = TaskComplexityTier.calcSuggestedBaseScore(nextType, nextPriority,
                nextEstimatedHours, nextWorkDomain);

        String nextBaseScoreSource = body.containsKey("baseScoreSource")
                ? asString(body.get("baseScoreSource"))
                : (body.containsKey("baseScore") ? "MANUAL" : existing.getBaseScoreSource());
        Double nextBaseScore;
        if (body.containsKey("baseScore")) {
            nextBaseScore = toDouble(body.get("baseScore"));
        } else if ("MANUAL".equals(nextBaseScoreSource)) {
            nextBaseScore = nextSuggestedBaseScore;
        } else {
            nextBaseScore = nextSuggestedBaseScore;
        }
        String resolvedBaseScoreSource = body.containsKey("baseScore")
                ? "MANUAL"
                : ("MANUAL".equals(nextBaseScoreSource) ? "MANUAL" : "AUTO");

        if (testCases != null && !TaskComplexityTier.taskSupportsTestCases(nextWorkDomain) && !testCases.isEmpty()) {
            throw new BusinessException("仅软件开发类任务可维护测试用例");
        }

        LambdaUpdateWrapper<Task> wrapper = new LambdaUpdateWrapper<Task>()
                .eq(Task::getId, id)
                .eq(Task::getVersion, version)
                .setSql("version = version + 1")
                .set(Task::getSuggestedBaseScore, nextSuggestedBaseScore)
                .set(Task::getBaseScore, nextBaseScore)
                .set(Task::getBaseScoreSource, resolvedBaseScoreSource);

        if (body.containsKey("parentId")) {
            wrapper.set(Task::getParentId, toInt(body.get("parentId")));
        }
        if (body.containsKey("workDomain")) {
            wrapper.set(Task::getWorkDomain, nextWorkDomain);
        }
        if (body.containsKey("type")) {
            wrapper.set(Task::getType, nextType);
        }
        if (body.containsKey("priority")) {
            wrapper.set(Task::getPriority, nextPriority);
        }
        if (body.containsKey("dueDate")) {
            wrapper.set(Task::getDueDate, nextDueDate);
        }
        if (body.containsKey("title")) {
            String title = asString(body.get("title"));
            if (!StringUtils.hasText(title)) {
                throw new BusinessException("任务标题不能为空");
            }
            wrapper.set(Task::getTitle, title.trim());
        }
        if (body.containsKey("description")) {
            wrapper.set(Task::getDescription, asString(body.get("description")));
        }
        if (body.containsKey("mainAssigneeId")) {
            wrapper.set(Task::getMainAssigneeId, toInt(body.get("mainAssigneeId")));
        }
        if (body.containsKey("testerId")) {
            wrapper.set(Task::getTesterId, toInt(body.get("testerId")));
        }
        if (body.containsKey("estimatedHours")) {
            wrapper.set(Task::getEstimatedHours, nextEstimatedHours);
        }
        if (body.containsKey("complexityTier")) {
            String tier = asString(body.get("complexityTier"));
            wrapper.set(Task::getComplexityTier, tier);
            wrapper.set(Task::getComplexity, TaskComplexityTier.coefficientForTierOrDefault(tier));
        }
        if (body.containsKey("status")) {
            wrapper.set(Task::getStatus, asString(body.get("status")));
        } else if (shouldAutoStartByAssign) {
            wrapper.set(Task::getStatus, "IN_PROGRESS");
        }

        int updated = taskMapper.update(null, wrapper);
        if (updated == 0) {
            throw new BusinessException("当前任务状态或信息已被他人修改，请刷新后重试", 409);
        }

        if (coAssigneeIds != null) {
            taskCoAssigneeMapper.delete(new LambdaQueryWrapper<TaskCoAssignee>()
                    .eq(TaskCoAssignee::getTaskId, id));
            for (Integer coId : coAssigneeIds) {
                if (coId != null) {
                    TaskCoAssignee row = new TaskCoAssignee();
                    row.setTaskId(id);
                    row.setUserId(coId);
                    taskCoAssigneeMapper.insert(row);
                }
            }
        }

        if (attachmentIds != null) {
            attachmentService.assertAttachmentsAllowedForTaskEdit(attachmentIds, id, userId);
            taskAttachmentMapper.delete(new LambdaQueryWrapper<TaskAttachment>()
                    .eq(TaskAttachment::getTaskId, id));
            int sort = 0;
            for (Integer attachmentId : attachmentIds) {
                TaskAttachment row = new TaskAttachment();
                row.setTaskId(id);
                row.setAttachmentId(attachmentId);
                row.setSort(sort++);
                taskAttachmentMapper.insert(row);
            }
        }

        if (testCases != null) {
            syncTestCases(id, nextWorkDomain, testCases);
        } else if (!TaskComplexityTier.taskSupportsTestCases(nextWorkDomain)) {
            testCaseMapper.delete(new LambdaQueryWrapper<TestCase>().eq(TestCase::getTaskId, id));
        }

        boolean shouldNotify = body.containsKey("mainAssigneeId")
                || body.containsKey("testerId")
                || coAssigneeIds != null;
        if (shouldNotify) {
            notifyTaskAssigneeUpdated(id, userId);
        }

        return loadTaskUpdateResult(id);
    }

    @Transactional
    public void delete(Integer id, Integer userId) {
        projectService.assertUserCanAccessTask(userId, id);
        taskMapper.deleteById(id);
    }

    public Map<String, Object> startWork(Integer taskId, Integer userId) {
        projectService.assertUserCanAccessTask(userId, taskId);

        Task task = requireTask(taskId);
        List<TaskCoAssignee> coAssignees = loadCoAssignees(taskId);
        Project project = loadProject(task.getProjectId());

        if (!isMainAssignee(task, userId) && !isCoAssignee(coAssignees, userId)) {
            throw new BusinessException("无权限：仅任务负责人可开始开发", 403);
        }
        if (!"PENDING".equals(task.getStatus())) {
            throw new BusinessException("当前状态（" + task.getStatus() + "）无法开始开发");
        }

        Map<String, Object> rules = projectService.taskRulesInfo(task.getProjectId(), userId);
        if (Boolean.TRUE.equals(rules.get("requireEstimateHours"))
                && (task.getEstimatedHours() == null || task.getEstimatedHours() <= 0)) {
            throw new BusinessException("该项目要求开发前填写预估工时（estimatedHours）。请先补全后再开始开发。");
        }
        if (Boolean.TRUE.equals(rules.get("requireDueDate")) && task.getDueDate() == null) {
            throw new BusinessException("该项目要求开发前填写截止时间（dueDate）。请先补全后再开始开发。");
        }

        Task update = new Task();
        update.setId(taskId);
        update.setStatus("IN_PROGRESS");
        taskMapper.updateById(update);

        appendTaskTimeline(taskId, "STATUS_CHANGED", "开始开发", null, userId, task.getStatus(), "IN_PROGRESS");

        notifyTaskStakeholders(task, coAssignees, userId, "任务已开始开发",
                "任务「" + safeTitle(task) + "」进入开发中（项目：" + safeProjectName(project) + "）。",
                "started");

        return toTaskMap(taskMapper.selectById(taskId));
    }

    @Transactional
    public Map<String, Object> addWorkLog(Integer taskId, Integer userId, CreateWorkLogRequest dto) {
        projectService.assertUserCanAccessTask(userId, taskId);

        Task task = requireTask(taskId);
        List<TaskCoAssignee> coAssignees = loadCoAssignees(taskId);
        Project project = loadProject(task.getProjectId());

        if ("COMPLETED".equals(task.getStatus()) || "CANCELLED".equals(task.getStatus())) {
            throw new BusinessException("已结束的任务不可登记工时");
        }
        if ("QA_REVIEW".equals(task.getStatus())) {
            throw new BusinessException("验收中的任务不可登记工时");
        }
        if (!isMainAssignee(task, userId) && !isCoAssignee(coAssignees, userId)) {
            throw new BusinessException("无权限：仅任务负责人可填写工时", 403);
        }

        attachmentService.assertAttachmentsOwnedByUser(dto.getAttachmentIds(), userId);

        WorkLog workLog = new WorkLog();
        workLog.setTaskId(taskId);
        workLog.setUserId(userId);
        workLog.setHours(dto.getHours());
        workLog.setContent(dto.getContent());
        workLogMapper.insert(workLog);

        if (dto.getAttachmentIds() != null) {
            int sort = 0;
            for (Integer attachmentId : dto.getAttachmentIds()) {
                WorkLogAttachment row = new WorkLogAttachment();
                row.setWorkLogId(workLog.getId());
                row.setAttachmentId(attachmentId);
                row.setSort(sort++);
                workLogAttachmentMapper.insert(row);
            }
        }

        String timelineContent = dto.getHours() + "h · " + truncate(dto.getContent(), 80);
        appendTaskTimeline(taskId, "WORKLOG_ADDED", "登记工时", timelineContent, userId, null, null);

        notifyTaskStakeholders(task, coAssignees, userId, "工时已登记",
                "任务「" + safeTitle(task) + "」新增工时：" + dto.getHours() + "h（项目："
                        + safeProjectName(project) + "）。",
                "worklogAdded");

        return loadWorkLogVo(workLog.getId());
    }

    @Transactional
    public Map<String, Object> addComment(Integer taskId, Integer userId, CreateTaskCommentRequest dto) {
        projectService.assertUserCanAccessTask(userId, taskId);

        Task task = requireTask(taskId);
        List<TaskCoAssignee> coAssignees = loadCoAssignees(taskId);
        Project project = loadProject(task.getProjectId());

        if ("COMPLETED".equals(task.getStatus()) || "CANCELLED".equals(task.getStatus())) {
            throw new BusinessException("已结束的任务不可发表评论");
        }
        if ("QA_REVIEW".equals(task.getStatus())) {
            boolean isTester = task.getTesterId() != null && task.getTesterId().equals(userId);
            boolean isCo = isCoAssignee(coAssignees, userId);
            ProjectTaskRule rule = projectTaskRuleMapper.selectOne(new LambdaQueryWrapper<ProjectTaskRule>()
                    .eq(ProjectTaskRule::getProjectId, task.getProjectId()));
            boolean allowCoQa = rule != null && Boolean.TRUE.equals(rule.getAllowCoAssigneeSubmitQa());
            if (!isTester && !(allowCoQa && isCo)) {
                throw new BusinessException("验收中的任务仅验收人或协助验收人可发表评论");
            }
        }

        attachmentService.assertAttachmentsOwnedByUser(dto.getAttachmentIds(), userId);

        TaskComment comment = new TaskComment();
        comment.setTaskId(taskId);
        comment.setUserId(userId);
        comment.setContent(dto.getContent().trim());
        taskCommentMapper.insert(comment);

        if (dto.getAttachmentIds() != null) {
            int sort = 0;
            for (Integer attachmentId : dto.getAttachmentIds()) {
                TaskCommentAttachment row = new TaskCommentAttachment();
                row.setCommentId(comment.getId());
                row.setAttachmentId(attachmentId);
                row.setSort(sort++);
                taskCommentAttachmentMapper.insert(row);
            }
        }

        appendTaskTimeline(taskId, "COMMENT_ADDED", "发表评论", truncate(dto.getContent(), 120), userId, null, null);

        Set<Integer> receiverIds = collectStakeholderIds(task, coAssignees);
        receiverIds.remove(userId);
        addMentionedUsers(receiverIds, dto.getContent());

        notifyReceivers(receiverIds, userId, task, project, "任务收到新评论",
                "任务「" + safeTitle(task) + "」新增评论：" + truncate(dto.getContent(), 80)
                        + "（项目：" + safeProjectName(project) + "）。",
                "commentAdded");

        return loadCommentVo(comment.getId());
    }

    @Transactional
    public Map<String, Object> submitTest(Integer taskId, Integer userId, SubmitTestRequest dto) {
        projectService.assertUserCanAccessTask(userId, taskId);

        Task task = requireTask(taskId);
        Project project = loadProject(task.getProjectId());

        if (task.getMainAssigneeId() == null || !task.getMainAssigneeId().equals(userId)) {
            throw new BusinessException("仅主要负责人才可提交验收", 403);
        }
        if (!"IN_PROGRESS".equals(task.getStatus())) {
            throw new BusinessException("当前状态（" + task.getStatus() + "）不可提交验收");
        }

        Map<String, Object> rules = projectService.taskRulesInfo(task.getProjectId(), userId);
        List<TestCase> testCases = testCaseMapper.selectList(new LambdaQueryWrapper<TestCase>()
                .eq(TestCase::getTaskId, taskId));

        if (TaskWorkDomainUtil.taskSupportsTestCases(task.getWorkDomain())) {
            if (testCases.isEmpty()) {
                throw new BusinessException("请先添加测试用例");
            }
            List<SubmitTestRequest.TestCaseSelfResultItem> results = dto.getTestCaseResults() != null
                    ? dto.getTestCaseResults()
                    : Collections.<SubmitTestRequest.TestCaseSelfResultItem>emptyList();

            if (Boolean.TRUE.equals(rules.get("requireTestEvidenceForDev"))) {
                if (results.size() != testCases.size()) {
                    throw new BusinessException("请完整提交全部测试用例的自测结果");
                }
                for (SubmitTestRequest.TestCaseSelfResultItem r : results) {
                    if (!"PASSED".equals(r.getSelfTestStatus())) {
                        throw new BusinessException(
                                "所有测试用例必须全部自测通过才能提交验收（已启用项目规则：requireTestEvidenceForDev）");
                    }
                }
            } else {
                Set<Integer> taskCaseIds = new HashSet<Integer>();
                for (TestCase tc : testCases) {
                    taskCaseIds.add(tc.getId());
                }
                for (SubmitTestRequest.TestCaseSelfResultItem r : results) {
                    if (!taskCaseIds.contains(r.getId())) {
                        throw new BusinessException("自测结果包含无效测试用例，请重新选择");
                    }
                }
            }

            for (SubmitTestRequest.TestCaseSelfResultItem r : results) {
                TestCase update = new TestCase();
                update.setId(r.getId());
                update.setSelfTestStatus(r.getSelfTestStatus());
                update.setSelfTestRemark(r.getSelfTestRemark());
                testCaseMapper.updateById(update);
            }
        }

        Task update = new Task();
        update.setId(taskId);
        update.setStatus("QA_REVIEW");
        update.setQaRejectReason(null);
        taskMapper.updateById(update);

        appendTaskTimeline(taskId, "STATUS_CHANGED", "提交验收", null, userId, task.getStatus(), "QA_REVIEW");

        List<TaskCoAssignee> coAssignees = loadCoAssignees(taskId);
        notifyTaskStakeholders(task, coAssignees, userId, "任务已提测",
                "任务「" + safeTitle(task) + "」已提交验收（项目：" + safeProjectName(project) + "）。",
                "submittedForQa");

        return toTaskMap(taskMapper.selectById(taskId));
    }

    @Transactional
    public Map<String, Object> qaAudit(Integer taskId, Integer userId, QaAuditRequest dto) {
        projectService.assertUserCanAccessTask(userId, taskId);

        Task task = requireTask(taskId);
        List<TaskCoAssignee> coAssignees = loadCoAssignees(taskId);
        Project project = loadProject(task.getProjectId());
        Map<String, Object> rules = projectService.taskRulesInfo(task.getProjectId(), userId);

        boolean isCoAssignee = isCoAssignee(coAssignees, userId);
        if (task.getTesterId() == null || !task.getTesterId().equals(userId)) {
            if (!(Boolean.TRUE.equals(rules.get("allowCoAssigneeSubmitQa")) && isCoAssignee)) {
                throw new BusinessException("无权限：仅测试验收人可进行 QA 审核（协助人权限未启用）", 403);
            }
        }
        if (!"QA_REVIEW".equals(task.getStatus())) {
            throw new BusinessException("任务当前不在验收中状态");
        }

        boolean supportsTestCases = TaskWorkDomainUtil.taskSupportsTestCases(task.getWorkDomain());
        List<TestCase> testCases = testCaseMapper.selectList(new LambdaQueryWrapper<TestCase>()
                .eq(TestCase::getTaskId, taskId));
        List<QaAuditRequest.TestCaseQaResultItem> qaResults = dto.getTestCaseResults() != null
                ? dto.getTestCaseResults()
                : Collections.<QaAuditRequest.TestCaseQaResultItem>emptyList();

        if (supportsTestCases) {
            if (testCases.isEmpty()) {
                throw new BusinessException("暂无用例可验收");
            }
            if (qaResults.size() != testCases.size()) {
                throw new BusinessException("请完整提交全部测试用例的验收结果");
            }
        } else if (!StringUtils.hasText(dto.getDecision())) {
            throw new BusinessException("请明确本次验收结果（通过或打回）");
        }

        boolean hasFailure;
        if (supportsTestCases) {
            hasFailure = false;
            for (QaAuditRequest.TestCaseQaResultItem r : qaResults) {
                if ("FAILED".equals(r.getQaStatus())) {
                    hasFailure = true;
                }
                TestCase tcUpdate = new TestCase();
                tcUpdate.setId(r.getId());
                tcUpdate.setQaStatus(r.getQaStatus());
                tcUpdate.setQaRemark(r.getQaRemark());
                testCaseMapper.updateById(tcUpdate);
                if ("FAILED".equals(r.getQaStatus())) {
                    testCaseMapper.update(null, new LambdaUpdateWrapper<TestCase>()
                            .eq(TestCase::getId, r.getId())
                            .setSql("bug_count = bug_count + 1"));
                }
            }
        } else {
            hasFailure = "reject".equals(dto.getDecision());
        }

        Map<String, Object> updated;
        if (hasFailure) {
            String rejectReason = dto.getQaRejectReason() != null ? dto.getQaRejectReason().trim() : null;
            if (!StringUtils.hasText(rejectReason)) {
                throw new BusinessException("请填写打回原因");
            }
            boolean needHours = !Boolean.TRUE.equals(rules.get("allowQaRejectWithoutHours"));
            if (needHours) {
                if (dto.getActualHours() == null || dto.getActualHours() <= 0) {
                    throw new BusinessException("打回修改需要填写实际工时（规则：allowQaRejectWithoutHours=false）");
                }
            }

            Task update = new Task();
            update.setId(taskId);
            update.setStatus("IN_PROGRESS");
            update.setQaRejectReason(rejectReason);
            if (dto.getActualHours() != null && needHours) {
                update.setActualHours(dto.getActualHours());
            }
            taskMapper.updateById(update);

            appendTaskTimeline(taskId, "QA_REJECTED", "验收打回", rejectReason, userId, "QA_REVIEW", "IN_PROGRESS");

            notifyTaskStakeholders(task, coAssignees, userId, "任务被打回",
                    "任务「" + safeTitle(task) + "」QA 验收未通过，已打回（项目："
                            + safeProjectName(project) + "）。",
                    "qaRejected");

            updated = toTaskMap(taskMapper.selectById(taskId));
        } else {
            if (dto.getActualHours() == null || dto.getActualHours() <= 0) {
                throw new BusinessException("验收通过时必须填写实际工时");
            }

            Task update = new Task();
            update.setId(taskId);
            update.setStatus("COMPLETED");
            update.setActualHours(dto.getActualHours());
            update.setQaRejectReason(null);
            update.setAcceptedAt(LocalDateTime.now());
            taskMapper.updateById(update);

            appendTaskTimeline(taskId, "QA_PASSED", "验收通过",
                    "确认实际工时 " + dto.getActualHours() + "h", userId, "QA_REVIEW", "COMPLETED");

            notifyTaskStakeholders(task, coAssignees, userId, "任务验收通过",
                    "任务「" + safeTitle(task) + "」已验收通过并完成（项目："
                            + safeProjectName(project) + "）。",
                    "qaPassed");

            updated = toTaskMap(taskMapper.selectById(taskId));

            try {
                settlementService.createFirstSettlementForAcceptedTask(taskId);
            } catch (Exception e) {
                log.error("[perf] create settlement failed taskId={}: {}", taskId, e.getMessage());
            }
        }

        return updated;
    }

    public Map<String, Object> pauseTask(Integer taskId, Integer userId) {
        projectService.assertUserCanAccessTask(userId, taskId);

        Task task = requireTask(taskId);
        List<TaskCoAssignee> coAssignees = loadCoAssignees(taskId);
        Project project = loadProject(task.getProjectId());

        boolean isProjectManager = project != null && project.getManagerId() != null
                && project.getManagerId().equals(userId);
        if (!isMainAssignee(task, userId) && !isCoAssignee(coAssignees, userId) && !isProjectManager) {
            throw new BusinessException("无权限：仅任务负责人或项目负责人可暂停任务", 403);
        }
        if (!"IN_PROGRESS".equals(task.getStatus())) {
            throw new BusinessException("当前状态（" + task.getStatus() + "）无法暂停");
        }

        taskMapper.update(null, new LambdaUpdateWrapper<Task>()
                .eq(Task::getId, taskId)
                .set(Task::getStatus, "PAUSED")
                .setSql("version = version + 1"));

        appendTaskTimeline(taskId, "STATUS_CHANGED", "暂停任务", null, userId, "IN_PROGRESS", "PAUSED");

        notifyTaskStakeholders(task, coAssignees, userId, "任务已暂停",
                "任务「" + safeTitle(task) + "」已被暂停。", "paused");

        return toTaskMap(taskMapper.selectById(taskId));
    }

    public Map<String, Object> resumeTask(Integer taskId, Integer userId) {
        projectService.assertUserCanAccessTask(userId, taskId);

        Task task = requireTask(taskId);
        List<TaskCoAssignee> coAssignees = loadCoAssignees(taskId);

        if (!isMainAssignee(task, userId) && !isCoAssignee(coAssignees, userId)) {
            throw new BusinessException("无权限：仅任务负责人可恢复开发", 403);
        }
        if (!"PAUSED".equals(task.getStatus())) {
            throw new BusinessException("当前状态不是暂停中，无法恢复");
        }

        taskMapper.update(null, new LambdaUpdateWrapper<Task>()
                .eq(Task::getId, taskId)
                .set(Task::getStatus, "IN_PROGRESS")
                .setSql("version = version + 1"));

        appendTaskTimeline(taskId, "STATUS_CHANGED", "恢复开发", null, userId, "PAUSED", "IN_PROGRESS");

        notifyTaskStakeholders(task, coAssignees, userId, "任务已恢复开发",
                "任务「" + safeTitle(task) + "」已恢复开发。", "resumed");

        return toTaskMap(taskMapper.selectById(taskId));
    }

    public Map<String, Object> reopenTask(Integer taskId, Integer userId) {
        projectService.assertUserCanAccessTask(userId, taskId);

        Task task = requireTask(taskId);
        List<TaskCoAssignee> coAssignees = loadCoAssignees(taskId);
        Project project = loadProject(task.getProjectId());

        boolean isProjectManager = project != null && project.getManagerId() != null
                && project.getManagerId().equals(userId);
        if (!isMainAssignee(task, userId) && !isCoAssignee(coAssignees, userId) && !isProjectManager) {
            throw new BusinessException("无权限：仅任务负责人或项目负责人可重新打开任务", 403);
        }
        if (!"COMPLETED".equals(task.getStatus())) {
            throw new BusinessException("当前状态（" + task.getStatus() + "）无法重新打开");
        }

        LocalDateTime reopenedAt = LocalDateTime.now();
        taskMapper.update(null, new LambdaUpdateWrapper<Task>()
                .eq(Task::getId, taskId)
                .set(Task::getStatus, "IN_PROGRESS")
                .set(Task::getAcceptedAt, null)
                .setSql("version = version + 1"));

        appendTaskTimeline(taskId, "STATUS_CHANGED", "重新打开任务", null, userId, "COMPLETED", "IN_PROGRESS");

        try {
            settlementService.createReversalSettlement(taskId, reopenedAt);
        } catch (Exception e) {
            log.error("[perf] create reversal failed taskId={}: {}", taskId, e.getMessage());
        }

        notifyTaskStakeholders(task, coAssignees, userId, "任务已重新打开",
                "任务「" + safeTitle(task) + "」已重新打开。", "reopened");

        return toTaskMap(taskMapper.selectById(taskId));
    }

    private void appendTaskTimeline(Integer taskId, String eventType, String title, String content,
            Integer operatorId, String fromStatus, String toStatus) {
        TaskTimeline row = new TaskTimeline();
        row.setTaskId(taskId);
        row.setEventType(eventType);
        row.setTitle(title);
        row.setContent(content);
        row.setOperatorId(operatorId);
        row.setFromStatus(fromStatus);
        row.setToStatus(toStatus);
        taskTimelineMapper.insert(row);
    }

    private Task requireTask(Integer taskId) {
        Task task = taskMapper.selectById(taskId);
        if (task == null) {
            throw new BusinessException("任务不存在", 404);
        }
        return task;
    }

    private List<TaskCoAssignee> loadCoAssignees(Integer taskId) {
        return taskCoAssigneeMapper.selectList(new LambdaQueryWrapper<TaskCoAssignee>()
                .eq(TaskCoAssignee::getTaskId, taskId));
    }

    private Project loadProject(Integer projectId) {
        if (projectId == null) {
            return null;
        }
        return projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                .eq(Project::getId, projectId)
                .select(Project::getId, Project::getName, Project::getManagerId));
    }

    private boolean isMainAssignee(Task task, Integer userId) {
        return task.getMainAssigneeId() != null && task.getMainAssigneeId().equals(userId);
    }

    private boolean isCoAssignee(List<TaskCoAssignee> coAssignees, Integer userId) {
        for (TaskCoAssignee ca : coAssignees) {
            if (ca.getUserId().equals(userId)) {
                return true;
            }
        }
        return false;
    }

    private Set<Integer> collectStakeholderIds(Task task, List<TaskCoAssignee> coAssignees) {
        Set<Integer> ids = new HashSet<Integer>();
        if (task.getMainAssigneeId() != null) {
            ids.add(task.getMainAssigneeId());
        }
        if (task.getTesterId() != null) {
            ids.add(task.getTesterId());
        }
        for (TaskCoAssignee ca : coAssignees) {
            ids.add(ca.getUserId());
        }
        return ids;
    }

    private void notifyTaskStakeholders(Task task, List<TaskCoAssignee> coAssignees, Integer operatorId,
            String title, String content, String action) {
        Set<Integer> receiverIds = collectStakeholderIds(task, coAssignees);
        receiverIds.remove(operatorId);
        Project project = loadProject(task.getProjectId());
        notifyReceivers(receiverIds, operatorId, task, project, title, content, action);
    }

    private void notifyReceivers(Set<Integer> receiverIds, Integer senderId, Task task, Project project,
            String title, String content, String action) {
        try {
            for (Integer receiverId : receiverIds) {
                SendMessageRequest msg = new SendMessageRequest();
                msg.setReceiverId(receiverId);
                msg.setMessageType("TASK");
                msg.setTitle(title);
                msg.setContent(content);
                Map<String, Object> extra = new HashMap<String, Object>();
                extra.put("biz", "task");
                extra.put("action", action);
                extra.put("taskId", task.getId());
                extra.put("projectId", task.getProjectId());
                msg.setExtra(extra);
                messageService.sendRealTimeMessage(msg, senderId);
            }
        } catch (Exception ignored) {
            // 消息推送失败不影响主流程
        }
    }

    private void addMentionedUsers(Set<Integer> receiverIds, String content) {
        if (!StringUtils.hasText(content)) {
            return;
        }
        Set<String> tokens = new HashSet<String>();
        Matcher matcher = MENTION_PATTERN.matcher(content);
        while (matcher.find()) {
            String token = matcher.group(1);
            if (StringUtils.hasText(token)) {
                tokens.add(token);
            }
        }
        if (tokens.isEmpty()) {
            return;
        }
        List<User> mentioned = userMapper.selectList(new LambdaQueryWrapper<User>()
                .and(w -> w.in(User::getUserName, tokens).or().in(User::getNickName, tokens))
                .select(User::getId));
        for (User u : mentioned) {
            receiverIds.add(u.getId());
        }
    }

    private Map<String, Object> loadWorkLogVo(Integer workLogId) {
        WorkLog workLog = workLogMapper.selectById(workLogId);
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", workLog.getId());
        map.put("taskId", workLog.getTaskId());
        map.put("userId", workLog.getUserId());
        map.put("hours", workLog.getHours());
        map.put("content", workLog.getContent());
        map.put("createdAt", workLog.getCreateTime());

        User user = userMapper.selectById(workLog.getUserId());
        if (user != null) {
            map.put("user", toUserBrief(user));
        }

        List<WorkLogAttachment> links = workLogAttachmentMapper.selectList(
                new LambdaQueryWrapper<WorkLogAttachment>()
                        .eq(WorkLogAttachment::getWorkLogId, workLogId)
                        .orderByAsc(WorkLogAttachment::getSort));
        List<Map<String, Object>> attachments = new ArrayList<Map<String, Object>>();
        for (WorkLogAttachment link : links) {
            Attachment att = attachmentService.requireAttachment(link.getAttachmentId());
            Map<String, Object> item = new HashMap<String, Object>();
            item.put("sort", link.getSort());
            item.put("attachment", attachmentService.toAttachmentPublic(att));
            attachments.add(item);
        }
        map.put("attachments", attachments);
        return map;
    }

    private Map<String, Object> loadCommentVo(Integer commentId) {
        TaskComment comment = taskCommentMapper.selectById(commentId);
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", comment.getId());
        map.put("taskId", comment.getTaskId());
        map.put("userId", comment.getUserId());
        map.put("content", comment.getContent());
        map.put("createdAt", comment.getCreateTime());
        map.put("updatedAt", comment.getUpdateTime());

        User user = userMapper.selectById(comment.getUserId());
        if (user != null) {
            map.put("user", toUserBrief(user));
        }

        List<TaskCommentAttachment> links = taskCommentAttachmentMapper.selectList(
                new LambdaQueryWrapper<TaskCommentAttachment>()
                        .eq(TaskCommentAttachment::getCommentId, commentId)
                        .orderByAsc(TaskCommentAttachment::getSort));
        List<Map<String, Object>> attachments = new ArrayList<Map<String, Object>>();
        for (TaskCommentAttachment link : links) {
            try {
                Attachment att = attachmentService.requireAttachment(link.getAttachmentId());
                Map<String, Object> item = new HashMap<String, Object>();
                item.put("sort", link.getSort());
                item.put("attachment", attachmentService.toAttachmentPublic(att));
                attachments.add(item);
            } catch (BusinessException ignored) {
                // 已删除附件跳过
            }
        }
        map.put("attachments", attachments);
        return map;
    }

    private Map<String, Object> toUserBrief(User user) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", user.getId());
        map.put("userName", user.getUserName());
        map.put("nickName", user.getNickName());
        map.put("avatar", user.getAvatar());
        map.put("userEmail", user.getUserEmail());
        return map;
    }

    private Map<String, Object> toTaskMap(Task task) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", task.getId());
        map.put("projectId", task.getProjectId());
        map.put("orgId", task.getOrgId());
        map.put("version", task.getVersion());
        map.put("parentId", task.getParentId());
        map.put("type", task.getType());
        map.put("workDomain", task.getWorkDomain());
        map.put("priority", task.getPriority());
        map.put("dueDate", task.getDueDate());
        map.put("title", task.getTitle());
        map.put("description", task.getDescription());
        map.put("status", task.getStatus());
        map.put("managerId", task.getManagerId());
        map.put("mainAssigneeId", task.getMainAssigneeId());
        map.put("testerId", task.getTesterId());
        map.put("estimatedHours", task.getEstimatedHours());
        map.put("actualHours", task.getActualHours());
        map.put("suggestedBaseScore", task.getSuggestedBaseScore());
        map.put("baseScore", task.getBaseScore());
        map.put("baseScoreSource", task.getBaseScoreSource());
        map.put("complexityTier", task.getComplexityTier());
        map.put("complexity", task.getComplexity());
        map.put("qaRejectReason", task.getQaRejectReason());
        map.put("createTime", task.getCreateTime());
        map.put("updateTime", task.getUpdateTime());
        map.put("acceptedAt", task.getAcceptedAt());
        return map;
    }

    private String safeTitle(Task task) {
        return task.getTitle() != null ? task.getTitle() : "";
    }

    private String safeProjectName(Project project) {
        return project != null && project.getName() != null ? project.getName() : "";
    }

    private String truncate(String text, int maxLen) {
        if (text == null) {
            return "";
        }
        if (text.length() <= maxLen) {
            return text;
        }
        return text.substring(0, maxLen);
    }

    private Map<String, Object> toTaskPageItem(Task task) {
        Map<String, Object> map = toTaskMap(task);

        if (task.getProjectId() != null) {
            Project project = projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                    .eq(Project::getId, task.getProjectId())
                    .isNull(Project::getDeletedAt)
                    .select(Project::getId, Project::getName, Project::getManagerId));
            if (project != null) {
                Map<String, Object> projectBrief = new HashMap<String, Object>();
                projectBrief.put("id", project.getId());
                projectBrief.put("name", project.getName());
                projectBrief.put("managerId", project.getManagerId());
                map.put("project", projectBrief);
            }
        }

        if (task.getManagerId() != null) {
            User manager = userMapper.selectById(task.getManagerId());
            if (manager != null) {
                map.put("manager", toUserBrief(manager));
            }
        }
        if (task.getMainAssigneeId() != null) {
            User mainAssignee = userMapper.selectById(task.getMainAssigneeId());
            if (mainAssignee != null) {
                map.put("mainAssignee", toUserBrief(mainAssignee));
            }
        }
        if (task.getTesterId() != null) {
            User tester = userMapper.selectById(task.getTesterId());
            if (tester != null) {
                map.put("tester", toUserBrief(tester));
            }
        }

        List<TaskCoAssignee> coRows = loadCoAssignees(task.getId());
        List<Map<String, Object>> coAssignees = new ArrayList<Map<String, Object>>();
        for (TaskCoAssignee co : coRows) {
            Map<String, Object> item = new HashMap<String, Object>();
            item.put("id", co.getId());
            item.put("taskId", co.getTaskId());
            item.put("userId", co.getUserId());
            item.put("createdAt", co.getCreateTime());
            User user = userMapper.selectById(co.getUserId());
            if (user != null) {
                item.put("user", toUserBrief(user));
            }
            coAssignees.add(item);
        }
        map.put("coAssignees", coAssignees);

        Map<String, Object> count = new HashMap<String, Object>();
        Long testCaseCount = taskQueryMapper.countTestCasesByTaskId(task.getId());
        Long workLogCount = taskQueryMapper.countWorkLogsByTaskId(task.getId());
        count.put("testCases", testCaseCount != null ? testCaseCount : 0L);
        count.put("workLogs", workLogCount != null ? workLogCount : 0L);
        map.put("_count", count);

        return map;
    }

    private Map<String, Object> loadTaskDetail(Integer taskId, Integer userId) {
        Task task = taskMapper.selectById(taskId);
        if (task == null) {
            return null;
        }

        Map<String, Object> map = toTaskMap(task);

        if (task.getProjectId() != null) {
            Project project = projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                    .eq(Project::getId, task.getProjectId())
                    .isNull(Project::getDeletedAt)
                    .select(Project::getId, Project::getName, Project::getManagerId));
            if (project != null) {
                Map<String, Object> projectMap = new HashMap<String, Object>();
                projectMap.put("id", project.getId());
                projectMap.put("name", project.getName());
                projectMap.put("managerId", project.getManagerId());
                projectMap.put("taskRule", projectService.taskRulesInfo(project.getId(), userId));
                map.put("project", projectMap);
            }
        }

        if (task.getManagerId() != null) {
            User manager = userMapper.selectById(task.getManagerId());
            if (manager != null) {
                map.put("manager", toUserBrief(manager));
            }
        }
        if (task.getMainAssigneeId() != null) {
            User mainAssignee = userMapper.selectById(task.getMainAssigneeId());
            if (mainAssignee != null) {
                map.put("mainAssignee", toUserBrief(mainAssignee));
            }
        }
        if (task.getTesterId() != null) {
            User tester = userMapper.selectById(task.getTesterId());
            if (tester != null) {
                map.put("tester", toUserBrief(tester));
            }
        }

        List<TaskCoAssignee> coRows = loadCoAssignees(taskId);
        List<Map<String, Object>> coAssignees = new ArrayList<Map<String, Object>>();
        for (TaskCoAssignee co : coRows) {
            Map<String, Object> item = new HashMap<String, Object>();
            item.put("id", co.getId());
            item.put("taskId", co.getTaskId());
            item.put("userId", co.getUserId());
            item.put("createdAt", co.getCreateTime());
            User user = userMapper.selectById(co.getUserId());
            if (user != null) {
                item.put("user", toUserBrief(user));
            }
            coAssignees.add(item);
        }
        map.put("coAssignees", coAssignees);

        List<TestCase> testCases = testCaseMapper.selectList(new LambdaQueryWrapper<TestCase>()
                .eq(TestCase::getTaskId, taskId)
                .orderByAsc(TestCase::getId));
        List<Map<String, Object>> testCaseList = new ArrayList<Map<String, Object>>();
        for (TestCase tc : testCases) {
            testCaseList.add(toTestCaseMap(tc));
        }
        map.put("testCases", testCaseList);

        map.put("workLogs", loadWorkLogsForTask(taskId));
        map.put("comments", loadCommentsForTask(taskId));
        map.put("timelines", loadTimelinesForTask(taskId));
        map.put("attachments", loadTaskAttachments(taskId));

        return map;
    }

    private Map<String, Object> loadTaskCreateResult(Integer taskId) {
        Task task = taskMapper.selectById(taskId);
        Map<String, Object> map = toTaskMap(task);

        if (task.getMainAssigneeId() != null) {
            User mainAssignee = userMapper.selectById(task.getMainAssigneeId());
            if (mainAssignee != null) {
                map.put("mainAssignee", toUserBrief(mainAssignee));
            }
        }

        List<TaskCoAssignee> coRows = loadCoAssignees(taskId);
        List<Map<String, Object>> coAssignees = new ArrayList<Map<String, Object>>();
        for (TaskCoAssignee co : coRows) {
            Map<String, Object> item = new HashMap<String, Object>();
            item.put("id", co.getId());
            item.put("taskId", co.getTaskId());
            item.put("userId", co.getUserId());
            User user = userMapper.selectById(co.getUserId());
            if (user != null) {
                item.put("user", toUserBrief(user));
            }
            coAssignees.add(item);
        }
        map.put("coAssignees", coAssignees);

        List<TestCase> testCases = testCaseMapper.selectList(new LambdaQueryWrapper<TestCase>()
                .eq(TestCase::getTaskId, taskId)
                .orderByAsc(TestCase::getId));
        List<Map<String, Object>> testCaseList = new ArrayList<Map<String, Object>>();
        for (TestCase tc : testCases) {
            testCaseList.add(toTestCaseMap(tc));
        }
        map.put("testCases", testCaseList);
        map.put("attachments", loadTaskAttachments(taskId));
        return map;
    }

    private Map<String, Object> loadTaskUpdateResult(Integer taskId) {
        Map<String, Object> map = toTaskMap(taskMapper.selectById(taskId));
        List<TestCase> testCases = testCaseMapper.selectList(new LambdaQueryWrapper<TestCase>()
                .eq(TestCase::getTaskId, taskId)
                .orderByAsc(TestCase::getId));
        List<Map<String, Object>> testCaseList = new ArrayList<Map<String, Object>>();
        for (TestCase tc : testCases) {
            testCaseList.add(toTestCaseMap(tc));
        }
        map.put("testCases", testCaseList);
        map.put("attachments", loadTaskAttachments(taskId));
        return map;
    }

    private List<Map<String, Object>> loadWorkLogsForTask(Integer taskId) {
        List<Map<String, Object>> rows = taskQueryMapper.selectWorkLogsByTaskId(taskId);
        if (rows.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> workLogIds = new ArrayList<Integer>();
        for (Map<String, Object> row : rows) {
            workLogIds.add(toInt(row.get("id")));
        }
        List<Map<String, Object>> attachmentRows = taskQueryMapper
                .selectWorkLogAttachmentsByWorkLogIds(workLogIds);
        Map<Integer, List<Map<String, Object>>> attachmentsByWorkLog = groupAttachmentsByParent(attachmentRows,
                "workLogId");

        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("id", row.get("id"));
            item.put("taskId", row.get("taskId"));
            item.put("userId", row.get("userId"));
            item.put("hours", row.get("hours"));
            item.put("content", row.get("content"));
            item.put("createdAt", row.get("createdAt"));
            Map<String, Object> user = mapUserFromPrefixedRow(row, "user_");
            if (user != null) {
                item.put("user", user);
            }
            item.put("attachments", attachmentsByWorkLog.getOrDefault(toInt(row.get("id")),
                    Collections.<Map<String, Object>>emptyList()));
            result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> loadCommentsForTask(Integer taskId) {
        List<Map<String, Object>> rows = taskQueryMapper.selectCommentsByTaskId(taskId);
        if (rows.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> commentIds = new ArrayList<Integer>();
        for (Map<String, Object> row : rows) {
            commentIds.add(toInt(row.get("id")));
        }
        List<Map<String, Object>> attachmentRows = taskQueryMapper
                .selectCommentAttachmentsByCommentIds(commentIds);
        Map<Integer, List<Map<String, Object>>> attachmentsByComment = groupAttachmentsByParent(attachmentRows,
                "commentId");

        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("id", row.get("id"));
            item.put("taskId", row.get("taskId"));
            item.put("userId", row.get("userId"));
            item.put("content", row.get("content"));
            item.put("createdAt", row.get("createdAt"));
            item.put("updatedAt", row.get("updatedAt"));
            Map<String, Object> user = mapUserFromPrefixedRow(row, "user_");
            if (user != null) {
                item.put("user", user);
            }
            item.put("attachments", attachmentsByComment.getOrDefault(toInt(row.get("id")),
                    Collections.<Map<String, Object>>emptyList()));
            result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> loadTimelinesForTask(Integer taskId) {
        List<Map<String, Object>> rows = taskQueryMapper.selectTimelinesByTaskId(taskId);
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("id", row.get("id"));
            item.put("taskId", row.get("taskId"));
            item.put("eventType", row.get("eventType"));
            item.put("title", row.get("title"));
            item.put("content", row.get("content"));
            item.put("fromStatus", row.get("fromStatus"));
            item.put("toStatus", row.get("toStatus"));
            item.put("operatorId", row.get("operatorId"));
            item.put("payload", row.get("payload"));
            item.put("createdAt", row.get("createdAt"));
            Map<String, Object> operator = mapUserFromPrefixedRow(row, "operator_");
            if (operator != null) {
                item.put("operator", operator);
            }
            result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> loadTaskAttachments(Integer taskId) {
        List<TaskAttachment> links = taskAttachmentMapper.selectList(new LambdaQueryWrapper<TaskAttachment>()
                .eq(TaskAttachment::getTaskId, taskId)
                .orderByAsc(TaskAttachment::getSort));
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (TaskAttachment link : links) {
            try {
                Attachment att = attachmentService.requireAttachment(link.getAttachmentId());
                Map<String, Object> item = new HashMap<String, Object>();
                item.put("id", link.getId());
                item.put("taskId", link.getTaskId());
                item.put("attachmentId", link.getAttachmentId());
                item.put("sort", link.getSort());
                item.put("createdAt", link.getCreateTime());
                item.put("attachment", attachmentService.toAttachmentPublic(att));
                result.add(item);
            } catch (BusinessException ignored) {
                // 已删除附件跳过
            }
        }
        return result;
    }

    private Map<Integer, List<Map<String, Object>>> groupAttachmentsByParent(List<Map<String, Object>> rows,
            String parentKey) {
        Map<Integer, List<Map<String, Object>>> grouped = new HashMap<Integer, List<Map<String, Object>>>();
        for (Map<String, Object> row : rows) {
            Integer parentId = toInt(row.get(parentKey));
            Map<String, Object> item = new HashMap<String, Object>();
            item.put("id", row.get("id"));
            item.put("sort", row.get("sort"));
            item.put("createdAt", row.get("createdAt"));
            item.put(parentKey, parentId);
            item.put("attachmentId", row.get("attachmentId"));
            Map<String, Object> attachment = new HashMap<String, Object>();
            attachment.put("id", row.get("att_id"));
            attachment.put("originalName", row.get("att_originalName"));
            attachment.put("mimeType", row.get("att_mimeType"));
            attachment.put("size", row.get("att_size"));
            attachment.put("createTime", row.get("att_createTime"));
            item.put("attachment", attachment);
            if (!grouped.containsKey(parentId)) {
                grouped.put(parentId, new ArrayList<Map<String, Object>>());
            }
            grouped.get(parentId).add(item);
        }
        return grouped;
    }

    private Map<String, Object> mapUserFromPrefixedRow(Map<String, Object> row, String prefix) {
        Object id = row.get(prefix + "id");
        if (id == null) {
            return null;
        }
        Map<String, Object> user = new HashMap<String, Object>();
        user.put("id", id);
        user.put("userName", row.get(prefix + "userName"));
        user.put("nickName", row.get(prefix + "nickName"));
        user.put("avatar", row.get(prefix + "avatar"));
        user.put("userEmail", row.get(prefix + "userEmail"));
        return user;
    }

    private Map<String, Object> toTestCaseMap(TestCase tc) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", tc.getId());
        map.put("taskId", tc.getTaskId());
        map.put("description", tc.getDescription());
        map.put("expectedResult", tc.getExpectedResult());
        map.put("selfTestStatus", tc.getSelfTestStatus());
        map.put("selfTestRemark", tc.getSelfTestRemark());
        map.put("qaStatus", tc.getQaStatus());
        map.put("qaRemark", tc.getQaRemark());
        map.put("bugCount", tc.getBugCount());
        map.put("createdAt", tc.getCreateTime());
        map.put("updatedAt", tc.getUpdateTime());
        return map;
    }

    private void syncTestCases(Integer taskId, String workDomain, List<Map<String, Object>> testCases) {
        if (!TaskComplexityTier.taskSupportsTestCases(workDomain)) {
            testCaseMapper.delete(new LambdaQueryWrapper<TestCase>().eq(TestCase::getTaskId, taskId));
            return;
        }

        List<Map<String, Object>> normalized = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> tc : testCases) {
            String desc = asString(tc.get("description"));
            String expected = asString(tc.get("expectedResult"));
            if (desc != null) {
                desc = desc.trim();
            }
            if (expected != null) {
                expected = expected.trim();
            }
            if (!StringUtils.hasText(desc) || !StringUtils.hasText(expected)) {
                throw new BusinessException("测试用例描述与预期结果不能为空");
            }
            Map<String, Object> item = new HashMap<String, Object>();
            item.put("id", toInt(tc.get("id")));
            item.put("description", desc);
            item.put("expectedResult", expected);
            normalized.add(item);
        }

        if (normalized.isEmpty()) {
            testCaseMapper.delete(new LambdaQueryWrapper<TestCase>().eq(TestCase::getTaskId, taskId));
            return;
        }

        Set<Integer> keptIds = new HashSet<Integer>();
        for (Map<String, Object> tc : normalized) {
            Integer tcId = toInt(tc.get("id"));
            if (tcId != null) {
                keptIds.add(tcId);
            }
        }

        if (keptIds.isEmpty()) {
            testCaseMapper.delete(new LambdaQueryWrapper<TestCase>().eq(TestCase::getTaskId, taskId));
        } else {
            testCaseMapper.delete(new LambdaQueryWrapper<TestCase>()
                    .eq(TestCase::getTaskId, taskId)
                    .notIn(TestCase::getId, keptIds));
        }

        for (Map<String, Object> tc : normalized) {
            Integer tcId = toInt(tc.get("id"));
            if (tcId != null) {
                TestCase existing = testCaseMapper.selectOne(new LambdaQueryWrapper<TestCase>()
                        .eq(TestCase::getId, tcId)
                        .eq(TestCase::getTaskId, taskId));
                if (existing == null) {
                    throw new BusinessException("测试用例不存在或不属于该任务");
                }
                TestCase update = new TestCase();
                update.setId(tcId);
                update.setDescription(asString(tc.get("description")));
                update.setExpectedResult(asString(tc.get("expectedResult")));
                testCaseMapper.updateById(update);
            } else {
                TestCase created = new TestCase();
                created.setTaskId(taskId);
                created.setDescription(asString(tc.get("description")));
                created.setExpectedResult(asString(tc.get("expectedResult")));
                testCaseMapper.insert(created);
            }
        }
    }

    private void notifyTaskCreated(Task task, List<Integer> coAssigneeIds, Integer userId, String projectName) {
        try {
            Set<Integer> receiverIds = new HashSet<Integer>();
            if (task.getMainAssigneeId() != null) {
                receiverIds.add(task.getMainAssigneeId());
            }
            if (task.getTesterId() != null) {
                receiverIds.add(task.getTesterId());
            }
            for (Integer coId : coAssigneeIds) {
                if (coId != null) {
                    receiverIds.add(coId);
                }
            }
            receiverIds.remove(userId);

            for (Integer receiverId : receiverIds) {
                SendMessageRequest msg = new SendMessageRequest();
                msg.setReceiverId(receiverId);
                msg.setMessageType("TASK");
                msg.setTitle("你有一个新任务");
                msg.setContent("任务「" + safeTitle(task) + "」已创建并分配给你（项目：" + projectName + "）。");
                Map<String, Object> extra = new HashMap<String, Object>();
                extra.put("biz", "task");
                extra.put("action", "created");
                extra.put("taskId", task.getId());
                extra.put("projectId", task.getProjectId());
                msg.setExtra(extra);
                messageService.sendRealTimeMessage(msg, userId);
            }
        } catch (Exception ignored) {
            // 消息推送失败不影响主流程
        }
    }

    private void notifyTaskAssigneeUpdated(Integer taskId, Integer userId) {
        try {
            Task latest = taskMapper.selectById(taskId);
            if (latest == null) {
                return;
            }
            Project project = loadProject(latest.getProjectId());
            List<TaskCoAssignee> coAssignees = loadCoAssignees(taskId);

            Set<Integer> receiverIds = collectStakeholderIds(latest, coAssignees);
            receiverIds.remove(userId);

            for (Integer receiverId : receiverIds) {
                SendMessageRequest msg = new SendMessageRequest();
                msg.setReceiverId(receiverId);
                msg.setMessageType("TASK");
                msg.setTitle("任务指派已更新");
                String content = safeProjectName(project).length() > 0
                        ? "任务「" + safeTitle(latest) + "」的执行信息已更新（项目：" + safeProjectName(project) + "）。"
                        : "任务「" + safeTitle(latest) + "」的执行信息已更新。";
                msg.setContent(content);
                Map<String, Object> extra = new HashMap<String, Object>();
                extra.put("biz", "task");
                extra.put("action", "assigneeUpdated");
                extra.put("taskId", latest.getId());
                extra.put("projectId", latest.getProjectId());
                msg.setExtra(extra);
                messageService.sendRealTimeMessage(msg, userId);
            }
        } catch (Exception ignored) {
            // 消息推送失败不影响主流程
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String asStringOrDefault(Object value, String defaultValue) {
        String text = asString(value);
        return StringUtils.hasText(text) ? text : defaultValue;
    }

    private Integer toInt(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        String text = String.valueOf(value).trim();
        if (!StringUtils.hasText(text) || "null".equalsIgnoreCase(text)) {
            return null;
        }
        return Integer.valueOf(text);
    }

    private Double toDouble(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        String text = String.valueOf(value).trim();
        if (!StringUtils.hasText(text) || "null".equalsIgnoreCase(text)) {
            return null;
        }
        return Double.valueOf(text);
    }

    private LocalDateTime parseDateTime(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        if (!StringUtils.hasText(text) || "null".equalsIgnoreCase(text)) {
            return null;
        }
        try {
            return OffsetDateTime.parse(text).toLocalDateTime();
        } catch (DateTimeParseException ex) {
            return LocalDateTime.parse(text);
        }
    }

    @SuppressWarnings("unchecked")
    private List<Integer> toIntList(Object value) {
        if (value == null) {
            return Collections.emptyList();
        }
        if (!(value instanceof List)) {
            return Collections.emptyList();
        }
        List<?> list = (List<?>) value;
        List<Integer> result = new ArrayList<Integer>();
        for (Object item : list) {
            Integer parsed = toInt(item);
            if (parsed != null) {
                result.add(parsed);
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> toMapList(Object value) {
        if (value == null) {
            return Collections.emptyList();
        }
        if (!(value instanceof List)) {
            return Collections.emptyList();
        }
        List<?> list = (List<?>) value;
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (Object item : list) {
            if (item instanceof Map) {
                result.add((Map<String, Object>) item);
            }
        }
        return result;
    }
}
