package com.todothink.modules.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.auth.AuthUtil;
import com.todothink.core.exception.BusinessException;
import com.todothink.modules.auth.dto.RegisterRequest;
import com.todothink.modules.system.entity.Menu;
import com.todothink.modules.system.entity.Role;
import com.todothink.modules.system.entity.User;
import com.todothink.modules.system.mapper.MenuMapper;
import com.todothink.modules.system.mapper.RoleMapper;
import com.todothink.modules.system.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final MenuMapper menuMapper;
    private final AuthUtil authUtil;
    private final ObjectMapper objectMapper;

    public AuthService(UserMapper userMapper, RoleMapper roleMapper, MenuMapper menuMapper,
            AuthUtil authUtil, ObjectMapper objectMapper) {
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.menuMapper = menuMapper;
        this.authUtil = authUtil;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> login(String userName, String password) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUserName, userName));
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        if (!authUtil.comparePassword(password, user.getPassword())) {
            throw new BusinessException("密码错误");
        }
        Map<String, Object> userInfo = getUserInfo(user.getId());
        String token = authUtil.signToken(user.getId(), user.getUserName(),
                (List<String>) userInfo.get("roles"));
        userInfo.put("token", token);
        return userInfo;
    }

    public User register(RegisterRequest request) {
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUserName, request.getUserName()));
        if (count != null && count > 0) {
            throw new BusinessException("用户名已存在");
        }
        User user = new User();
        user.setUserName(request.getUserName());
        user.setPassword(authUtil.hashPassword(request.getPassword()));
        user.setNickName(request.getNickName());
        user.setStatus("1");
        userMapper.insert(user);
        return user;
    }

    public Map<String, Object> getUserInfo(Integer userId) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getId, userId)
                .isNull(User::getDeletedAt)
                .eq(User::getStatus, "1"));
        if (user == null) {
            throw new BusinessException("用户不存在或已被停用");
        }

        List<String> roleCodes = userMapper.selectRoleCodesByUserId(userId);
        if (roleCodes == null) {
            roleCodes = new ArrayList<String>();
        }
        final List<String> roles = roleCodes;
        boolean isAdmin = roles.contains("admin");

        List<Integer> userRoleIds = userMapper.selectRoleIdsByUserId(userId);
        List<Role> defaultRoles = roleMapper.selectList(new LambdaQueryWrapper<Role>()
                .eq(Role::getIsDefaultRole, true)
                .eq(Role::getEnabled, true)
                .isNull(Role::getDeletedAt));
        Set<Integer> mergedRoleIds = new LinkedHashSet<Integer>(userRoleIds);
        for (Role r : defaultRoles) {
            mergedRoleIds.add(r.getId());
        }

        List<String> buttons = new ArrayList<String>();
        if (isAdmin) {
            buttons.add("*:*:*");
        } else if (!mergedRoleIds.isEmpty()) {
            List<Menu> menus = menuMapper.selectMenusByRoleIds(new ArrayList<Integer>(mergedRoleIds));
            Set<String> perms = new HashSet<String>();
            for (Menu menu : menus) {
                if (menu.getAuthList() == null) {
                    continue;
                }
                try {
                    List<Map<String, Object>> authList = objectMapper.readValue(menu.getAuthList(),
                            new TypeReference<List<Map<String, Object>>>() {
                            });
                    for (Map<String, Object> auth : authList) {
                        Object mark = auth.get("authMark");
                        if (mark != null) {
                            perms.add(String.valueOf(mark));
                        }
                    }
                } catch (Exception ignored) {
                    // ignore parse error
                }
            }
            buttons.addAll(perms);
        }

        Map<String, Object> result = new java.util.LinkedHashMap<String, Object>();
        result.put("userId", user.getId());
        result.put("userName", user.getUserName());
        result.put("nickName", user.getNickName());
        result.put("userGender", user.getUserGender());
        result.put("email", user.getUserEmail());
        result.put("avatar", user.getAvatar());
        result.put("roles", roles);
        result.put("buttons", buttons);
        return result;
    }
}
