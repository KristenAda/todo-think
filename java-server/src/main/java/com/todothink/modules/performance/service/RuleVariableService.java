package com.todothink.modules.performance.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.todothink.modules.performance.entity.RuleVariable;
import com.todothink.modules.performance.mapper.RuleVariableMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RuleVariableService {

    private final RuleVariableMapper ruleVariableMapper;

    public RuleVariableService(RuleVariableMapper ruleVariableMapper) {
        this.ruleVariableMapper = ruleVariableMapper;
    }

    public List<Map<String, Object>> listVariables(Integer projectId) {
        LambdaQueryWrapper<RuleVariable> wrapper = new LambdaQueryWrapper<RuleVariable>()
                .eq(RuleVariable::getEnabled, true)
                .orderByAsc(RuleVariable::getSort)
                .orderByAsc(RuleVariable::getId);
        if (projectId != null) {
            wrapper.and(w -> w.eq(RuleVariable::getScope, "GLOBAL")
                    .or(o -> o.eq(RuleVariable::getScope, "PROJECT").eq(RuleVariable::getProjectId, projectId)));
        }
        List<RuleVariable> list = ruleVariableMapper.selectList(wrapper);
        if (list.isEmpty()) {
            ensureDefaultVariables();
            list = ruleVariableMapper.selectList(wrapper);
        }
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (RuleVariable variable : list) {
            result.add(toVariableMap(variable));
        }
        return result;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> upsertVariables(Map<String, Object> body) {
        Object variablesRaw = body.get("variables");
        if (!(variablesRaw instanceof List) || ((List<?>) variablesRaw).isEmpty()) {
            throw new IllegalArgumentException("variables 不能为空");
        }
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        for (Object item : (List<?>) variablesRaw) {
            if (!(item instanceof Map)) {
                continue;
            }
            Map<String, Object> payload = (Map<String, Object>) item;
            RuleVariable variable = upsertOne(payload);
            result.add(toVariableMap(variable));
        }
        return result;
    }

    private RuleVariable upsertOne(Map<String, Object> payload) {
        Integer id = parsePositiveInt(payload.get("id"));
        RuleVariable existing = null;
        if (id != null) {
            existing = ruleVariableMapper.selectById(id);
        }
        if (existing == null && payload.get("code") != null) {
            existing = ruleVariableMapper.selectOne(new LambdaQueryWrapper<RuleVariable>()
                    .eq(RuleVariable::getCode, String.valueOf(payload.get("code")).trim()));
        }

        RuleVariable variable = existing != null ? existing : new RuleVariable();
        variable.setCode(requiredString(payload.get("code")));
        variable.setLabel(requiredString(payload.get("label")));
        variable.setValueType(payload.get("valueType") != null ? String.valueOf(payload.get("valueType")) : "Number");
        variable.setDescription(payload.get("description") != null ? String.valueOf(payload.get("description")) : null);
        variable.setSourcePath(requiredString(payload.get("sourcePath")));
        variable.setDefaultValue(parseDecimal(payload.get("defaultValue")));
        variable.setScope(payload.get("scope") != null ? String.valueOf(payload.get("scope")) : "GLOBAL");
        variable.setProjectId(parsePositiveInt(payload.get("projectId")));
        variable.setEnabled(payload.get("enabled") == null || Boolean.parseBoolean(String.valueOf(payload.get("enabled"))));
        variable.setSort(payload.get("sort") != null ? Integer.parseInt(String.valueOf(payload.get("sort"))) : 0);

        if (existing == null) {
            ruleVariableMapper.insert(variable);
        } else {
            ruleVariableMapper.updateById(variable);
        }
        return variable;
    }

    private void ensureDefaultVariables() {
        upsertOne(defaultVariable("baseScore", "基础积分", "Number", "task.baseScore", 20, 1));
        upsertOne(defaultVariable("complexity", "难度系数", "Float", "task.complexity", 1, 2));
        upsertOne(defaultVariable("rejectCount", "验收驳回次数", "Integer", "task.rejectCount", 0, 3));
        upsertOne(defaultVariable("aheadDays", "提前完成天数", "Integer", "task.aheadDays", 0, 4));
    }

    private Map<String, Object> defaultVariable(String code, String label, String valueType, String sourcePath,
            double defaultValue, int sort) {
        Map<String, Object> map = new LinkedHashMap<String, Object>();
        map.put("code", code);
        map.put("label", label);
        map.put("valueType", valueType);
        map.put("sourcePath", sourcePath);
        map.put("defaultValue", defaultValue);
        map.put("scope", "GLOBAL");
        map.put("enabled", true);
        map.put("sort", sort);
        return map;
    }

    private Map<String, Object> toVariableMap(RuleVariable variable) {
        Map<String, Object> map = new LinkedHashMap<String, Object>();
        map.put("id", variable.getId());
        map.put("code", variable.getCode());
        map.put("label", variable.getLabel());
        map.put("valueType", variable.getValueType());
        map.put("description", variable.getDescription());
        map.put("sourcePath", variable.getSourcePath());
        map.put("defaultValue", toNumberOrNull(variable.getDefaultValue()));
        map.put("scope", variable.getScope());
        map.put("projectId", variable.getProjectId());
        map.put("enabled", variable.getEnabled());
        map.put("sort", variable.getSort());
        map.put("createdAt", variable.getCreateTime());
        map.put("updatedAt", variable.getUpdateTime());
        return map;
    }

    private Number toNumberOrNull(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.doubleValue();
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

    private BigDecimal parseDecimal(Object value) {
        if (value == null || "null".equalsIgnoreCase(String.valueOf(value))) {
            return null;
        }
        return new BigDecimal(String.valueOf(value));
    }
}
