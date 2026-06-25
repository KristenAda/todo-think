package com.todothink.core.auth;

import com.todothink.core.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 对齐 Node server/src/core/auth.util.ts
 */
@Component
public class AuthUtil {

    private static final Logger log = LoggerFactory.getLogger(AuthUtil.class);

    private final AppProperties appProperties;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    public AuthUtil(AppProperties appProperties, PasswordEncoder passwordEncoder, Environment environment) {
        this.appProperties = appProperties;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @PostConstruct
    public void validateJwtSecret() {
        String secret = appProperties.getSecret();
        int length = secret == null ? 0 : secret.getBytes(StandardCharsets.UTF_8).length;
        if (length < 32) {
            throw new IllegalStateException("APP_JWT_SECRET must be at least 32 bytes for HS256");
        }

        if (isWeakSecret(secret)) {
            if (isProdProfile()) {
                throw new IllegalStateException("APP_JWT_SECRET is weak and cannot be used in prod profile");
            }
            log.warn("[security] 当前 JWT secret 为开发占位值，请在生产环境通过 APP_JWT_SECRET 配置强密钥");
        }
    }

    public String sha256(String plain) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(plain.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 failed", e);
        }
    }

    public String hashPassword(String pwd) {
        return passwordEncoder.encode(pwd);
    }

    public boolean comparePassword(String raw, String hashed) {
        return passwordEncoder.matches(raw, hashed);
    }

    public String signToken(Integer id, String userName, List<String> roles) {
        Map<String, Object> claims = new HashMap<String, Object>();
        claims.put("id", id);
        claims.put("userName", userName);
        claims.put("roles", roles);
        long now = System.currentTimeMillis();
        long exp = now + appProperties.getExpirationHours() * 3600L * 1000L;
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(exp))
                .signWith(Keys.hmacShaKeyFor(appProperties.getSecret().getBytes(StandardCharsets.UTF_8)),
                        SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(appProperties.getSecret().getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private boolean isWeakSecret(String secret) {
        if (secret == null) {
            return true;
        }
        String normalized = secret.toLowerCase();
        return normalized.contains("change")
                || normalized.contains("fallback")
                || normalized.contains("please-set")
                || normalized.contains("dev-secret");
    }

    private boolean isProdProfile() {
        return Arrays.asList(environment.getActiveProfiles()).contains("prod");
    }
}
