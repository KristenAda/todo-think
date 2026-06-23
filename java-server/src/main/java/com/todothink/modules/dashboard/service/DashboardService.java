package com.todothink.modules.dashboard.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.todothink.modules.dashboard.mapper.DashboardQueryMapper;
import com.todothink.modules.system.entity.User;
import com.todothink.modules.system.mapper.UserMapper;
import com.todothink.modules.task.entity.Project;
import com.todothink.modules.task.entity.Task;
import com.todothink.modules.task.entity.TaskCoAssignee;
import com.todothink.modules.task.mapper.ProjectMapper;
import com.todothink.modules.task.mapper.TaskCoAssigneeMapper;
import com.todothink.modules.task.mapper.TaskMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private static final List<String> PENDING_STATUSES = Arrays.asList(
            "PENDING", "IN_PROGRESS", "SELF_TESTING", "REJECTED");

    private static final List<String> OVERDUE_STATUSES = Arrays.asList(
            "PENDING", "IN_PROGRESS", "SELF_TESTING", "QA_REVIEW", "REJECTED", "PAUSED");

    private final TaskMapper taskMapper;
    private final TaskCoAssigneeMapper taskCoAssigneeMapper;
    private final ProjectMapper projectMapper;
    private final UserMapper userMapper;
    private final DashboardQueryMapper dashboardQueryMapper;

    public DashboardService(TaskMapper taskMapper, TaskCoAssigneeMapper taskCoAssigneeMapper,
            ProjectMapper projectMapper, UserMapper userMapper, DashboardQueryMapper dashboardQueryMapper) {
        this.taskMapper = taskMapper;
        this.taskCoAssigneeMapper = taskCoAssigneeMapper;
        this.projectMapper = projectMapper;
        this.userMapper = userMapper;
        this.dashboardQueryMapper = dashboardQueryMapper;
    }

    public Map<String, Object> workbench(Integer userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime monthEnd = monthStart.plusMonths(1).minusNanos(1);

        List<Integer> coAssigneeTaskIds = loadCoAssigneeTaskIds(userId);

        long pendingCount = taskMapper.selectCount(buildUserTaskWrapper(userId, coAssigneeTaskIds)
                .in(Task::getStatus, PENDING_STATUSES));

        long qaCount = taskMapper.selectCount(new LambdaQueryWrapper<Task>()
                .eq(Task::getTesterId, userId)
                .eq(Task::getStatus, "QA_REVIEW"));

        long completedCount = taskMapper.selectCount(buildCompletedWrapper(userId, coAssigneeTaskIds, monthStart, monthEnd));

        Long bugSum = dashboardQueryMapper.sumBugCount(userId, coAssigneeTaskIds);
        long bugCount = bugSum != null ? bugSum : 0L;

        List<Map<String, Object>> pendingTasks = toWorkbenchTaskList(taskMapper.selectList(
                buildUserTaskWrapper(userId, coAssigneeTaskIds)
                        .in(Task::getStatus, PENDING_STATUSES)
                        .orderByDesc(Task::getUpdateTime)
                        .last("LIMIT 10")));

        List<Map<String, Object>> qaTasks = toWorkbenchTaskList(taskMapper.selectList(
                new LambdaQueryWrapper<Task>()
                        .eq(Task::getTesterId, userId)
                        .eq(Task::getStatus, "QA_REVIEW")
                        .orderByDesc(Task::getUpdateTime)
                        .last("LIMIT 10")));

        List<Map<String, Object>> overdueTasks = toWorkbenchTaskList(taskMapper.selectList(
                buildUserTaskWrapper(userId, coAssigneeTaskIds)
                        .lt(Task::getDueDate, now)
                        .in(Task::getStatus, OVERDUE_STATUSES)
                        .orderByAsc(Task::getDueDate)
                        .orderByDesc(Task::getUpdateTime)
                        .last("LIMIT 10")));

        List<Map<String, Object>> processedTasks = toWorkbenchTaskList(taskMapper.selectList(
                buildProcessedListWrapper(userId, coAssigneeTaskIds)
                        .orderByDesc(Task::getUpdateTime)
                        .last("LIMIT 10")));

        Map<String, Object> stats = new HashMap<String, Object>();
        stats.put("pendingCount", pendingCount);
        stats.put("qaCount", qaCount);
        stats.put("completedCount", completedCount);
        stats.put("bugCount", bugCount);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("stats", stats);
        result.put("pendingTasks", pendingTasks);
        result.put("qaTasks", qaTasks);
        result.put("overdueTasks", overdueTasks);
        result.put("processedTasks", processedTasks);
        return result;
    }

    private List<Integer> loadCoAssigneeTaskIds(Integer userId) {
        List<TaskCoAssignee> rows = taskCoAssigneeMapper.selectList(new LambdaQueryWrapper<TaskCoAssignee>()
                .eq(TaskCoAssignee::getUserId, userId)
                .select(TaskCoAssignee::getTaskId));
        if (rows.isEmpty()) {
            return Collections.emptyList();
        }
        return rows.stream().map(TaskCoAssignee::getTaskId).collect(Collectors.toList());
    }

    private LambdaQueryWrapper<Task> buildUserTaskWrapper(Integer userId, List<Integer> coAssigneeTaskIds) {
        return new LambdaQueryWrapper<Task>().and(wrapper -> {
            wrapper.eq(Task::getMainAssigneeId, userId)
                    .or().eq(Task::getManagerId, userId);
            if (!coAssigneeTaskIds.isEmpty()) {
                wrapper.or().in(Task::getId, coAssigneeTaskIds);
            }
        });
    }

    private LambdaQueryWrapper<Task> buildCompletedWrapper(Integer userId, List<Integer> coAssigneeTaskIds,
            LocalDateTime monthStart, LocalDateTime monthEnd) {
        return new LambdaQueryWrapper<Task>()
                .eq(Task::getStatus, "COMPLETED")
                .ge(Task::getUpdateTime, monthStart)
                .le(Task::getUpdateTime, monthEnd)
                .and(wrapper -> {
                    wrapper.eq(Task::getMainAssigneeId, userId)
                            .or().eq(Task::getTesterId, userId);
                    if (!coAssigneeTaskIds.isEmpty()) {
                        wrapper.or().in(Task::getId, coAssigneeTaskIds);
                    }
                });
    }

    private LambdaQueryWrapper<Task> buildProcessedListWrapper(Integer userId, List<Integer> coAssigneeTaskIds) {
        return new LambdaQueryWrapper<Task>()
                .eq(Task::getStatus, "COMPLETED")
                .and(wrapper -> {
                    wrapper.eq(Task::getMainAssigneeId, userId)
                            .or().eq(Task::getTesterId, userId);
                    if (!coAssigneeTaskIds.isEmpty()) {
                        wrapper.or().in(Task::getId, coAssigneeTaskIds);
                    }
                });
    }

    private List<Map<String, Object>> toWorkbenchTaskList(List<Task> tasks) {
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (Task task : tasks) {
            Map<String, Object> map = toTaskMap(task);
            map.put("project", loadProjectBrief(task.getProjectId()));
            map.put("mainAssignee", loadUserBrief(task.getMainAssigneeId()));
            result.add(map);
        }
        return result;
    }

    private Map<String, Object> loadProjectBrief(Integer projectId) {
        if (projectId == null) {
            return null;
        }
        Project project = projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                .eq(Project::getId, projectId)
                .select(Project::getId, Project::getName));
        if (project == null) {
            return null;
        }
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", project.getId());
        map.put("name", project.getName());
        return map;
    }

    private Map<String, Object> loadUserBrief(Integer userId) {
        if (userId == null) {
            return null;
        }
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getId, userId)
                .select(User::getId, User::getUserName, User::getNickName, User::getAvatar));
        if (user == null) {
            return null;
        }
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", user.getId());
        map.put("userName", user.getUserName());
        map.put("nickName", user.getNickName());
        map.put("avatar", user.getAvatar());
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
        map.put("createdAt", task.getCreateTime());
        map.put("updatedAt", task.getUpdateTime());
        map.put("acceptedAt", task.getAcceptedAt());
        return map;
    }
}
