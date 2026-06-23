package com.todothink.modules.message.controller;

import com.todothink.core.result.Result;
import com.todothink.core.security.SecurityUtils;
import com.todothink.modules.message.dto.SendMessageRequest;
import com.todothink.modules.message.service.MessageService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping(value = {"", "/"})
    public Result<?> page(@RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String isRead,
            @RequestParam(required = false) String messageType) {
        Boolean readFilter = null;
        if ("true".equalsIgnoreCase(isRead)) {
            readFilter = true;
        } else if ("false".equalsIgnoreCase(isRead)) {
            readFilter = false;
        }
        Map<String, Object> res = messageService.page(page, pageSize, readFilter, messageType,
                SecurityUtils.currentUserId());
        return Result.page((List<?>) res.get("list"), (Long) res.get("total"), page, pageSize);
    }

    @GetMapping("/unread-count")
    public Result<?> unreadCount() {
        return Result.success(messageService.unreadCount(SecurityUtils.currentUserId()));
    }

    @PostMapping("/{id}/read")
    public Result<?> markRead(@PathVariable Integer id) {
        boolean ok = messageService.markRead(id, SecurityUtils.currentUserId());
        return Result.success(ok, ok ? "已读" : "消息不存在或已读");
    }

    @PostMapping("/read-all")
    public Result<?> markAllRead() {
        int count = messageService.markAllRead(SecurityUtils.currentUserId());
        return Result.success(count, "已全部标记已读");
    }

    @PostMapping(value = {"", "/"})
    public Result<?> send(@Validated @RequestBody SendMessageRequest body) {
        Map<String, Object> created = messageService.sendRealTimeMessage(body, SecurityUtils.currentUserId());
        return Result.success(created, "发送成功");
    }
}
