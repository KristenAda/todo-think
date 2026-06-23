package com.todothink.core.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket 连接中心：维护 userId -> WebSocketSession 映射，统一推送与连接回收。
 */
@Component
public class WsHub {

    private static final Logger log = LoggerFactory.getLogger(WsHub.class);

    private final ConcurrentHashMap<Integer, WebSocketSession> onlineWsByUserId = new ConcurrentHashMap<Integer, WebSocketSession>();
    private final ObjectMapper objectMapper;

    public WsHub(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void bindUserSocket(int userId, WebSocketSession session) {
        WebSocketSession old = onlineWsByUserId.get(userId);
        if (old != null && old != session && old.isOpen()) {
            try {
                old.close(CloseStatus.NORMAL.withReason("Replaced by new connection"));
            } catch (Exception e) {
                log.debug("close old ws failed userId={}", userId, e);
            }
        }
        onlineWsByUserId.put(userId, session);
    }

    public void unbindUserSocket(int userId, WebSocketSession session) {
        WebSocketSession current = onlineWsByUserId.get(userId);
        if (current == session) {
            onlineWsByUserId.remove(userId);
        }
    }

    public boolean isUserOnline(int userId) {
        return onlineWsByUserId.containsKey(userId);
    }

    public boolean pushJsonToUser(int userId, Map<String, Object> payload) {
        WebSocketSession session = onlineWsByUserId.get(userId);
        if (session == null || !session.isOpen()) {
            return false;
        }
        try {
            String json = objectMapper.writeValueAsString(payload);
            synchronized (session) {
                session.sendMessage(new TextMessage(json));
            }
            return true;
        } catch (Exception e) {
            log.debug("push ws failed userId={}", userId, e);
            return false;
        }
    }
}
