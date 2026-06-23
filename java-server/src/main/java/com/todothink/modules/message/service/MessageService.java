package com.todothink.modules.message.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.core.ws.WsHub;
import com.todothink.modules.message.dto.SendMessageRequest;
import com.todothink.modules.message.entity.Message;
import com.todothink.modules.message.mapper.MessageMapper;
import com.todothink.modules.system.entity.User;
import com.todothink.modules.system.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final MessageMapper messageMapper;
    private final UserMapper userMapper;
    private final WsHub wsHub;
    private final ObjectMapper objectMapper;

    public MessageService(MessageMapper messageMapper, UserMapper userMapper, WsHub wsHub,
            ObjectMapper objectMapper) {
        this.messageMapper = messageMapper;
        this.userMapper = userMapper;
        this.wsHub = wsHub;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> sendRealTimeMessage(SendMessageRequest dto, Integer senderId) {
        Message msg = new Message();
        msg.setTitle(dto.getTitle());
        msg.setContent(dto.getContent());
        msg.setReceiverId(dto.getReceiverId());
        msg.setSenderId(senderId);
        msg.setMessageType(StringUtils.hasText(dto.getMessageType()) ? dto.getMessageType() : "SYSTEM");
        msg.setIsRead(false);
        if (dto.getExtra() != null) {
            try {
                msg.setExtra(objectMapper.writeValueAsString(dto.getExtra()));
            } catch (Exception e) {
                msg.setExtra(String.valueOf(dto.getExtra()));
            }
        }
        messageMapper.insert(msg);

        Map<String, Object> created = toMessageVo(msg);
        Map<String, Object> payload = new HashMap<String, Object>();
        payload.put("event", "message");
        payload.put("data", created);
        wsHub.pushJsonToUser(dto.getReceiverId(), payload);
        return created;
    }

    public Map<String, Object> page(int page, int pageSize, Boolean isRead, String messageType, int receiverId) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<Message>()
                .eq(Message::getReceiverId, receiverId)
                .isNull(Message::getDeletedAt)
                .orderByDesc(Message::getCreateTime);
        if (isRead != null) {
            wrapper.eq(Message::getIsRead, isRead);
        }
        if (StringUtils.hasText(messageType)) {
            wrapper.eq(Message::getMessageType, messageType);
        }

        Page<Message> pageResult = messageMapper.selectPage(new Page<Message>(page, pageSize), wrapper);
        List<Map<String, Object>> list = pageResult.getRecords().stream()
                .map(this::toMessageVo)
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("list", list);
        result.put("total", pageResult.getTotal());
        return result;
    }

    public long unreadCount(int receiverId) {
        return messageMapper.selectCount(new LambdaQueryWrapper<Message>()
                .eq(Message::getReceiverId, receiverId)
                .eq(Message::getIsRead, false)
                .isNull(Message::getDeletedAt));
    }

    public boolean markRead(int id, int receiverId) {
        LocalDateTime now = LocalDateTime.now();
        int updated = messageMapper.update(null, new LambdaUpdateWrapper<Message>()
                .eq(Message::getId, id)
                .eq(Message::getReceiverId, receiverId)
                .isNull(Message::getDeletedAt)
                .eq(Message::getIsRead, false)
                .set(Message::getIsRead, true)
                .set(Message::getReadTime, now));
        return updated > 0;
    }

    public int markAllRead(int receiverId) {
        LocalDateTime now = LocalDateTime.now();
        return messageMapper.update(null, new LambdaUpdateWrapper<Message>()
                .eq(Message::getReceiverId, receiverId)
                .isNull(Message::getDeletedAt)
                .eq(Message::getIsRead, false)
                .set(Message::getIsRead, true)
                .set(Message::getReadTime, now));
    }

    private Map<String, Object> toMessageVo(Message msg) {
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("id", msg.getId());
        map.put("title", msg.getTitle());
        map.put("content", msg.getContent());
        map.put("messageType", msg.getMessageType());
        map.put("senderId", msg.getSenderId());
        map.put("receiverId", msg.getReceiverId());
        map.put("isRead", msg.getIsRead());
        map.put("readTime", msg.getReadTime());
        map.put("extra", msg.getExtra());
        map.put("createTime", msg.getCreateTime());
        map.put("updateTime", msg.getUpdateTime());
        map.put("deletedAt", msg.getDeletedAt());

        if (msg.getSenderId() != null) {
            User sender = userMapper.selectById(msg.getSenderId());
            if (sender != null) {
                Map<String, Object> senderVo = new HashMap<String, Object>();
                senderVo.put("id", sender.getId());
                senderVo.put("userName", sender.getUserName());
                senderVo.put("nickName", sender.getNickName());
                senderVo.put("avatar", sender.getAvatar());
                map.put("sender", senderVo);
            }
        }
        return map;
    }
}
