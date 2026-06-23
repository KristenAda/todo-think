package com.todothink.modules.task.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.todothink.core.exception.BusinessException;
import com.todothink.modules.message.dto.SendMessageRequest;
import com.todothink.modules.message.service.MessageService;
import com.todothink.modules.system.entity.Department;
import com.todothink.modules.system.entity.DeptMember;
import com.todothink.modules.system.entity.User;
import com.todothink.modules.system.mapper.DepartmentMapper;
import com.todothink.modules.system.mapper.DeptMemberMapper;
import com.todothink.modules.system.mapper.UserMapper;
import com.todothink.modules.task.entity.Project;
import com.todothink.modules.task.entity.ProjectTaskRule;
import com.todothink.modules.task.entity.Task;
import com.todothink.modules.task.mapper.ProjectMapper;
import com.todothink.modules.task.mapper.ProjectTaskRuleMapper;
import com.todothink.modules.task.mapper.ScoringRuleQueryMapper;
import com.todothink.modules.task.mapper.TaskMapper;
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
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ProjectService {

    private final ProjectMapper projectMapper;
    private final TaskMapper taskMapper;
    private final ProjectTaskRuleMapper projectTaskRuleMapper;
    private final ScoringRuleQueryMapper scoringRuleQueryMapper;
    private final DepartmentMapper departmentMapper;
    private final DeptMemberMapper deptMemberMapper;
    private final UserMapper userMapper;
    private final MessageService messageService;

    public ProjectService(ProjectMapper projectMapper, TaskMapper taskMapper,
            ProjectTaskRuleMapper projectTaskRuleMapper, ScoringRuleQueryMapper scoringRuleQueryMapper,
            DepartmentMapper departmentMapper, DeptMemberMapper deptMemberMapper, UserMapper userMapper,
            MessageService messageService) {
        this.projectMapper = projectMapper;
        this.taskMapper = taskMapper;
        this.projectTaskRuleMapper = projectTaskRuleMapper;
        this.scoringRuleQueryMapper = scoringRuleQueryMapper;
        this.departmentMapper = departmentMapper;
        this.deptMemberMapper = deptMemberMapper;
        this.userMapper = userMapper;
        this.messageService = messageService;
    }

    public Map<String, Object> page(int page, int pageSize, String name, String status, Integer userId) {
        List<Integer> orgIds = getOrgIdsForUser(userId);
        if (orgIds.isEmpty()) {
            Map<String, Object> empty = new HashMap<String, Object>();
            empty.put("list", Collections.emptyList());
            empty.put("total", 0L);
            return empty;
        }

        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<Project>()
                .isNull(Project::getDeletedAt)
                .in(Project::getOrgId, orgIds)
                .orderByDesc(Project::getId);
        if (StringUtils.hasText(name)) {
            wrapper.like(Project::getName, name);
        }
        if (StringUtils.hasText(status)) {
            wrapper.eq(Project::getStatus, status);
        }

        Page<Project> pageResult = projectMapper.selectPage(new Page<Project>(page, pageSize), wrapper);
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        for (Project project : pageResult.getRecords()) {
            list.add(toProjectDetail(project));
        }

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("list", list);
        result.put("total", pageResult.getTotal());
        return result;
    }

    public List<Map<String, Object>> list(Integer userId) {
        List<Integer> orgIds = getOrgIdsForUser(userId);
        if (orgIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Project> projects = projectMapper.selectList(new LambdaQueryWrapper<Project>()
                .eq(Project::getStatus, "ACTIVE")
                .isNull(Project::getDeletedAt)
                .in(Project::getOrgId, orgIds)
                .orderByDesc(Project::getId));

        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (Project project : projects) {
            Map<String, Object> item = new HashMap<String, Object>();
            item.put("id", project.getId());
            item.put("name", project.getName());
            item.put("status", project.getStatus());
            item.put("managerId", project.getManagerId());
            result.add(item);
        }
        return result;
    }

    public Map<String, Object> info(Integer id, Integer userId) {
        if (id == null || id <= 0) {
            return null;
        }
        List<Integer> orgIds = getOrgIdsForUser(userId);
        if (orgIds.isEmpty()) {
            return null;
        }

        Project project = projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                .eq(Project::getId, id)
                .isNull(Project::getDeletedAt)
                .in(Project::getOrgId, orgIds));
        if (project == null) {
            return null;
        }
        return toProjectDetail(project);
    }

    public List<Map<String, Object>> orgMembers(Integer currentUserId) {
        List<DeptMember> myMemberships = deptMemberMapper.selectList(new LambdaQueryWrapper<DeptMember>()
                .eq(DeptMember::getUserId, currentUserId));
        List<Integer> myDeptIds = new ArrayList<Integer>();
        for (DeptMember membership : myMemberships) {
            myDeptIds.add(membership.getDeptId());
        }

        if (myDeptIds.isEmpty()) {
            List<User> users = userMapper.selectList(new LambdaQueryWrapper<User>()
                    .isNull(User::getDeletedAt)
                    .orderByAsc(User::getId));
            return toOrgMemberList(users);
        }

        List<Department> allDepts = departmentMapper.selectList(new LambdaQueryWrapper<Department>()
                .isNull(Department::getDeletedAt)
                .select(Department::getId, Department::getAncestors));

        Set<String> myDeptIdSet = new HashSet<String>();
        for (Integer deptId : myDeptIds) {
            myDeptIdSet.add(String.valueOf(deptId));
        }

        Set<Integer> relatedDeptIds = new HashSet<Integer>(myDeptIds);
        for (Department dept : allDepts) {
            if (!StringUtils.hasText(dept.getAncestors())) {
                continue;
            }
            String[] ancestorIds = dept.getAncestors().split(",");
            boolean matched = false;
            for (String ancestorId : ancestorIds) {
                if (myDeptIdSet.contains(ancestorId.trim())) {
                    matched = true;
                    break;
                }
            }
            if (matched) {
                relatedDeptIds.add(dept.getId());
            }
        }

        List<DeptMember> memberRows = deptMemberMapper.selectList(new LambdaQueryWrapper<DeptMember>()
                .in(DeptMember::getDeptId, relatedDeptIds));
        Set<Integer> memberUserIds = new HashSet<Integer>();
        for (DeptMember row : memberRows) {
            memberUserIds.add(row.getUserId());
        }
        memberUserIds.add(currentUserId);

        List<User> users = userMapper.selectList(new LambdaQueryWrapper<User>()
                .in(User::getId, memberUserIds)
                .isNull(User::getDeletedAt)
                .orderByAsc(User::getId));
        return toOrgMemberList(users);
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> dto, Integer userId) {
        String name = asString(dto.get("name"));
        if (!StringUtils.hasText(name)) {
            throw new BusinessException("项目名称不能为空");
        }
        if (name.length() > 100) {
            throw new BusinessException("项目名称过长");
        }

        Integer managerId = toInt(dto.get("managerId"));
        if (managerId == null || managerId <= 0) {
            throw new BusinessException("负责人ID无效");
        }

        List<Integer> allowed = getOrgIdsForUser(userId);
        Integer orgId = toInt(dto.get("orgId"));
        if (orgId != null) {
            if (allowed.isEmpty() || !allowed.contains(orgId)) {
                throw new BusinessException("无权在该组织下创建项目", 403);
            }
        } else {
            orgId = getOrgIdByUserId(userId);
        }

        Project project = new Project();
        project.setName(name.trim());
        project.setDescription(asString(dto.get("description")));
        project.setManagerId(managerId);
        project.setOrgId(orgId);
        project.setStatus(asStringOrDefault(dto.get("status"), "ACTIVE"));
        project.setStartDate(parseDateTime(dto.get("startDate")));
        project.setEndDate(parseDateTime(dto.get("endDate")));
        project.setVersion(0);
        projectMapper.insert(project);

        try {
            if (managerId != null && !managerId.equals(userId)) {
                SendMessageRequest msg = new SendMessageRequest();
                msg.setReceiverId(managerId);
                msg.setMessageType("TASK");
                msg.setTitle("你被指定为项目负责人");
                msg.setContent("项目「" + project.getName() + "」已创建，你是负责人。");
                Map<String, Object> extra = new HashMap<String, Object>();
                extra.put("biz", "project");
                extra.put("action", "created");
                extra.put("projectId", project.getId());
                msg.setExtra(extra);
                messageService.sendRealTimeMessage(msg, userId);
            }
        } catch (Exception ignored) {
            // 消息推送失败不影响主流程
        }

        return toProjectMap(project);
    }

    @Transactional
    public Map<String, Object> update(Integer id, Map<String, Object> dto, Integer userId) {
        assertUserCanAccessProject(userId, id);

        Integer version = toInt(dto.get("version"));
        if (version == null || version < 0) {
            throw new BusinessException("更新时必须提供数据版本号以确保一致性");
        }

        Project before = projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                .eq(Project::getId, id)
                .isNull(Project::getDeletedAt)
                .select(Project::getId, Project::getName, Project::getManagerId));
        if (before == null) {
            throw new BusinessException("项目不存在", 404);
        }

        Integer orgId = dto.containsKey("orgId") ? toInt(dto.get("orgId")) : null;
        if (orgId != null) {
            List<Integer> allowed = getOrgIdsForUser(userId);
            if (!allowed.contains(orgId)) {
                throw new BusinessException("无权将项目归属到该组织", 403);
            }
        }

        LambdaUpdateWrapper<Project> wrapper = new LambdaUpdateWrapper<Project>()
                .eq(Project::getId, id)
                .eq(Project::getVersion, version)
                .setSql("version = version + 1");

        if (dto.containsKey("name")) {
            String name = asString(dto.get("name"));
            if (!StringUtils.hasText(name)) {
                throw new BusinessException("项目名称不能为空");
            }
            wrapper.set(Project::getName, name.trim());
        }
        if (dto.containsKey("description")) {
            wrapper.set(Project::getDescription, asString(dto.get("description")));
        }
        if (dto.containsKey("managerId")) {
            wrapper.set(Project::getManagerId, toInt(dto.get("managerId")));
        }
        if (dto.containsKey("status")) {
            wrapper.set(Project::getStatus, asString(dto.get("status")));
        }
        if (dto.containsKey("startDate")) {
            wrapper.set(Project::getStartDate, parseDateTime(dto.get("startDate")));
        }
        if (dto.containsKey("endDate")) {
            wrapper.set(Project::getEndDate, parseDateTime(dto.get("endDate")));
        }
        if (dto.containsKey("orgId")) {
            wrapper.set(Project::getOrgId, orgId);
        }

        int updated = projectMapper.update(null, wrapper);
        if (updated == 0) {
            throw new BusinessException("当前项目数据已被其他人修改，请刷新页面获取最新数据后重试", 409);
        }

        Project project = projectMapper.selectById(id);

        try {
            Integer nextManagerId = dto.containsKey("managerId") ? toInt(dto.get("managerId")) : null;
            Integer prevManagerId = before.getManagerId();
            if (nextManagerId != null && !nextManagerId.equals(prevManagerId) && !nextManagerId.equals(userId)) {
                SendMessageRequest msg = new SendMessageRequest();
                msg.setReceiverId(nextManagerId);
                msg.setMessageType("TASK");
                msg.setTitle("项目负责人变更");
                String projectName = before.getName();
                if (project != null && StringUtils.hasText(project.getName())) {
                    projectName = project.getName();
                }
                msg.setContent("你已成为项目「" + (projectName != null ? projectName : "") + "」的新负责人。");
                Map<String, Object> extra = new HashMap<String, Object>();
                extra.put("biz", "project");
                extra.put("action", "managerChanged");
                extra.put("projectId", id);
                msg.setExtra(extra);
                messageService.sendRealTimeMessage(msg, userId);
            }
        } catch (Exception ignored) {
            // 消息推送失败不影响主流程
        }

        return toProjectMap(project);
    }

    @Transactional
    public void delete(Integer id, Integer userId) {
        assertUserCanAccessProject(userId, id);
        projectMapper.deleteById(id);
    }

    public Map<String, Object> taskRulesInfo(Integer projectId, Integer userId) {
        assertUserCanAccessProject(userId, projectId);

        ProjectTaskRule record = projectTaskRuleMapper.selectOne(new LambdaQueryWrapper<ProjectTaskRule>()
                .eq(ProjectTaskRule::getProjectId, projectId));
        if (record == null) {
            return defaultTaskRules();
        }

        Map<String, Object> rules = new HashMap<String, Object>();
        rules.put("requireEstimateHours", Boolean.TRUE.equals(record.getRequireEstimateHours()));
        rules.put("requireDueDate", Boolean.TRUE.equals(record.getRequireDueDate()));
        rules.put("requireTestEvidenceForDev", record.getRequireTestEvidenceForDev() == null
                || Boolean.TRUE.equals(record.getRequireTestEvidenceForDev()));
        rules.put("allowCoAssigneeSubmitQa", Boolean.TRUE.equals(record.getAllowCoAssigneeSubmitQa()));
        rules.put("allowQaRejectWithoutHours", record.getAllowQaRejectWithoutHours() == null
                || Boolean.TRUE.equals(record.getAllowQaRejectWithoutHours()));
        return rules;
    }

    @Transactional
    public void taskRulesUpdate(Integer projectId, Integer userId, Map<String, Object> dto) {
        assertUserCanAccessProject(userId, projectId);

        boolean requireEstimateHours = toBoolean(dto.get("requireEstimateHours"), false);
        boolean requireDueDate = toBoolean(dto.get("requireDueDate"), false);
        boolean requireTestEvidenceForDev = toBoolean(dto.get("requireTestEvidenceForDev"), true);
        boolean allowCoAssigneeSubmitQa = toBoolean(dto.get("allowCoAssigneeSubmitQa"), false);
        boolean allowQaRejectWithoutHours = toBoolean(dto.get("allowQaRejectWithoutHours"), true);

        ProjectTaskRule existing = projectTaskRuleMapper.selectOne(new LambdaQueryWrapper<ProjectTaskRule>()
                .eq(ProjectTaskRule::getProjectId, projectId));
        if (existing == null) {
            ProjectTaskRule created = new ProjectTaskRule();
            created.setProjectId(projectId);
            created.setRequireEstimateHours(requireEstimateHours);
            created.setRequireDueDate(requireDueDate);
            created.setRequireTestEvidenceForDev(requireTestEvidenceForDev);
            created.setAllowCoAssigneeSubmitQa(allowCoAssigneeSubmitQa);
            created.setAllowQaRejectWithoutHours(allowQaRejectWithoutHours);
            projectTaskRuleMapper.insert(created);
        } else {
            existing.setRequireEstimateHours(requireEstimateHours);
            existing.setRequireDueDate(requireDueDate);
            existing.setRequireTestEvidenceForDev(requireTestEvidenceForDev);
            existing.setAllowCoAssigneeSubmitQa(allowCoAssigneeSubmitQa);
            existing.setAllowQaRejectWithoutHours(allowQaRejectWithoutHours);
            projectTaskRuleMapper.updateById(existing);
        }
    }

    public List<Map<String, Object>> scoringRuleVersionOptions(Integer projectId, Integer userId) {
        assertUserCanAccessProject(userId, projectId);

        List<Map<String, Object>> ruleSets = scoringRuleQueryMapper.selectActiveRuleSets(projectId);
        if (ruleSets.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> ruleSetIds = new ArrayList<Integer>();
        Map<Integer, Map<String, Object>> ruleSetMap = new HashMap<Integer, Map<String, Object>>();
        for (Map<String, Object> rs : ruleSets) {
            Integer rsId = toInt(rs.get("id"));
            if (rsId != null) {
                ruleSetIds.add(rsId);
                ruleSetMap.put(rsId, rs);
            }
        }
        if (ruleSetIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> versions = scoringRuleQueryMapper.selectVersionsByRuleSetIds(ruleSetIds);
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> version : versions) {
            Integer ruleSetId = toInt(version.get("ruleSetId"));
            Map<String, Object> rs = ruleSetMap.get(ruleSetId);
            if (rs == null) {
                continue;
            }
            String scope = asString(rs.get("scope"));
            String rsName = asString(rs.get("name"));
            String rsCode = asString(rs.get("code"));
            Integer versionNo = toInt(version.get("version"));

            Map<String, Object> item = new HashMap<String, Object>();
            item.put("id", version.get("id"));
            item.put("ruleSetId", ruleSetId);
            item.put("ruleSetCode", rsCode);
            item.put("ruleSetName", rsName);
            item.put("ruleSetScope", scope);
            item.put("version", versionNo);
            item.put("publishedAt", version.get("publishedAt"));
            item.put("effectiveFrom", version.get("effectiveFrom"));
            item.put("effectiveTo", version.get("effectiveTo"));
            String scopeLabel = "GLOBAL".equals(scope) ? "全局" : "项目";
            item.put("label", "[" + scopeLabel + "] " + rsName + " · v" + (versionNo != null ? versionNo : ""));
            result.add(item);
        }
        return result;
    }

    @Transactional
    public Map<String, Object> setActiveScoringRuleVersion(Integer projectId, Integer activeRuleSetVersionId,
            Integer userId) {
        assertUserCanAccessProject(userId, projectId);

        if (activeRuleSetVersionId != null) {
            Map<String, Object> versionRow = scoringRuleQueryMapper.findVersionWithRuleSet(activeRuleSetVersionId);
            if (versionRow == null || !"ACTIVE".equals(asString(versionRow.get("status")))) {
                throw new BusinessException("规则版本不存在或未启用");
            }
            String scope = asString(versionRow.get("scope"));
            Integer rsProjectId = toInt(versionRow.get("projectId"));
            boolean ok = "GLOBAL".equals(scope)
                    || ("PROJECT".equals(scope) && projectId.equals(rsProjectId));
            if (!ok) {
                throw new BusinessException("该规则版本不属于当前项目可用的规则集");
            }
        }

        Project update = new Project();
        update.setId(projectId);
        update.setActiveRuleSetVersionId(activeRuleSetVersionId);
        projectMapper.updateById(update);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("id", projectId);
        result.put("activeRuleSetVersionId", activeRuleSetVersionId);
        return result;
    }

    public void assertUserCanAccessProject(Integer userId, Integer projectId) {
        Project project = projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                .eq(Project::getId, projectId)
                .isNull(Project::getDeletedAt)
                .select(Project::getId, Project::getOrgId));
        if (project == null) {
            throw new BusinessException("项目不存在", 404);
        }
        assertUserCanAccessOrg(userId, project.getOrgId());
    }

    public void assertUserCanAccessTask(Integer userId, Integer taskId) {
        Task task = taskMapper.selectOne(new LambdaQueryWrapper<Task>()
                .eq(Task::getId, taskId)
                .select(Task::getId, Task::getOrgId, Task::getProjectId));
        if (task == null) {
            throw new BusinessException("任务不存在", 404);
        }
        Integer effectiveOrg = task.getOrgId();
        if (effectiveOrg == null && task.getProjectId() != null) {
            Project project = projectMapper.selectOne(new LambdaQueryWrapper<Project>()
                    .eq(Project::getId, task.getProjectId())
                    .isNull(Project::getDeletedAt)
                    .select(Project::getOrgId));
            if (project != null) {
                effectiveOrg = project.getOrgId();
            }
        }
        assertUserCanAccessOrg(userId, effectiveOrg);
    }

    private void assertUserCanAccessOrg(Integer userId, Integer orgId) {
        List<Integer> allowed = getOrgIdsForUser(userId);
        if (allowed.isEmpty()) {
            throw new BusinessException("当前账号未关联部门，无权限操作", 403);
        }
        if (orgId == null) {
            throw new BusinessException("资源未绑定组织，无权限操作", 403);
        }
        if (!allowed.contains(orgId)) {
            throw new BusinessException("无权限访问该组织下的数据", 403);
        }
    }

    private Integer rootDeptIdFromMap(Integer deptId, Map<Integer, Department> byId) {
        Set<Integer> seen = new HashSet<Integer>();
        Integer cur = deptId;
        while (cur != null && !seen.contains(cur)) {
            seen.add(cur);
            Department node = byId.get(cur);
            if (node == null) {
                return null;
            }
            if (node.getParentId() == null) {
                return node.getId();
            }
            cur = node.getParentId();
        }
        return null;
    }

    public List<Integer> getOrgIdsForUser(Integer userId) {
        List<DeptMember> memberships = deptMemberMapper.selectList(new LambdaQueryWrapper<DeptMember>()
                .eq(DeptMember::getUserId, userId)
                .select(DeptMember::getDeptId));
        if (memberships.isEmpty()) {
            return Collections.emptyList();
        }

        List<Department> allDepts = departmentMapper.selectList(new LambdaQueryWrapper<Department>()
                .isNull(Department::getDeletedAt)
                .select(Department::getId, Department::getParentId));
        Map<Integer, Department> byId = new HashMap<Integer, Department>();
        for (Department dept : allDepts) {
            byId.put(dept.getId(), dept);
        }

        Set<Integer> roots = new HashSet<Integer>();
        for (DeptMember membership : memberships) {
            Integer root = rootDeptIdFromMap(membership.getDeptId(), byId);
            if (root != null) {
                roots.add(root);
            }
        }
        List<Integer> result = new ArrayList<Integer>(roots);
        Collections.sort(result);
        return result;
    }

    private Integer getOrgIdByUserId(Integer userId) {
        List<Integer> ids = getOrgIdsForUser(userId);
        if (ids.isEmpty()) {
            return null;
        }
        return ids.get(0);
    }

    private Map<String, Object> defaultTaskRules() {
        Map<String, Object> rules = new HashMap<String, Object>();
        rules.put("requireEstimateHours", false);
        rules.put("requireDueDate", false);
        rules.put("requireTestEvidenceForDev", true);
        rules.put("allowCoAssigneeSubmitQa", false);
        rules.put("allowQaRejectWithoutHours", true);
        return rules;
    }

    private Map<String, Object> toProjectDetail(Project project) {
        Map<String, Object> map = toProjectMap(project);
        if (project.getManagerId() != null) {
            User manager = userMapper.selectById(project.getManagerId());
            if (manager != null) {
                map.put("manager", toManagerBrief(manager));
            }
        }
        Long taskCount = projectMapper.countTasksByProjectId(project.getId());
        Map<String, Object> count = new HashMap<String, Object>();
        count.put("tasks", taskCount != null ? taskCount : 0L);
        map.put("_count", count);
        return map;
    }

    private Map<String, Object> toProjectMap(Project project) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", project.getId());
        map.put("name", project.getName());
        map.put("description", project.getDescription());
        map.put("orgId", project.getOrgId());
        map.put("version", project.getVersion());
        map.put("managerId", project.getManagerId());
        map.put("status", project.getStatus());
        map.put("startDate", project.getStartDate());
        map.put("endDate", project.getEndDate());
        map.put("createTime", project.getCreateTime());
        map.put("updateTime", project.getUpdateTime());
        map.put("deletedAt", project.getDeletedAt());
        map.put("activeRuleSetVersionId", project.getActiveRuleSetVersionId());
        return map;
    }

    private Map<String, Object> toManagerBrief(User user) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", user.getId());
        map.put("userName", user.getUserName());
        map.put("nickName", user.getNickName());
        map.put("avatar", user.getAvatar());
        map.put("userEmail", user.getUserEmail());
        return map;
    }

    private List<Map<String, Object>> toOrgMemberList(List<User> users) {
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (User user : users) {
            Map<String, Object> map = toManagerBrief(user);
            map.put("userPhone", user.getUserPhone());
            map.put("userGender", user.getUserGender());
            result.add(map);
        }
        return result;
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

    private boolean toBoolean(Object value, boolean defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        String text = String.valueOf(value).trim();
        if ("true".equalsIgnoreCase(text) || "1".equals(text)) {
            return true;
        }
        if ("false".equalsIgnoreCase(text) || "0".equals(text)) {
            return false;
        }
        return defaultValue;
    }
}
