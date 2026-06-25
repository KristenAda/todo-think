package com.todothink.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.result.Result;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LoginRateLimitFilterTest {

    @Test
    void shouldRejectAfterMaxAttemptsInWindow() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(new ObjectMapper());
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new LoginController())
                .addFilters(filter)
                .build();

        for (int i = 0; i < LoginRateLimitFilter.MAX_ATTEMPTS; i++) {
            mockMvc.perform(post("/auth/login"))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/auth/login"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(429))
                .andExpect(jsonPath("$.message").value("登录尝试过于频繁，请 15 分钟后再试"));
    }

    @RestController
    static class LoginController {

        @PostMapping("/auth/login")
        public Result<Void> login() {
            return Result.success();
        }
    }
}
