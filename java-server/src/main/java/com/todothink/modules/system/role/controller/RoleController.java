package com.todothink.modules.system.role.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.result.Result;
import com.todothink.modules.system.entity.Role;
import com.todothink.modules.system.role.service.RoleService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/role")
public class RoleController {

    private final RoleService roleService;
    private final ObjectMapper objectMapper;

    public RoleController(RoleService roleService, ObjectMapper objectMapper) {
        this.roleService = roleService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String roleName,
            @RequestParam(required = false) String roleCode,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String enabled) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("roleName", roleName);
        params.put("roleCode", roleCode);
        params.put("description", description);
        if (enabled != null) {
            params.put("enabled", "true".equals(enabled));
        }
        Map<String, Object> res = roleService.pageList(current, size, params);
        List<Role> list = (List<Role>) res.get("list");
        List<Map<String, Object>> mapped = new ArrayList<Map<String, Object>>();
        for (Role item : list) {
            Map<String, Object> map = objectMapper.convertValue(item, Map.class);
            map.put("roleId", item.getId());
            mapped.add(map);
        }
        return Result.page(mapped, (Long) res.get("total"), current, size);
    }

    @PostMapping("/add")
    public Result<?> add(@RequestBody Role role) {
        if (!org.springframework.util.StringUtils.hasText(role.getRoleName())) {
            return Result.error("角色名称不能为空");
        }
        if (!org.springframework.util.StringUtils.hasText(role.getRoleCode())) {
            return Result.error("角色编码不能为空");
        }
        return Result.success(roleService.add(role));
    }

    @PostMapping("/update")
    public Result<?> update(@RequestBody Role role) {
        if (role.getId() == null) {
            return Result.error("ID不能为空");
        }
        return Result.success(roleService.update(role.getId(), role));
    }

    @PostMapping("/delete")
    public Result<?> delete(@RequestBody Map<String, Object> body) {
        Integer id = body.get("id") != null ? Integer.valueOf(String.valueOf(body.get("id"))) : null;
        if (id == null) {
            return Result.error("ID不能为空");
        }
        roleService.delete(id);
        return Result.success(null, "删除成功");
    }

    @PostMapping("/assignMenus")
    public Result<?> assignMenus(@RequestBody Map<String, Object> body) {
        Integer roleId = toInt(body.get("roleId"));
        List<Integer> menuIds = castIntList(body.get("menuIds"));
        if (roleId == null || menuIds == null) {
            return Result.error("参数错误");
        }
        roleService.updateMenus(roleId, menuIds);
        return Result.success(null, "权限分配成功");
    }

    @PostMapping("/getMenus")
    public Result<?> getMenus(@RequestBody Map<String, Object> body) {
        Integer roleId = toInt(body.get("roleId"));
        if (roleId == null) {
            return Result.error("roleId不能为空");
        }
        return Result.success(roleService.getMenuIdsByRoleId(roleId));
    }

    @PostMapping("/updateDataScope")
    public Result<?> updateDataScope(@RequestBody Map<String, Object> body) {
        Integer roleId = toInt(body.get("roleId"));
        Integer dataScope = toInt(body.get("dataScope"));
        if (roleId == null) {
            return Result.error("roleId不能为空");
        }
        if (dataScope == null) {
            return Result.error("dataScope不能为空");
        }
        List<Integer> deptIds = castIntList(body.get("deptIds"));
        if (deptIds == null) {
            deptIds = new ArrayList<Integer>();
        }
        roleService.updateDataScope(roleId, dataScope, deptIds);
        return Result.success(null, "数据权限分配成功");
    }

    @SuppressWarnings("unchecked")
    private List<Integer> castIntList(Object val) {
        if (val == null) {
            return new ArrayList<Integer>();
        }
        if (!(val instanceof List)) {
            return null;
        }
        return (List<Integer>) val;
    }

    private Integer toInt(Object val) {
        if (val == null) {
            return null;
        }
        return Integer.valueOf(String.valueOf(val));
    }
}
