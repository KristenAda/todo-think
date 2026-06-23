package com.todothink.core.ws;

import com.todothink.core.auth.AuthUtil;
import io.jsonwebtoken.Claims;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * WebSocket 握手鉴权：从 query 参数 token 解析 userId。
 */
@Component
public class WsAuthHandshakeInterceptor implements HandshakeInterceptor {

    private final AuthUtil authUtil;

    public WsAuthHandshakeInterceptor(AuthUtil authUtil) {
        this.authUtil = authUtil;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest)) {
            return false;
        }
        String token = ((ServletServerHttpRequest) request).getServletRequest().getParameter("token");
        if (!StringUtils.hasText(token)) {
            return false;
        }
        try {
            Claims claims = authUtil.parseToken(token);
            Object idClaim = claims.get("id");
            if (idClaim == null) {
                return false;
            }
            int userId;
            if (idClaim instanceof Number) {
                userId = ((Number) idClaim).intValue();
            } else {
                userId = Integer.parseInt(String.valueOf(idClaim));
            }
            if (userId <= 0) {
                return false;
            }
            attributes.put("userId", userId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }
}
