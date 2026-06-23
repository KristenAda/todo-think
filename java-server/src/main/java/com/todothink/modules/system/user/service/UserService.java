package com.todothink.modules.system.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.auth.AuthUtil;
import com.todothink.core.exception.BusinessException;
import com.todothink.modules.system.entity.User;
import com.todothink.modules.system.mapper.RelationMapper;
import com.todothink.modules.system.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private final UserMapper userMapper;
    private final RelationMapper relationMapper;
    private final AuthUtil authUtil;
    private final ObjectMapper objectMapper;

    public UserService(UserMapper userMapper, RelationMapper relationMapper,
            AuthUtil authUtil, ObjectMapper objectMapper) {
        this.userMapper = userMapper;
        this.relationMapper = relationMapper;
        this.authUtil = authUtil;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> pageList(int page, int pageSize, Map<String, String> params) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<User>();
        if (StringUtils.hasText(params.get("userName"))) {
            wrapper.like(User::getUserName, params.get("userName"));
        }
        if (StringUtils.hasText(params.get("userPhone"))) {
            wrapper.like(User::getUserPhone, params.get("userPhone"));
        }
        if (StringUtils.hasText(params.get("userEmail"))) {
            wrapper.like(User::getUserEmail, params.get("userEmail"));
        }
        if (StringUtils.hasText(params.get("status"))) {
            wrapper.eq(User::getStatus, params.get("status"));
        }
        wrapper.orderByDesc(User::getCreateTime);

        Page<User> pageResult = userMapper.selectPage(new Page<User>(page, pageSize), wrapper);
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        for (User u : pageResult.getRecords()) {
            Map<String, Object> item = toSafeMap(u);
            List<String> roleCodes = userMapper.selectRoleCodesByUserId(u.getId());
            item.put("userRoles", roleCodes);
            list.add(item);
        }
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("list", list);
        result.put("total", pageResult.getTotal());
        return result;
    }

    @Transactional
    public Map<String, Object> add(Map<String, Object> data, List<Integer> roleIds) {
        User user = mapToUser(data);
        if (!StringUtils.hasText(user.getPassword())) {
            user.setPassword(authUtil.hashPassword(authUtil.sha256("123456")));
        } else {
            user.setPassword(authUtil.hashPassword(authUtil.sha256(user.getPassword())));
        }
        userMapper.insert(user);
        if (roleIds != null && !roleIds.isEmpty()) {
            assignRoles(user.getId(), roleIds);
        }
        return toSafeMap(userMapper.selectById(user.getId()));
    }

    @Transactional
    public Map<String, Object> update(Integer id, Map<String, Object> data, List<Integer> roleIds) {
        User existing = userMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException("用户不存在");
        }
        if (data.containsKey("avatar")) {
            String avatar = String.valueOf(data.get("avatar"));
            if (avatar.length() > 10 * 1024 * 1024) {
                throw new BusinessException("头像文件过大，请上传小于 5MB 的图片");
            }
        }
        User user = new User();
        user.setId(id);
        copyIfPresent(data, "userName", user);
        copyIfPresent(data, "nickName", user);
        copyIfPresent(data, "userPhone", user);
        copyIfPresent(data, "userEmail", user);
        copyIfPresent(data, "userGender", user);
        copyIfPresent(data, "avatar", user);
        copyIfPresent(data, "status", user);
        copyIfPresent(data, "remark", user);
        if (data.containsKey("password") && data.get("password") != null
                && StringUtils.hasText(String.valueOf(data.get("password")))) {
            user.setPassword(authUtil.hashPassword(authUtil.sha256(String.valueOf(data.get("password")))));
        }
        if (data.containsKey("tags")) {
            try {
                user.setTags(objectMapper.writeValueAsString(data.get("tags")));
            } catch (Exception e) {
                throw new BusinessException("tags 格式错误");
            }
        }
        userMapper.updateById(user);
        if (roleIds != null) {
            assignRoles(id, roleIds);
        }
        return toSafeMap(userMapper.selectById(id));
    }

    private void copyIfPresent(Map<String, Object> data, String key, User user) {
        if (!data.containsKey(key)) {
            return;
        }
        Object val = data.get(key);
        switch (key) {
            case "userName":
                user.setUserName(val != null ? String.valueOf(val) : null);
                break;
            case "nickName":
                user.setNickName(val != null ? String.valueOf(val) : null);
                break;
            case "userPhone":
                user.setUserPhone(val != null ? String.valueOf(val) : null);
                break;
            case "userEmail":
                user.setUserEmail(val != null ? String.valueOf(val) : null);
                break;
            case "userGender":
                user.setUserGender(val != null ? String.valueOf(val) : null);
                break;
            case "avatar":
                user.setAvatar(val != null ? String.valueOf(val) : null);
                break;
            case "status":
                user.setStatus(val != null ? String.valueOf(val) : null);
                break;
            case "remark":
                user.setRemark(val != null ? String.valueOf(val) : null);
                break;
            default:
                break;
        }
    }

    public void delete(Integer id) {
        userMapper.deleteById(id);
    }

    public Map<String, Object> getProfile(Integer id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        Map<String, Object> map = toSafeMap(user);
        if (StringUtils.hasText(user.getTags())) {
            try {
                map.put("tags", objectMapper.readValue(user.getTags(), new TypeReference<List<String>>() {
                }));
            } catch (Exception e) {
                map.put("tags", new ArrayList<String>());
            }
        } else {
            map.put("tags", new ArrayList<String>());
        }
        return map;
    }

    public void changePassword(Integer id, String oldPassword, String newPassword) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        if (!authUtil.comparePassword(oldPassword, user.getPassword())) {
            throw new BusinessException("原密码错误");
        }
        User update = new User();
        update.setId(id);
        update.setPassword(authUtil.hashPassword(newPassword));
        userMapper.updateById(update);
    }

    @Transactional
    public void assignRoles(Integer userId, List<Integer> roleIds) {
        relationMapper.deleteUserRoles(userId);
        if (roleIds != null && !roleIds.isEmpty()) {
            relationMapper.insertUserRoles(userId, roleIds);
        }
    }

    public List<Integer> getUserRoles(Integer userId) {
        return userMapper.selectRoleIdsByUserId(userId);
    }

    private Map<String, Object> toSafeMap(User user) {
        Map<String, Object> map = objectMapper.convertValue(user, Map.class);
        map.remove("password");
        return map;
    }

    private User mapToUser(Map<String, Object> data) {
        return objectMapper.convertValue(data, User.class);
    }
}