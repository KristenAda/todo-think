package com.todothink.modules.system.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.result.Result;
import com.todothink.core.security.SecurityUtils;
import com.todothink.modules.system.user.service.UserService;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService userService;
    private final ObjectMapper objectMapper;

    public UserController(UserService userService, ObjectMapper objectMapper) {
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String userPhone,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String status) {
        Map<String, String> params = new HashMap<String, String>();
        params.put("userName", userName);
        params.put("userPhone", userPhone);
        params.put("userEmail", userEmail);
        params.put("status", status);
        Map<String, Object> res = userService.pageList(current, size, params);
        return Result.page((List<?>) res.get("list"), (Long) res.get("total"), current, size);
    }

    @PostMapping("/add")
    public Result<?> add(@RequestBody Map<String, Object> body) {
        List<Integer> roleIds = castRoleIds(body.get("roleIds"));
        Map<String, Object> data = filterUserFields(body);
        return Result.success(userService.add(data, roleIds));
    }

    @PostMapping("/update")
    public Result<?> update(@RequestBody Map<String, Object> body) {
        Integer id = toInt(body.get("id"));
        List<Integer> roleIds = castRoleIds(body.get("roleIds"));
        Map<String, Object> data = filterUserFields(body);
        return Result.success(userService.update(id, data, roleIds));
    }

    @PostMapping("/delete")
    public Result<?> delete(@RequestBody Map<String, Object> body) {
        Integer id = toInt(body.get("id"));
        if (id != null && id == 1) {
            return Result.error("超级管理员无法删除");
        }
        userService.delete(id);
        return Result.success();
    }

    @GetMapping("/profile")
    public Result<?> profile() {
        return Result.success(userService.getProfile(SecurityUtils.currentUserId()));
    }

    @PostMapping("/profile")
    public Result<?> updateProfile(@RequestBody Map<String, Object> body) {
        Integer id = SecurityUtils.currentUserId();
        Map<String, Object> data = new HashMap<String, Object>();
        String[] fields = {"nickName", "userPhone", "userEmail", "userGender", "avatar", "remark"};
        for (String f : fields) {
            if (body.containsKey(f)) {
                data.put(f, body.get(f));
            }
        }
        if (body.containsKey("tags")) {
            Object tags = body.get("tags");
            if (tags instanceof List) {
                data.put("tags", tags);
            }
        }
        Map<String, Object> res = userService.update(id, data, null);
        if (res.get("tags") instanceof String && StringUtils.hasText((String) res.get("tags"))) {
            try {
                res.put("tags", objectMapper.readValue((String) res.get("tags"),
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {
                        }));
            } catch (Exception e) {
                res.put("tags", new java.util.ArrayList<String>());
            }
        }
        return Result.success(res);
    }

    @PostMapping("/change-password")
    public Result<?> changePassword(@RequestBody Map<String, String> body) {
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null || newPassword == null) {
            return Result.error("请填写原密码和新密码");
        }
        userService.changePassword(SecurityUtils.currentUserId(), oldPassword, newPassword);
        return Result.success(null, "密码修改成功");
    }

    @PostMapping("/assignRoles")
    public Result<?> assignRoles(@RequestBody Map<String, Object> body) {
        Integer userId = toInt(body.get("userId"));
        if (userId == null) {
            return Result.error("userId不能为空");
        }
        List<Integer> roleIds = castRoleIds(body.get("roleIds"));
        if (roleIds == null) {
            return Result.error("roleIds格式错误");
        }
        userService.assignRoles(userId, roleIds);
        return Result.success();
    }

    @PostMapping("/roles")
    public Result<?> getRoles(@RequestBody Map<String, Object> body) {
        Integer userId = toInt(body.get("userId"));
        if (userId == null) {
            return Result.error("userId不能为空");
        }
        return Result.success(userService.getUserRoles(userId));
    }

    private Map<String, Object> filterUserFields(Map<String, Object> body) {
        Map<String, Object> data = new HashMap<String, Object>();
        String[] fields = {"userName", "password", "nickName", "userPhone", "userEmail",
                "userGender", "avatar", "status", "remark", "deptId"};
        for (String f : fields) {
            if (body.containsKey(f)) {
                data.put(f, body.get(f));
            }
        }
        return data;
    }

    @SuppressWarnings("unchecked")
    private List<Integer> castRoleIds(Object roleIds) {
        if (roleIds == null) {
            return null;
        }
        if (!(roleIds instanceof List)) {
            return null;
        }
        return (List<Integer>) roleIds;
    }

    private Integer toInt(Object val) {
        if (val == null) {
            return null;
        }
        return Integer.valueOf(String.valueOf(val));
    }
}
