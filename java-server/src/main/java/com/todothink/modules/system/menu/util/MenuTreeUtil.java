package com.todothink.modules.system.menu.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.modules.system.entity.Menu;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class MenuTreeUtil {

    private MenuTreeUtil() {
    }

    public static List<Map<String, Object>> listToTree(List<Menu> list, Integer parentId) {
        List<Map<String, Object>> tree = new ArrayList<Map<String, Object>>();
        for (Menu item : list) {
            Integer pid = item.getParentId();
            boolean match = (parentId == null && pid == null) || (parentId != null && parentId.equals(pid));
            if (match) {
                Map<String, Object> node = new HashMap<String, Object>();
                node.put("menu", item);
                List<Map<String, Object>> children = listToTree(list, item.getId());
                if (!children.isEmpty()) {
                    node.put("children", children);
                }
                tree.add(node);
            }
        }
        return tree;
    }

    public static List<Map<String, Object>> transformToFrontendFormat(List<Map<String, Object>> nodes,
            ObjectMapper objectMapper) {
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> node : nodes) {
            Menu menu = (Menu) node.get("menu");
            Map<String, Object> meta = new HashMap<String, Object>();
            meta.put("title", menu.getTitle());
            meta.put("icon", menu.getIcon());
            meta.put("sort", menu.getSort());
            meta.put("isEnable", menu.getIsEnable());
            meta.put("keepAlive", menu.getKeepAlive());
            meta.put("isIframe", menu.getIsIframe());
            meta.put("isHide", menu.getIsHide());
            meta.put("isHideTab", menu.getIsHideTab());
            meta.put("link", menu.getLink());
            meta.put("showBadge", menu.getShowBadge());
            meta.put("showTextBadge", menu.getShowTextBadge());
            meta.put("fixedTab", menu.getFixedTab());
            meta.put("activePath", menu.getActivePath());
            meta.put("isFullPage", menu.getIsFullPage());
            meta.put("roles", parseJsonArray(menu.getRoles(), objectMapper));
            meta.put("authList", parseJsonArray(menu.getAuthList(), objectMapper));

            Map<String, Object> item = new HashMap<String, Object>();
            item.put("id", menu.getId());
            item.put("parentId", menu.getParentId());
            item.put("name", menu.getName());
            item.put("path", menu.getPath());
            item.put("component", menu.getComponent());
            item.put("meta", meta);
            if (node.containsKey("children")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> children = (List<Map<String, Object>>) node.get("children");
                item.put("children", transformToFrontendFormat(children, objectMapper));
            }
            result.add(item);
        }
        return result;
    }

    private static Object parseJsonArray(String json, ObjectMapper objectMapper) {
        if (json == null) {
            return new ArrayList<Object>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Object>>() {
            });
        } catch (Exception e) {
            return new ArrayList<Object>();
        }
    }
}
