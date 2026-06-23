package com.todothink.modules.system.organization.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.todothink.modules.system.entity.Department;
import com.todothink.modules.system.entity.DeptManager;
import com.todothink.modules.system.entity.DeptMember;
import com.todothink.modules.system.entity.User;
import com.todothink.modules.system.mapper.DepartmentMapper;
import com.todothink.modules.system.mapper.DeptManagerMapper;
import com.todothink.modules.system.mapper.DeptMemberMapper;
import com.todothink.modules.system.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrganizationService {

    private final DepartmentMapper departmentMapper;
    private final DeptManagerMapper deptManagerMapper;
    private final DeptMemberMapper deptMemberMapper;
    private final UserMapper userMapper;

    public OrganizationService(DepartmentMapper departmentMapper, DeptManagerMapper deptManagerMapper,
            DeptMemberMapper deptMemberMapper, UserMapper userMapper) {
        this.departmentMapper = departmentMapper;
        this.deptManagerMapper = deptManagerMapper;
        this.deptMemberMapper = deptMemberMapper;
        this.userMapper = userMapper;
    }

    public List<Map<String, Object>> getTree() {
        List<Department> depts = departmentMapper.selectList(new LambdaQueryWrapper<Department>()
                .isNull(Department::getDeletedAt)
                .orderByAsc(Department::getSort)
                .orderByAsc(Department::getId));
        List<Map<String, Object>> flat = new ArrayList<Map<String, Object>>();
        for (Department d : depts) {
            Map<String, Object> item = new HashMap<String, Object>();
            item.put("id", d.getId());
            item.put("parentId", d.getParentId());
            item.put("name", d.getName());
            item.put("sort", d.getSort());
            item.put("leader", d.getLeader());
            item.put("phone", d.getPhone());
            item.put("email", d.getEmail());
            item.put("status", d.getStatus());
            item.put("ancestors", d.getAncestors());
            Long managerCount = deptManagerMapper.selectCount(new LambdaQueryWrapper<DeptManager>()
                    .eq(DeptManager::getDeptId, d.getId()));
            Long memberCount = deptMemberMapper.selectCount(new LambdaQueryWrapper<DeptMember>()
                    .eq(DeptMember::getDeptId, d.getId()));
            Map<String, Object> count = new HashMap<String, Object>();
            count.put("managers", managerCount);
            count.put("members", memberCount);
            item.put("_count", count);
            flat.add(item);
        }
        return buildTree(flat, null);
    }

    public List<Map<String, Object>> getAllUsers() {
        List<User> users = userMapper.selectList(new LambdaQueryWrapper<User>()
                .isNull(User::getDeletedAt)
                .orderByAsc(User::getId));
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (User u : users) {
            result.add(toUserBrief(u));
        }
        return result;
    }

    public List<Map<String, Object>> getManagers(Integer deptId) {
        List<DeptManager> rows = deptManagerMapper.selectByDeptId(deptId);
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (DeptManager row : rows) {
            User user = userMapper.selectById(row.getUserId());
            if (user != null) {
                result.add(toUserBrief(user));
            }
        }
        return result;
    }

    public List<Map<String, Object>> getMembers(Integer deptId) {
        List<DeptMember> rows = deptMemberMapper.selectByDeptId(deptId);
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (DeptMember row : rows) {
            User user = userMapper.selectById(row.getUserId());
            if (user != null) {
                result.add(toUserBrief(user));
            }
        }
        return result;
    }

    @Transactional
    public void addManagers(Integer deptId, List<Integer> userIds) {
        for (Integer userId : userIds) {
            DeptManager dm = new DeptManager();
            dm.setDeptId(deptId);
            dm.setUserId(userId);
            try {
                deptManagerMapper.insert(dm);
            } catch (Exception ignored) {
                // skip duplicate
            }
        }
    }

    public void removeManager(Integer deptId, Integer userId) {
        deptManagerMapper.delete(new LambdaQueryWrapper<DeptManager>()
                .eq(DeptManager::getDeptId, deptId)
                .eq(DeptManager::getUserId, userId));
    }

    @Transactional
    public void addMembers(Integer deptId, List<Integer> userIds) {
        for (Integer userId : userIds) {
            DeptMember dm = new DeptMember();
            dm.setDeptId(deptId);
            dm.setUserId(userId);
            try {
                deptMemberMapper.insert(dm);
            } catch (Exception ignored) {
                // skip duplicate
            }
        }
    }

    public void removeMember(Integer deptId, Integer userId) {
        deptMemberMapper.delete(new LambdaQueryWrapper<DeptMember>()
                .eq(DeptMember::getDeptId, deptId)
                .eq(DeptMember::getUserId, userId));
    }

    public boolean isManager(Integer deptId, Integer userId) {
        Long count = deptManagerMapper.selectCount(new LambdaQueryWrapper<DeptManager>()
                .eq(DeptManager::getDeptId, deptId)
                .eq(DeptManager::getUserId, userId));
        return count != null && count > 0;
    }

    private List<Map<String, Object>> buildTree(List<Map<String, Object>> depts, Integer parentId) {
        List<Map<String, Object>> tree = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> d : depts) {
            Integer pid = (Integer) d.get("parentId");
            boolean match = (parentId == null && pid == null) || (parentId != null && parentId.equals(pid));
            if (match) {
                Map<String, Object> node = new HashMap<String, Object>(d);
                List<Map<String, Object>> children = buildTree(depts, (Integer) d.get("id"));
                if (!children.isEmpty()) {
                    node.put("children", children);
                }
                tree.add(node);
            }
        }
        return tree;
    }

    private Map<String, Object> toUserBrief(User user) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", user.getId());
        map.put("userName", user.getUserName());
        map.put("nickName", user.getNickName());
        map.put("userEmail", user.getUserEmail());
        map.put("userPhone", user.getUserPhone());
        map.put("userGender", user.getUserGender());
        map.put("avatar", user.getAvatar());
        map.put("status", user.getStatus());
        return map;
    }
}
