package com.todothink.modules.performance.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.todothink.modules.performance.entity.RuleSet;
import com.todothink.modules.performance.entity.RuleSetVersion;
import com.todothink.modules.performance.mapper.RuleSetMapper;
import com.todothink.modules.performance.mapper.RuleSetVersionMapper;
import com.todothink.modules.performance.support.PerfJson;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RuleSetService {

    private final RuleSetMapper ruleSetMapper;
    private final RuleSetVersionMapper ruleSetVersionMapper;
    private final SettlementService settlementService;
    private final ObjectMapper objectMapper;

    public RuleSetService(RuleSetMapper ruleSetMapper, RuleSetVersionMapper ruleSetVersionMapper,
            SettlementService settlementService, ObjectMapper objectMapper) {
        this.ruleSetMapper = ruleSetMapper;
        this.ruleSetVersionMapper = ruleSetVersionMapper;
        this.settlementService = settlementService;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> listRuleSets(Integer projectId) {
        LambdaQueryWrapper<RuleSet> wrapper = new LambdaQueryWrapper<RuleSet>()
                .eq(RuleSet::getStatus, "ACTIVE")
                .orderByAsc(RuleSet::getScope)
                .orderByDesc(RuleSet::getUpdateTime);
        if (projectId != null) {
            wrapper.and(w -> w.eq(RuleSet::getScope, "GLOBAL")
                    .or(o -> o.eq(RuleSet::getScope, "PROJECT").eq(RuleSet::getProjectId, projectId)));
        }
        List<RuleSet> list = ruleSetMapper.selectList(wrapper);
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (RuleSet ruleSet : list) {
            Map<String, Object> item = toRuleSetMap(ruleSet);
            List<RuleSetVersion> versions = ruleSetVersionMapper.selectList(new LambdaQueryWrapper<RuleSetVersion>()
                    .eq(RuleSetVersion::getRuleSetId, ruleSet.getId())
                    .orderByDesc(RuleSetVersion::getVersion)
                    .last("LIMIT 3"));
            List<Map<String, Object>> versionBriefs = new ArrayList<Map<String, Object>>();
            for (RuleSetVersion version : versions) {
                Map<String, Object> brief = new LinkedHashMap<String, Object>();
                brief.put("id", version.getId());
                brief.put("version", version.getVersion());
                brief.put("publishedAt", version.getPublishedAt());
                brief.put("checksum", version.getChecksum());
                versionBriefs.add(brief);
            }
            item.put("versions", versionBriefs);
            result.add(item);
        }
        return result;
    }

    @Transactional
    public RuleSet createRuleSet(Map<String, Object> body) {
        String code = requiredString(body.get("code"));
        String name = requiredString(body.get("name"));
        String scope = body.get("scope") != null ? String.valueOf(body.get("scope")) : "PROJECT";
        Integer projectId = parsePositiveInt(body.get("projectId"));
        if ("PROJECT".equals(scope) && projectId == null) {
            throw new IllegalArgumentException("projectId 必填（PROJECT 规则集）");
        }
        RuleSet created = new RuleSet();
        created.setCode(code);
        created.setName(name);
        created.setScope(scope);
        created.setProjectId("PROJECT".equals(scope) ? projectId : null);
        created.setStatus("ACTIVE");
        ruleSetMapper.insert(created);
        return created;
    }

    @Transactional
    public RuleSet updateRuleSet(Integer id, Map<String, Object> body) {
        RuleSet existing = ruleSetMapper.selectById(id);
        if (existing == null) {
            throw new IllegalArgumentException("规则集不存在");
        }
        if (body.containsKey("code")) {
            existing.setCode(requiredString(body.get("code")));
        }
        if (body.containsKey("name")) {
            existing.setName(requiredString(body.get("name")));
        }
        if (body.containsKey("scope")) {
            existing.setScope(String.valueOf(body.get("scope")));
        }
        if (body.containsKey("projectId")) {
            existing.setProjectId(parsePositiveInt(body.get("projectId")));
        }
        if ("GLOBAL".equals(existing.getScope())) {
            existing.setProjectId(null);
        }
        if (body.containsKey("status")) {
            existing.setStatus(String.valueOf(body.get("status")));
        }
        ruleSetMapper.updateById(existing);
        return existing;
    }

    @Transactional
    public RuleSet deleteRuleSet(Integer id) {
        RuleSet existing = ruleSetMapper.selectById(id);
        if (existing == null) {
            throw new IllegalArgumentException("规则集不存在");
        }
        existing.setStatus("DISABLED");
        ruleSetMapper.updateById(existing);
        return existing;
    }

    public List<Map<String, Object>> listVersions(Integer ruleSetId) {
        List<RuleSetVersion> list = ruleSetVersionMapper.selectList(new LambdaQueryWrapper<RuleSetVersion>()
                .eq(RuleSetVersion::getRuleSetId, ruleSetId)
                .orderByDesc(RuleSetVersion::getVersion));
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (RuleSetVersion version : list) {
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("id", version.getId());
            item.put("version", version.getVersion());
            item.put("publishedAt", version.getPublishedAt());
            item.put("publishedBy", version.getPublishedBy());
            item.put("effectiveFrom", version.getEffectiveFrom());
            item.put("effectiveTo", version.getEffectiveTo());
            item.put("checksum", version.getChecksum());
            result.add(item);
        }
        return result;
    }

    public Map<String, Object> versionDetail(Integer versionId) {
        RuleSetVersion detail = ruleSetVersionMapper.selectById(versionId);
        if (detail == null) {
            return null;
        }
        Map<String, Object> item = new LinkedHashMap<String, Object>();
        item.put("id", detail.getId());
        item.put("ruleSetId", detail.getRuleSetId());
        item.put("version", detail.getVersion());
        item.put("publishedAt", detail.getPublishedAt());
        item.put("publishedBy", detail.getPublishedBy());
        item.put("effectiveFrom", detail.getEffectiveFrom());
        item.put("effectiveTo", detail.getEffectiveTo());
        item.put("checksum", detail.getChecksum());
        item.put("definition", PerfJson.parseMap(objectMapper, detail.getDefinition()));
        return item;
    }

    @Transactional
    public RuleSetVersion publish(Integer ruleSetId, Map<String, Object> body, Integer userId) {
        Object definition = body.get("definition");
        if (definition == null) {
            throw new IllegalArgumentException("definition 不能为空");
        }
        String defText = PerfJson.write(objectMapper, definition);
        String checksum = sha256(defText);

        RuleSetVersion latest = ruleSetVersionMapper.selectOne(new LambdaQueryWrapper<RuleSetVersion>()
                .eq(RuleSetVersion::getRuleSetId, ruleSetId)
                .orderByDesc(RuleSetVersion::getVersion)
                .last("LIMIT 1"));
        int nextVersion = latest != null && latest.getVersion() != null ? latest.getVersion() + 1 : 1;

        RuleSetVersion created = new RuleSetVersion();
        created.setRuleSetId(ruleSetId);
        created.setVersion(nextVersion);
        created.setPublishedBy(userId);
        created.setChecksum(checksum);
        created.setDefinition(defText);
        created.setEffectiveFrom(parseDateTime(body.get("effectiveFrom")));
        created.setEffectiveTo(parseDateTime(body.get("effectiveTo")));
        ruleSetVersionMapper.insert(created);

        RuleSet update = new RuleSet();
        update.setId(ruleSetId);
        update.setDraftDefinition(null);
        update.setDraftVariables(null);
        update.setDraftUpdatedAt(null);
        ruleSetMapper.updateById(update);
        return created;
    }

    @Transactional
    public RuleSet saveDraft(Integer ruleSetId, Map<String, Object> body) {
        if (!body.containsKey("definition") && !body.containsKey("variables")) {
            throw new IllegalArgumentException("definition 与 variables 至少提供其一");
        }
        RuleSet update = new RuleSet();
        update.setId(ruleSetId);
        update.setDraftUpdatedAt(LocalDateTime.now());
        if (body.containsKey("definition")) {
            update.setDraftDefinition(PerfJson.write(objectMapper, body.get("definition")));
        }
        if (body.containsKey("variables")) {
            update.setDraftVariables(PerfJson.write(objectMapper, body.get("variables")));
        }
        ruleSetMapper.updateById(update);
        return ruleSetMapper.selectById(ruleSetId);
    }

    public Map<String, Object> simulate(Map<String, Object> body) {
        Map<String, Object> def = null;
        if (body.get("definition") != null) {
            def = body.get("definition") instanceof Map ? (Map<String, Object>) body.get("definition")
                    : PerfJson.parseMap(objectMapper, String.valueOf(body.get("definition")));
        } else {
            Integer versionId = parsePositiveInt(body.get("ruleSetVersionId"));
            if (versionId != null) {
                RuleSetVersion version = ruleSetVersionMapper.selectById(versionId);
                if (version == null) {
                    throw new IllegalArgumentException("规则版本不存在");
                }
                def = PerfJson.parseMap(objectMapper, version.getDefinition());
            }
        }
        if (def == null) {
            throw new IllegalArgumentException("definition 或 ruleSetVersionId 必须提供一个");
        }
        Map<String, Object> input = body.get("inputSnapshot") instanceof Map
                ? (Map<String, Object>) body.get("inputSnapshot")
                : PerfJson.parseMap(objectMapper, String.valueOf(body.get("inputSnapshot")));
        return settlementService.simulateRuleSetDefinition(def, input);
    }

    private Map<String, Object> toRuleSetMap(RuleSet ruleSet) {
        Map<String, Object> map = new LinkedHashMap<String, Object>();
        map.put("id", ruleSet.getId());
        map.put("code", ruleSet.getCode());
        map.put("name", ruleSet.getName());
        map.put("scope", ruleSet.getScope());
        map.put("projectId", ruleSet.getProjectId());
        map.put("status", ruleSet.getStatus());
        map.put("draftDefinition", parseJsonValue(ruleSet.getDraftDefinition()));
        map.put("draftVariables", parseJsonValue(ruleSet.getDraftVariables()));
        map.put("draftUpdatedAt", ruleSet.getDraftUpdatedAt());
        map.put("createdAt", ruleSet.getCreateTime());
        map.put("updatedAt", ruleSet.getUpdateTime());
        return map;
    }

    private Object parseJsonValue(String json) {
        if (!StringUtils.hasText(json)) {
            return null;
        }
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception ex) {
            return json;
        }
    }

    private String requiredString(Object value) {
        if (value == null || !StringUtils.hasText(String.valueOf(value).trim())) {
            throw new IllegalArgumentException("参数错误");
        }
        return String.valueOf(value).trim();
    }

    private Integer parsePositiveInt(Object value) {
        if (value == null || "null".equalsIgnoreCase(String.valueOf(value))) {
            return null;
        }
        int n = Integer.parseInt(String.valueOf(value));
        return n > 0 ? n : null;
    }

    private LocalDateTime parseDateTime(Object value) {
        if (value == null || "null".equalsIgnoreCase(String.valueOf(value))) {
            return null;
        }
        String text = String.valueOf(value);
        try {
            return OffsetDateTime.parse(text).toLocalDateTime();
        } catch (DateTimeParseException ex) {
            return LocalDateTime.parse(text.replace(" ", "T"));
        }
    }

    private String sha256(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}
