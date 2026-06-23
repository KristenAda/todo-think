package com.todothink.core.upload;

import com.todothink.core.config.UploadProperties;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class UploadPathHelper {

    private final UploadProperties uploadProperties;

    public UploadPathHelper(UploadProperties uploadProperties) {
        this.uploadProperties = uploadProperties;
    }

    public Path uploadRoot() {
        return Paths.get(uploadProperties.getRoot()).toAbsolutePath().normalize();
    }

    public void ensureUploadDirs() throws IOException {
        Path root = uploadRoot();
        Files.createDirectories(root);
        Files.createDirectories(root.resolve(UploadProperties.CHUNK_SUBDIR));
    }

    public Path chunkSessionDir(String sessionId) {
        return uploadRoot().resolve(UploadProperties.CHUNK_SUBDIR).resolve(sessionId);
    }

    public Path resolveStoredPath(String storedPath) {
        Path abs = uploadRoot().resolve(storedPath.replace("/", java.io.File.separator)).normalize();
        assertUnderRoot(abs);
        return abs;
    }

    public void assertUnderRoot(Path absPath) {
        Path root = uploadRoot();
        if (!absPath.startsWith(root)) {
            throw new com.todothink.core.exception.BusinessException("非法路径");
        }
    }

    public static String sanitizeFileName(String name) {
        if (name == null || name.isEmpty()) {
            return "file";
        }
        String base = Paths.get(name).getFileName().toString().replace("\\", "").replace("/", "");
        String safe = base.replaceAll("[^a-zA-Z0-9._\\-()\\u4e00-\\u9fff]", "_");
        if (safe.length() > 180) {
            safe = safe.substring(0, 180);
        }
        return safe.isEmpty() ? "file" : safe;
    }
}
