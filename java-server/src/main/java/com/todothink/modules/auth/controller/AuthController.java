package com.todothink.modules.auth.controller;

import com.todothink.core.result.Result;
import com.todothink.core.security.SecurityUtils;
import com.todothink.modules.auth.dto.LoginRequest;
import com.todothink.modules.auth.dto.RegisterRequest;
import com.todothink.modules.auth.service.AuthService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Validated @RequestBody LoginRequest request) {
        Map<String, Object> data = authService.login(request.getUserName(), request.getPassword());
        return Result.success(data, "登录成功");
    }

    @PostMapping("/register")
    public Result<Object> register(@Validated @RequestBody RegisterRequest request) {
        return Result.success(authService.register(request), "注册成功");
    }

    @GetMapping("/info")
    public Result<Map<String, Object>> info() {
        Integer userId = SecurityUtils.currentUserId();
        return Result.success(authService.getUserInfo(userId));
    }
}
