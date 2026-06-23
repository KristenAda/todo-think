package com.todothink.modules.task.job;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.modules.message.dto.SendMessageRequest;
import com.todothink.modules.message.service.MessageService;
import com.todothink.modules.task.entity.Project;
import com.todothink.modules.task.entity.Task;
import com.todothink.modules.task.entity.TaskCoAssignee;
import com.todothink.modules.task.entity.TaskTimeline;
import com.todothink.modules.task.mapper.ProjectMapper;
import com.todothink.modules.task.mapper.TaskCoAssigneeMapper;
import com.todothink.modules.task.mapper.TaskMapper;
import com.todothink.modules.task.mapper.TaskTimelineMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 逾期任务提醒定时任务（对齐 Node overdueReminder.job.ts）。
 */
@Component
public class OverdueReminderJob {

    private static final Logger log = LoggerFactory.getLogger(OverdueReminderJob.class);

    private static final String REMINDER_EVENT_TYPE = "OVERDUE_REMINDER";
    private static final String REMINDER_TITLE = "任务已逾期";

    private static final List<String> ACTIVE_STATUSES = Arrays.asList(
            "PENDING", "IN_PROGRESS", "SELF_TESTING", "QA_REVIEW", "REJECTED", "PAUSED");

    private static final DateTimeFormatter DUE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final TaskMapper taskMapper;
    private final TaskTimelineMapper taskTimelineMapper;
    private final TaskCoAssigneeMapper taskCoAssigneeMapper;
    private final ProjectMapper projectMapper;
    private final MessageService messageService;
    private final ObjectMapper objectMapper;

    public OverdueReminderJob(TaskMapper taskMapper, TaskTimelineMapper taskTimelineMapper,
            TaskCoAssigneeMapper taskCoAssigneeMapper, ProjectMapper projectMapper,
            MessageService messageService, ObjectMapper objectMapper) {
        this.taskMapper = taskMapper;
        this.taskTimelineMapper = taskTimelineMapper;
        this.taskCoAssigneeMapper = taskCoAssigneeMapper;
        this.projectMapper = projectMapper;
        this.messageService = messageService;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelay = 30 * 60 * 1000L, initialDelay = 60 * 1000L)
    public void run() {
        try {
            runOnce();
        } catch (Exception e) {
            log.error("[overdue] reminder job failed: {}", e.getMessage(), e);
        }
    }

    private void runOnce() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime scanCutoff = now.minusDays(14);
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();

        List<Task> tasks = taskMapper.selectList(new LambdaQueryWrapper<Task>()
                .isNotNull(Task::getDueDate)
                .lt(Task::getDueDate, now)
                .ge(Task::getDueDate, scanCutoff)
                .in(Task::getStatus, ACTIVE_STATUSES));

        if (tasks.isEmpty()) {
            return;
        }

        List<Integer> taskIds = tasks.stream().map(Task::getId).collect(Collectors.toList());

        List<TaskTimeline> reminded = taskTimelineMapper.selectList(new LambdaQueryWrapper<TaskTimeline>()
                .in(TaskTimeline::getTaskId, taskIds)
                .eq(TaskTimeline::getEventType, REMINDER_EVENT_TYPE)
                .ge(TaskTimeline::getCreateTime, todayStart)
                .select(TaskTimeline::getTaskId));

        Set<Integer> remindedSet = new HashSet<Integer>();
        for (TaskTimeline row : reminded) {
            remindedSet.add(row.getTaskId());
        }

        for (Task task : tasks) {
            if (remindedSet.contains(task.getId())) {
                continue;
            }

            LocalDateTime due = task.getDueDate();
            String dueText = due != null ? DUE_FORMAT.format(due) : "未知截止时间";
            String projectName = loadProjectName(task.getProjectId());

            TaskTimeline timeline = new TaskTimeline();
            timeline.setTaskId(task.getId());
            timeline.setEventType(REMINDER_EVENT_TYPE);
            timeline.setTitle(REMINDER_TITLE);
            timeline.setContent("截止时间：" + dueText + "（项目：" + (projectName.length() > 0 ? projectName : "未命名") + "）");
            timeline.setOperatorId(null);
            timeline.setFromStatus(null);
            timeline.setToStatus(null);
            try {
                Map<String, Object> payload = new HashMap<String, Object>();
                payload.put("dueDate", due);
                timeline.setPayload(objectMapper.writeValueAsString(payload));
            } catch (Exception e) {
                timeline.setPayload(null);
            }
            taskTimelineMapper.insert(timeline);

            Set<Integer> receiverIds = new HashSet<Integer>();
            if (task.getMainAssigneeId() != null) {
                receiverIds.add(task.getMainAssigneeId());
            }
            if (task.getTesterId() != null) {
                receiverIds.add(task.getTesterId());
            }
            List<TaskCoAssignee> coRows = taskCoAssigneeMapper.selectList(new LambdaQueryWrapper<TaskCoAssignee>()
                    .eq(TaskCoAssignee::getTaskId, task.getId())
                    .select(TaskCoAssignee::getUserId));
            for (TaskCoAssignee ca : coRows) {
                if (ca.getUserId() != null) {
                    receiverIds.add(ca.getUserId());
                }
            }
            if (receiverIds.isEmpty()) {
                continue;
            }

            String content = projectName.length() > 0
                    ? "任务「" + task.getTitle() + "」已逾期，截止时间：" + dueText + "（项目：" + projectName + "）。请尽快处理。"
                    : "任务「" + task.getTitle() + "」已逾期，截止时间：" + dueText + "。请尽快处理。";

            for (Integer receiverId : receiverIds) {
                try {
                    SendMessageRequest msg = new SendMessageRequest();
                    msg.setReceiverId(receiverId);
                    msg.setMessageType("TASK");
                    msg.setTitle(REMINDER_TITLE);
                    msg.setContent(content);
                    Map<String, Object> extra = new HashMap<String, Object>();
                    extra.put("biz", "task");
                    extra.put("action", "overdue");
                    extra.put("taskId", task.getId());
                    extra.put("projectId", task.getProjectId());
                    extra.put("dueDate", due);
                    msg.setExtra(extra);
                    messageService.sendRealTimeMessage(msg, null);
                } catch (Exception e) {
                    log.debug("[overdue] send message failed taskId={} receiverId={}", task.getId(), receiverId, e);
                }
            }
        }
    }

    private String loadProjectName(Integer projectId) {
        if (projectId == null) {
            return "";
        }
        Project project = projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                .eq(Project::getId, projectId)
                .select(Project::getName));
        return project != null && project.getName() != null ? project.getName() : "";
    }
}
