package com.todothink.modules.system.menu.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.exception.BusinessException;
import com.todothink.modules.system.entity.Menu;
import com.todothink.modules.system.entity.Role;
import com.todothink.modules.system.entity.User;
import com.todothink.modules.system.mapper.MenuMapper;
import com.todothink.modules.system.mapper.RoleMapper;
import com.todothink.modules.system.mapper.UserMapper;
import com.todothink.modules.system.menu.util.MenuTreeUtil;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MenuService {

    private final MenuMapper menuMapper;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final ObjectMapper objectMapper;

    public MenuService(MenuMapper menuMapper, UserMapper userMapper, RoleMapper roleMapper,
            ObjectMapper objectMapper) {
        this.menuMapper = menuMapper;
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> listAll(String title) {
        LambdaQueryWrapper<Menu> wrapper = new LambdaQueryWrapper<Menu>();
        if (StringUtils.hasText(title)) {
            wrapper.like(Menu::getTitle, title);
        }
        wrapper.orderByAsc(Menu::getSort);
        List<Menu> list = menuMapper.selectList(wrapper);
        List<Map<String, Object>> tree = MenuTreeUtil.listToTree(list, null);
        return MenuTreeUtil.transformToFrontendFormat(tree, objectMapper);
    }

    public List<Map<String, Object>> getUserMenus(Integer userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户信息异常或已失效，请重新登录", 401);
        }
        List<String> roleCodes = userMapper.selectRoleCodesByUserId(userId);
        boolean isAdmin = roleCodes != null && roleCodes.contains("admin");

        List<Integer> userRoleIds = userMapper.selectRoleIdsByUserId(userId);
        List<Role> defaultRoles = roleMapper.selectList(new LambdaQueryWrapper<Role>()
                .eq(Role::getIsDefaultRole, true)
                .eq(Role::getEnabled, true)
                .isNull(Role::getDeletedAt));
        Set<Integer> mergedRoleIds = new LinkedHashSet<Integer>(userRoleIds);
        for (Role r : defaultRoles) {
            mergedRoleIds.add(r.getId());
        }

        List<Menu> list;
        if (isAdmin) {
            list = menuMapper.selectList(new LambdaQueryWrapper<Menu>()
                    .in(Menu::getType, 1, 2)
                    .orderByAsc(Menu::getSort));
        } else if (!mergedRoleIds.isEmpty()) {
            list = menuMapper.selectList(new LambdaQueryWrapper<Menu>()
                    .in(Menu::getType, 1, 2)
                    .inSql(Menu::getId,
                            "SELECT DISTINCT mr.A FROM `_MenuToRole` mr WHERE mr.B IN ("
                                    + joinIds(mergedRoleIds) + ")")
                    .orderByAsc(Menu::getSort));
        } else {
            list = new ArrayList<Menu>();
        }

        List<Map<String, Object>> tree = MenuTreeUtil.listToTree(list, null);
        return MenuTreeUtil.transformToFrontendFormat(tree, objectMapper);
    }

    public Menu add(Menu menu) {
        menuMapper.insert(menu);
        return menu;
    }

    public Menu update(Integer id, Menu menu) {
        if (menu.getParentId() != null) {
            if (menu.getParentId().equals(id)) {
                throw new BusinessException("上级菜单不能为当前菜单本身", 400);
            }
            if (isUnderSubtree(id, menu.getParentId())) {
                throw new BusinessException("不能将菜单移动到其子菜单之下", 400);
            }
        }
        menu.setId(id);
        menuMapper.updateById(menu);
        return menuMapper.selectById(id);
    }

    public void delete(Integer id) {
        Long count = menuMapper.selectCount(new LambdaQueryWrapper<Menu>().eq(Menu::getParentId, id));
        if (count != null && count > 0) {
            throw new BusinessException("存在子菜单，请先删除子菜单");
        }
        menuMapper.deleteById(id);
    }

    private boolean isUnderSubtree(Integer ancestorId, Integer nodeId) {
        Integer cur = nodeId;
        int guard = 0;
        while (cur != null && guard++ < 10000) {
            if (cur.equals(ancestorId)) {
                return true;
            }
            Menu row = menuMapper.selectById(cur);
            cur = row != null ? row.getParentId() : null;
        }
        return false;
    }

    private String joinIds(Set<Integer> ids) {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Integer id : ids) {
            if (!first) {
                sb.append(",");
            }
            sb.append(id);
            first = false;
        }
        return sb.toString();
    }
}
