package com.todothink.core.auth;

import com.todothink.core.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 对齐 Node server/src/core/auth.util.ts
 */
@Component
public class AuthUtil {

    private final AppProperties appProperties;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

    public AuthUtil(AppProperties appProperties) {
        this.appProperties = appProperties;
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
}
