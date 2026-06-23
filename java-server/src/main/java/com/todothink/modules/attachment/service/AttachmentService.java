package com.todothink.modules.attachment.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.todothink.core.config.UploadProperties;
import com.todothink.core.exception.BusinessException;
import com.todothink.core.upload.UploadPathHelper;
import com.todothink.modules.attachment.dto.InitUploadRequest;
import com.todothink.modules.attachment.entity.Attachment;
import com.todothink.modules.attachment.entity.UploadSession;
import com.todothink.modules.attachment.mapper.AttachmentMapper;
import com.todothink.modules.attachment.mapper.UploadSessionMapper;
import com.todothink.modules.system.entity.User;
import com.todothink.modules.system.mapper.UserMapper;
import com.todothink.modules.task.entity.TaskAttachment;
import com.todothink.modules.task.mapper.TaskAttachmentMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AttachmentService {

    private static final Pattern PART_NAME = Pattern.compile("^\\d+\\.part$");

    private final AttachmentMapper attachmentMapper;
    private final UploadSessionMapper uploadSessionMapper;
    private final UserMapper userMapper;
    private final UploadPathHelper uploadPathHelper;
    private final UploadProperties uploadProperties;
    private final TaskAttachmentMapper taskAttachmentMapper;

    public AttachmentService(AttachmentMapper attachmentMapper, UploadSessionMapper uploadSessionMapper,
            UserMapper userMapper, UploadPathHelper uploadPathHelper, UploadProperties uploadProperties,
            TaskAttachmentMapper taskAttachmentMapper) {
        this.attachmentMapper = attachmentMapper;
        this.uploadSessionMapper = uploadSessionMapper;
        this.userMapper = userMapper;
        this.uploadPathHelper = uploadPathHelper;
        this.uploadProperties = uploadProperties;
        this.taskAttachmentMapper = taskAttachmentMapper;
    }

    @PostConstruct
    public void init() throws IOException {
        uploadPathHelper.ensureUploadDirs();
    }

    public Map<String, Object> initUpload(int userId, InitUploadRequest input) throws IOException {
        int totalSize = input.getTotalSize();
        int chunkSize = input.getChunkSize();
        if (totalSize <= 0 || totalSize > uploadProperties.getMaxFileBytes()) {
            throw new BusinessException("文件大小须在 1 ~ " + uploadProperties.getMaxFileBytes() + " 字节之间");
        }
        if (chunkSize < UploadProperties.MIN_CHUNK_BYTES || chunkSize > UploadProperties.MAX_CHUNK_BYTES) {
            throw new BusinessException("分片大小须在 " + UploadProperties.MIN_CHUNK_BYTES + " ~ "
                    + UploadProperties.MAX_CHUNK_BYTES + " 字节之间");
        }
        int totalChunks = (int) Math.ceil(totalSize * 1.0 / chunkSize);
        if (totalChunks > 10000) {
            throw new BusinessException("分片数量过多，请增大分片大小");
        }

        String safe = UploadPathHelper.sanitizeFileName(input.getFileName());
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(uploadProperties.getSessionTtlMs() / 1000);

        UploadSession session = new UploadSession();
        session.setId(UUID.randomUUID().toString());
        session.setFileName(safe);
        session.setMimeType(input.getMimeType());
        session.setTotalSize(totalSize);
        session.setChunkSize(chunkSize);
        session.setTotalChunks(totalChunks);
        session.setUserId(userId);
        session.setStatus("pending");
        session.setExpiresAt(expiresAt);
        uploadSessionMapper.insert(session);

        Path dir = uploadPathHelper.chunkSessionDir(session.getId());
        Files.createDirectories(dir);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("uploadId", session.getId());
        result.put("totalChunks", totalChunks);
        result.put("chunkSize", chunkSize);
        result.put("expiresAt", expiresAt.atZone(ZoneId.systemDefault()).toInstant().toString());
        return result;
    }

    public Map<String, Object> saveChunk(int userId, String uploadId, int chunkIndex, Path tempFile)
            throws IOException {
        UploadSession session = requireSession(uploadId);
        assertSessionOwner(session, userId);
        assertSessionPending(session);

        if (chunkIndex < 0 || chunkIndex >= session.getTotalChunks()) {
            throw new BusinessException("分片序号无效");
        }

        Path destDir = uploadPathHelper.chunkSessionDir(uploadId);
        uploadPathHelper.assertUnderRoot(destDir);
        Path destPath = destDir.resolve(chunkIndex + ".part");
        uploadPathHelper.assertUnderRoot(destPath);

        long fileSize = Files.size(tempFile);
        long expectedLen = chunkIndex == session.getTotalChunks() - 1
                ? session.getTotalSize() - (long) chunkIndex * session.getChunkSize()
                : session.getChunkSize();
        if (fileSize != expectedLen) {
            Files.deleteIfExists(tempFile);
            throw new BusinessException("分片大小与预期不符");
        }

        moveFile(tempFile, destPath);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("ok", true);
        result.put("chunkIndex", chunkIndex);
        return result;
    }

    public Map<String, Object> getUploadStatus(int userId, String uploadId) throws IOException {
        UploadSession session = requireSession(uploadId);
        if (!session.getUserId().equals(userId)) {
            throw new BusinessException("无权查看该上传会话", 403);
        }

        List<Integer> uploaded = listUploadedChunks(uploadId);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("uploadId", uploadId);
        result.put("totalChunks", session.getTotalChunks());
        result.put("chunkSize", session.getChunkSize());
        result.put("totalSize", session.getTotalSize());
        result.put("status", session.getStatus());
        result.put("uploadedChunkIndexes", uploaded);
        result.put("expiresAt", session.getExpiresAt().atZone(ZoneId.systemDefault()).toInstant().toString());
        return result;
    }

    @Transactional
    public Map<String, Object> mergeUpload(int userId, String uploadId) throws IOException {
        UploadSession session = requireSession(uploadId);
        assertSessionOwner(session, userId);

        if ("merged".equals(session.getStatus()) && session.getAttachmentId() != null) {
            Attachment att = attachmentMapper.selectById(session.getAttachmentId());
            if (att != null) {
                return attachmentResult(att);
            }
        }
        assertSessionPending(session);

        Path dir = uploadPathHelper.chunkSessionDir(uploadId);
        for (int i = 0; i < session.getTotalChunks(); i++) {
            if (!Files.exists(dir.resolve(i + ".part"))) {
                throw new BusinessException("缺少分片 " + i + "，请续传后重试");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        String relDir = String.format("attachments/%d/%02d", now.getYear(), now.getMonthValue());
        Path absDir = uploadPathHelper.uploadRoot().resolve(relDir.replace("/", java.io.File.separator));
        Files.createDirectories(absDir);

        String finalName = UUID.randomUUID().toString() + "_" + session.getFileName();
        Path absFinal = absDir.resolve(finalName);
        uploadPathHelper.assertUnderRoot(absFinal);

        try {
            for (int i = 0; i < session.getTotalChunks(); i++) {
                Path chunkPath = dir.resolve(i + ".part");
                byte[] buf = Files.readAllBytes(chunkPath);
                Files.write(absFinal, buf, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
            }
        } catch (IOException e) {
            Files.deleteIfExists(absFinal);
            throw e;
        }

        long mergedSize = Files.size(absFinal);
        if (mergedSize != session.getTotalSize()) {
            Files.deleteIfExists(absFinal);
            throw new BusinessException("合并后大小与声明不一致");
        }

        String storedPath = relDir + "/" + finalName;

        Attachment att = new Attachment();
        att.setOriginalName(session.getFileName());
        att.setStoredPath(storedPath);
        att.setMimeType(session.getMimeType());
        att.setSize(session.getTotalSize());
        att.setUploadedById(userId);
        attachmentMapper.insert(att);

        UploadSession update = new UploadSession();
        update.setId(uploadId);
        update.setStatus("merged");
        update.setAttachmentId(att.getId());
        uploadSessionMapper.updateById(update);

        deleteDirectoryQuietly(dir);

        return attachmentResult(att);
    }

    public Attachment requireAttachment(int id) {
        Attachment att = attachmentMapper.selectOne(new LambdaQueryWrapper<Attachment>()
                .eq(Attachment::getId, id)
                .isNull(Attachment::getDeletedAt));
        if (att == null) {
            throw new BusinessException("附件不存在", 404);
        }
        return att;
    }

    /** 校验附件存在且由当前用户上传 */
    public void assertAttachmentsOwnedByUser(List<Integer> attachmentIds, Integer userId) {
        if (attachmentIds == null || attachmentIds.isEmpty()) {
            return;
        }
        Set<Integer> uniq = new LinkedHashSet<Integer>(attachmentIds);
        List<Attachment> rows = attachmentMapper.selectList(new LambdaQueryWrapper<Attachment>()
                .in(Attachment::getId, uniq)
                .isNull(Attachment::getDeletedAt)
                .select(Attachment::getId, Attachment::getUploadedById));
        if (rows.size() != uniq.size()) {
            throw new BusinessException("部分附件不存在或已删除");
        }
        for (Attachment row : rows) {
            if (!row.getUploadedById().equals(userId)) {
                throw new BusinessException("仅能关联本人上传的附件", 403);
            }
        }
    }

    /** 编辑任务：可保留他人已挂在本任务上的附件；新加的须为本人上传 */
    public void assertAttachmentsAllowedForTaskEdit(List<Integer> attachmentIds, Integer taskId, Integer userId) {
        if (attachmentIds == null || attachmentIds.isEmpty()) {
            return;
        }
        Set<Integer> uniq = new LinkedHashSet<Integer>(attachmentIds);
        List<Attachment> rows = attachmentMapper.selectList(new LambdaQueryWrapper<Attachment>()
                .in(Attachment::getId, uniq)
                .isNull(Attachment::getDeletedAt)
                .select(Attachment::getId, Attachment::getUploadedById));
        if (rows.size() != uniq.size()) {
            throw new BusinessException("部分附件不存在或已删除");
        }
        List<TaskAttachment> alreadyOnTask = taskAttachmentMapper.selectList(
                new LambdaQueryWrapper<TaskAttachment>()
                        .eq(TaskAttachment::getTaskId, taskId)
                        .in(TaskAttachment::getAttachmentId, uniq)
                        .select(TaskAttachment::getAttachmentId));
        Set<Integer> onTask = new HashSet<Integer>();
        for (TaskAttachment ta : alreadyOnTask) {
            onTask.add(ta.getAttachmentId());
        }
        for (Attachment row : rows) {
            if (row.getUploadedById().equals(userId)) {
                continue;
            }
            if (onTask.contains(row.getId())) {
                continue;
            }
            throw new BusinessException("无权关联该附件", 403);
        }
    }

    public Map<String, Object> toAttachmentPublic(Attachment att) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", att.getId());
        map.put("originalName", att.getOriginalName());
        map.put("mimeType", att.getMimeType());
        map.put("size", att.getSize());
        map.put("createTime", att.getCreateTime());
        return map;
    }

    public Path getDownloadPath(Attachment att) {
        Path abs = uploadPathHelper.resolveStoredPath(att.getStoredPath());
        if (!Files.exists(abs)) {
            throw new BusinessException("文件已丢失", 404);
        }
        return abs;
    }

    public Map<String, Object> page(int userId, int page, int pageSize, String keyword, boolean listAll) {
        LambdaQueryWrapper<Attachment> wrapper = new LambdaQueryWrapper<Attachment>()
                .isNull(Attachment::getDeletedAt)
                .orderByDesc(Attachment::getCreateTime);
        if (!listAll) {
            wrapper.eq(Attachment::getUploadedById, userId);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Attachment::getOriginalName, keyword.trim());
        }

        Page<Attachment> pageResult = attachmentMapper.selectPage(new Page<Attachment>(page, pageSize), wrapper);
        List<Map<String, Object>> list = pageResult.getRecords().stream()
                .map(this::toAttachmentVo)
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("list", list);
        result.put("total", pageResult.getTotal());
        return result;
    }

    public void softDelete(int id, int userId, boolean isAdmin) throws IOException {
        Attachment att = requireAttachment(id);
        if (!isAdmin && !att.getUploadedById().equals(userId)) {
            throw new BusinessException("无权删除该附件", 403);
        }
        Attachment update = new Attachment();
        update.setId(id);
        update.setDeletedAt(LocalDateTime.now());
        attachmentMapper.updateById(update);
        try {
            Files.deleteIfExists(uploadPathHelper.resolveStoredPath(att.getStoredPath()));
        } catch (Exception ignored) {
            // ignore
        }
    }

    private Map<String, Object> toAttachmentVo(Attachment att) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", att.getId());
        map.put("originalName", att.getOriginalName());
        map.put("storedPath", att.getStoredPath());
        map.put("mimeType", att.getMimeType());
        map.put("size", att.getSize());
        map.put("uploadedById", att.getUploadedById());
        map.put("createTime", att.getCreateTime());
        map.put("deletedAt", att.getDeletedAt());

        User uploader = userMapper.selectById(att.getUploadedById());
        if (uploader != null) {
            Map<String, Object> uploadedBy = new HashMap<String, Object>();
            uploadedBy.put("id", uploader.getId());
            uploadedBy.put("userName", uploader.getUserName());
            uploadedBy.put("nickName", uploader.getNickName());
            map.put("uploadedBy", uploadedBy);
        }
        return map;
    }

    private Map<String, Object> attachmentResult(Attachment att) {
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("attachmentId", att.getId());
        result.put("storedPath", att.getStoredPath());
        result.put("originalName", att.getOriginalName());
        result.put("size", att.getSize());
        return result;
    }

    private UploadSession requireSession(String uploadId) {
        UploadSession session = uploadSessionMapper.selectById(uploadId);
        if (session == null) {
            throw new BusinessException("上传会话不存在", 404);
        }
        return session;
    }

    private void assertSessionOwner(UploadSession session, int userId) {
        if (!session.getUserId().equals(userId)) {
            throw new BusinessException("无权操作该上传会话", 403);
        }
    }

    private void assertSessionPending(UploadSession session) {
        if (!"pending".equals(session.getStatus())) {
            if ("merged".equals(session.getStatus())) {
                throw new BusinessException("上传会话已结束");
            }
            throw new BusinessException("上传会话无法合并");
        }
        if (LocalDateTime.now().isAfter(session.getExpiresAt())) {
            throw new BusinessException("上传会话已过期，请重新发起");
        }
    }

    private List<Integer> listUploadedChunks(String uploadId) throws IOException {
        Path dir = uploadPathHelper.chunkSessionDir(uploadId);
        if (!Files.isDirectory(dir)) {
            return Collections.emptyList();
        }
        List<Integer> uploaded = new ArrayList<Integer>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            for (Path p : stream) {
                String name = p.getFileName().toString();
                if (PART_NAME.matcher(name).matches()) {
                    uploaded.add(Integer.parseInt(name.replace(".part", "")));
                }
            }
        }
        Collections.sort(uploaded);
        return uploaded;
    }

    private void moveFile(Path src, Path dest) throws IOException {
        try {
            Files.move(src, dest, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
            Files.deleteIfExists(src);
        }
    }

    private void deleteDirectoryQuietly(Path dir) {
        try {
            if (Files.isDirectory(dir)) {
                try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
                    for (Path p : stream) {
                        Files.deleteIfExists(p);
                    }
                }
                Files.deleteIfExists(dir);
            }
        } catch (IOException ignored) {
            // ignore
        }
    }
}
