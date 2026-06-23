package com.todothink.modules.system.organization.controller;

import com.todothink.core.result.Result;
import com.todothink.core.security.LoginUser;
import com.todothink.core.security.SecurityUtils;
import com.todothink.core.util.RoleUtil;
import com.todothink.modules.system.organization.service.OrganizationService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/departments")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("/tree")
    public Result<?> getTree() {
        return Result.success(organizationService.getTree());
    }

    @GetMapping("/users")
    public Result<?> getAllUsers() {
        return Result.success(organizationService.getAllUsers());
    }

    @GetMapping("/{id}/managers")
    public Result<?> getManagers(@PathVariable Integer id) {
        return Result.success(organizationService.getManagers(id));
    }

    @PostMapping("/{id}/managers")
    public Result<?> addManagers(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        if (!isSuperAdmin()) {
            return Result.error("无权限：仅超级管理员可添加管理者", 403);
        }
        List<Integer> userIds = castIntList(body.get("userIds"));
        if (userIds == null || userIds.isEmpty()) {
            return Result.error("参数错误");
        }
        organizationService.addManagers(id, userIds);
        return Result.success(null, "添加管理者成功");
    }

    @DeleteMapping("/{id}/managers/{userId}")
    public Result<?> removeManager(@PathVariable Integer id, @PathVariable Integer userId) {
        if (!isSuperAdmin()) {
            return Result.error("无权限：仅超级管理员可移除管理者", 403);
        }
        organizationService.removeManager(id, userId);
        return Result.success(null, "已移除管理者");
    }

    @GetMapping("/{id}/members")
    public Result<?> getMembers(@PathVariable Integer id) {
        return Result.success(organizationService.getMembers(id));
    }

    @PostMapping("/{id}/members")
    public Result<?> addMembers(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Integer uid = SecurityUtils.currentUserId();
        if (!isSuperAdmin() && !organizationService.isManager(id, uid)) {
            return Result.error("无权限：您不是该部门的管理者", 403);
        }
        List<Integer> userIds = castIntList(body.get("userIds"));
        if (userIds == null || userIds.isEmpty()) {
            return Result.error("参数错误");
        }
        organizationService.addMembers(id, userIds);
        return Result.success(null, "添加成员成功");
    }

    @DeleteMapping("/{id}/members/{userId}")
    public Result<?> removeMember(@PathVariable Integer id, @PathVariable Integer userId) {
        Integer uid = SecurityUtils.currentUserId();
        if (!isSuperAdmin() && !organizationService.isManager(id, uid)) {
            return Result.error("无权限：您不是该部门的管理者", 403);
        }
        organizationService.removeMember(id, userId);
        return Result.success(null, "已移除成员");
    }

    private boolean isSuperAdmin() {
        LoginUser user = SecurityUtils.currentUser();
        return user != null && RoleUtil.isSuperAdminRoles(user.getRoles());
    }

    @SuppressWarnings("unchecked")
    private List<Integer> castIntList(Object val) {
        if (val instanceof List) {
            return (List<Integer>) val;
        }
        return null;
    }
}
