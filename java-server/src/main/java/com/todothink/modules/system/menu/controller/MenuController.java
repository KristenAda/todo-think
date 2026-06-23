package com.todothink.modules.system.menu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.result.Result;
import com.todothink.core.security.SecurityUtils;
import com.todothink.modules.system.entity.Menu;
import com.todothink.modules.system.menu.service.MenuService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/menu")
public class MenuController {

    private final MenuService menuService;
    private final ObjectMapper objectMapper;

    public MenuController(MenuService menuService, ObjectMapper objectMapper) {
        this.menuService = menuService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/list")
    public Result<List<Map<String, Object>>> list(@RequestParam(required = false) String title) {
        return Result.success(menuService.listAll(title));
    }

    @GetMapping("/tree")
    public Result<List<Map<String, Object>>> tree() {
        return Result.success(menuService.getUserMenus(SecurityUtils.currentUserId()));
    }

    @PostMapping("/add")
    public Result<Menu> add(@RequestBody Map<String, Object> body) {
        if (body.get("title") == null) {
            return Result.error("菜单名称不能为空");
        }
        Menu menu = objectMapper.convertValue(body, Menu.class);
        normalizeJsonFields(menu, body);
        return Result.success(menuService.add(menu));
    }

    @PostMapping("/update")
    public Result<Menu> update(@RequestBody Map<String, Object> body) {
        Object idObj = body.get("id");
        if (idObj == null) {
            return Result.error("ID不能为空");
        }
        Integer id = Integer.valueOf(String.valueOf(idObj));
        Menu menu = objectMapper.convertValue(body, Menu.class);
        normalizeJsonFields(menu, body);
        return Result.success(menuService.update(id, menu));
    }

    @PostMapping("/delete")
    public Result<Void> delete(@RequestBody Map<String, Object> body) {
        Object idObj = body.get("id");
        if (idObj == null) {
            return Result.error("ID不能为空");
        }
        menuService.delete(Integer.valueOf(String.valueOf(idObj)));
        return Result.success(null, "删除成功");
    }

    private void normalizeJsonFields(Menu menu, Map<String, Object> body) {
        try {
            if (body.get("roles") instanceof List) {
                menu.setRoles(objectMapper.writeValueAsString(body.get("roles")));
            }
            if (body.get("authList") instanceof List) {
                menu.setAuthList(objectMapper.writeValueAsString(body.get("authList")));
            }
        } catch (Exception ignored) {
            // ignore
        }
    }
}
