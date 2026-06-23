package com.todothink.modules.system.role.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.todothink.core.exception.BusinessException;
import com.todothink.modules.system.entity.Role;
import com.todothink.modules.system.mapper.RelationMapper;
import com.todothink.modules.system.mapper.RoleMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RoleService {

    private final RoleMapper roleMapper;
    private final RelationMapper relationMapper;

    public RoleService(RoleMapper roleMapper, RelationMapper relationMapper) {
        this.roleMapper = roleMapper;
        this.relationMapper = relationMapper;
    }

    public Map<String, Object> pageList(int page, int pageSize, Map<String, Object> params) {
        LambdaQueryWrapper<Role> wrapper = new LambdaQueryWrapper<Role>();
        if (StringUtils.hasText((String) params.get("roleName"))) {
            wrapper.like(Role::getRoleName, params.get("roleName"));
        }
        if (StringUtils.hasText((String) params.get("roleCode"))) {
            wrapper.like(Role::getRoleCode, params.get("roleCode"));
        }
        if (StringUtils.hasText((String) params.get("description"))) {
            wrapper.like(Role::getDescription, params.get("description"));
        }
        if (params.get("enabled") != null) {
            wrapper.eq(Role::getEnabled, params.get("enabled"));
        }
        wrapper.orderByDesc(Role::getCreateTime);

        Page<Role> pageResult = roleMapper.selectPage(new Page<Role>(page, pageSize), wrapper);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("list", pageResult.getRecords());
        result.put("total", pageResult.getTotal());
        return result;
    }

    @Transactional
    public Role add(Role role) {
        if (Boolean.TRUE.equals(role.getIsDefaultRole())) {
            clearDefaultRole(null);
        }
        roleMapper.insert(role);
        return role;
    }

    @Transactional
    public Role update(Integer id, Role role) {
        if (Boolean.TRUE.equals(role.getIsDefaultRole())) {
            clearDefaultRole(id);
        }
        role.setId(id);
        roleMapper.updateById(role);
        return roleMapper.selectById(id);
    }

    public void delete(Integer id) {
        roleMapper.deleteById(id);
    }

    @Transactional
    public void updateMenus(Integer roleId, List<Integer> menuIds) {
        relationMapper.deleteRoleMenus(roleId);
        if (menuIds != null && !menuIds.isEmpty()) {
            relationMapper.insertRoleMenus(roleId, menuIds);
        }
    }

    public List<Integer> getMenuIdsByRoleId(Integer roleId) {
        return relationMapper.selectMenuIdsByRoleId(roleId);
    }

    @Transactional
    public void updateDataScope(Integer roleId, Integer dataScope, List<Integer> deptIds) {
        Role update = new Role();
        update.setId(roleId);
        update.setDataScope(dataScope);
        roleMapper.updateById(update);
        relationMapper.deleteRoleDepts(roleId);
        if (dataScope != null && dataScope == 2 && deptIds != null && !deptIds.isEmpty()) {
            relationMapper.insertRoleDepts(roleId, deptIds);
        }
    }

    private void clearDefaultRole(Integer excludeId) {
        LambdaUpdateWrapper<Role> wrapper = new LambdaUpdateWrapper<Role>()
                .eq(Role::getIsDefaultRole, true)
                .isNull(Role::getDeletedAt)
                .set(Role::getIsDefaultRole, false);
        if (excludeId != null) {
            wrapper.ne(Role::getId, excludeId);
        }
        roleMapper.update(null, wrapper);
    }
}
