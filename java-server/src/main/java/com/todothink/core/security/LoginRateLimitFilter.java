package com.todothink.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.result.Result;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 登录限流：同一 IP 每 15 分钟最多尝试 10 次，对齐 Node loginRateLimit。
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 30)
public class LoginRateLimitFilter extends OncePerRequestFilter {

    static final int MAX_ATTEMPTS = 10;
    static final long WINDOW_MS = 15 * 60 * 1000L;

    private final ObjectMapper objectMapper;
    private final Map<String, LoginAttemptBucket> attempts = new ConcurrentHashMap<String, LoginAttemptBucket>();

    public LoginRateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !("POST".equalsIgnoreCase(request.getMethod()) && "/auth/login".equals(request.getRequestURI()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String ip = clientIp(request);
        if (!tryAcquire(ip)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(
                    Result.error("登录尝试过于频繁，请 15 分钟后再试", 429)));
            return;
        }
        filterChain.doFilter(request, response);
    }

    boolean tryAcquire(String ip) {
        long now = System.currentTimeMillis();
        cleanupExpired(now);
        synchronized (attempts) {
            LoginAttemptBucket bucket = attempts.get(ip);
            if (bucket == null || now - bucket.windowStartMs >= WINDOW_MS) {
                attempts.put(ip, new LoginAttemptBucket(now, 1));
                return true;
            }
            if (bucket.count >= MAX_ATTEMPTS) {
                return false;
            }
            bucket.count += 1;
            return true;
        }
    }

    private void cleanupExpired(long now) {
        synchronized (attempts) {
            Iterator<Map.Entry<String, LoginAttemptBucket>> iterator = attempts.entrySet().iterator();
            while (iterator.hasNext()) {
                Map.Entry<String, LoginAttemptBucket> entry = iterator.next();
                if (now - entry.getValue().windowStartMs >= WINDOW_MS) {
                    iterator.remove();
                }
            }
        }
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && forwardedFor.trim().length() > 0) {
            int commaIndex = forwardedFor.indexOf(',');
            return commaIndex >= 0 ? forwardedFor.substring(0, commaIndex).trim() : forwardedFor.trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && realIp.trim().length() > 0) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private static class LoginAttemptBucket {
        private final long windowStartMs;
        private int count;

        private LoginAttemptBucket(long windowStartMs, int count) {
            this.windowStartMs = windowStartMs;
            this.count = count;
        }
    }
}
