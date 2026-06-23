package com.todothink.modules.attachment.controller;

import com.todothink.core.exception.BusinessException;
import com.todothink.core.result.Result;
import com.todothink.core.security.SecurityUtils;
import com.todothink.core.util.RoleUtil;
import com.todothink.modules.attachment.dto.InitUploadRequest;
import com.todothink.modules.attachment.dto.MergeUploadRequest;
import com.todothink.modules.attachment.entity.Attachment;
import com.todothink.modules.attachment.service.AttachmentService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping("/upload/init")
    public Result<?> init(@Validated @RequestBody InitUploadRequest body) throws IOException {
        return Result.success(attachmentService.initUpload(SecurityUtils.currentUserId(), body));
    }

    @PostMapping("/upload/chunk")
    public Result<?> uploadChunk(@RequestParam String uploadId, @RequestParam Integer chunkIndex,
            @RequestParam("file") MultipartFile file) throws IOException {
        if (!org.springframework.util.StringUtils.hasText(uploadId) || chunkIndex == null || file == null
                || file.isEmpty()) {
            return Result.error("请提供 uploadId、chunkIndex 与文件字段 file", 400);
        }
        Path temp = Files.createTempFile("chunk-", ".part");
        try {
            file.transferTo(temp.toFile());
            return Result.success(attachmentService.saveChunk(SecurityUtils.currentUserId(), uploadId, chunkIndex,
                    temp));
        } catch (BusinessException e) {
            throw e;
        } finally {
            Files.deleteIfExists(temp);
        }
    }

    @GetMapping("/upload/{uploadId}/status")
    public Result<?> status(@PathVariable String uploadId) throws IOException {
        return Result.success(attachmentService.getUploadStatus(SecurityUtils.currentUserId(), uploadId));
    }

    @PostMapping("/upload/merge")
    public Result<?> merge(@Validated @RequestBody MergeUploadRequest body) throws IOException {
        return Result.success(attachmentService.mergeUpload(SecurityUtils.currentUserId(), body.getUploadId()));
    }

    @GetMapping(value = {"", "/"})
    public Result<?> page(@RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String keyword) {
        boolean listAll = RoleUtil.isSuperAdminRoles(SecurityUtils.currentUser().getRoles());
        Map<String, Object> res = attachmentService.page(SecurityUtils.currentUserId(), page, pageSize, keyword,
                listAll);
        return Result.page((List<?>) res.get("list"), (Long) res.get("total"), page, pageSize);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable Integer id) throws IOException {
        Attachment att = attachmentService.requireAttachment(id);
        Path path = attachmentService.getDownloadPath(att);
        InputStream in = Files.newInputStream(path);
        String encoded = URLEncoder.encode(att.getOriginalName(), StandardCharsets.UTF_8.name())
                .replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
                .contentType(MediaType.parseMediaType(
                        att.getMimeType() != null ? att.getMimeType() : "application/octet-stream"))
                .body(new InputStreamResource(in));
    }

    @DeleteMapping("/{id}")
    public Result<?> remove(@PathVariable Integer id) throws IOException {
        boolean isAdmin = RoleUtil.isSuperAdminRoles(SecurityUtils.currentUser().getRoles());
        attachmentService.softDelete(id, SecurityUtils.currentUserId(), isAdmin);
        return Result.success(null, "已删除");
    }
}
