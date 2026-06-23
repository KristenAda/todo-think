package com.todothink.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.upload")
public class UploadProperties {

    /** 上传根目录绝对路径，默认 ./uploads */
    private String root = "./uploads";

    /** 单文件最大字节数，默认 100MB */
    private long maxFileBytes = 100L * 1024 * 1024;

    /** 分片会话 TTL（小时），默认 24 */
    private int sessionTtlHours = 24;

    public static final int MIN_CHUNK_BYTES = 256 * 1024;
    public static final int MAX_CHUNK_BYTES = 10 * 1024 * 1024;
    public static final String CHUNK_SUBDIR = "_chunks";

    public long getSessionTtlMs() {
        return sessionTtlHours * 60L * 60 * 1000;
    }
}
