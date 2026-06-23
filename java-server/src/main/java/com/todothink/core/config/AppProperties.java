package com.todothink.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class AppProperties {

    private String secret = "dev-fallback-secret-please-set-env";
    private int expirationHours = 24;
}
