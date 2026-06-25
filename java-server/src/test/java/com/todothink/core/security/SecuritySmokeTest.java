package com.todothink.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class SecuritySmokeTest {

    @Test
    void shouldReturnUnified401WhenMissingToken() throws Exception {
        SecurityErrorWriter writer = new SecurityErrorWriter(new ObjectMapper());
        MockHttpServletResponse response = new MockHttpServletResponse();

        writer.writeUnauthorized(response);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("\"code\":401");
        assertThat(response.getContentAsString()).contains("\"message\":\"身份验证失败\"");
    }
}
