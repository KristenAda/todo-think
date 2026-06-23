package com.todothink.modules.task.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 只读查询 rule_set / rule_set_version，供项目验收计分规则版本选项使用。
 */
@Mapper
public interface ScoringRuleQueryMapper {

    @Select("SELECT id, code, name, scope, project_id AS projectId "
            + "FROM rule_set "
            + "WHERE status = 'ACTIVE' "
            + "AND (scope = 'GLOBAL' OR (scope = 'PROJECT' AND project_id = #{projectId})) "
            + "ORDER BY scope ASC, id ASC")
    List<Map<String, Object>> selectActiveRuleSets(@Param("projectId") Integer projectId);

    @Select("<script>"
            + "SELECT id, rule_set_id AS ruleSetId, version, published_at AS publishedAt, "
            + "effective_from AS effectiveFrom, effective_to AS effectiveTo "
            + "FROM rule_set_version "
            + "WHERE rule_set_id IN "
            + "<foreach collection='ruleSetIds' item='id' open='(' separator=',' close=')'>#{id}</foreach> "
            + "ORDER BY published_at DESC, version DESC"
            + "</script>")
    List<Map<String, Object>> selectVersionsByRuleSetIds(@Param("ruleSetIds") List<Integer> ruleSetIds);

    @Select("SELECT v.id, rs.scope, rs.project_id AS projectId, rs.status "
            + "FROM rule_set_version v "
            + "INNER JOIN rule_set rs ON v.rule_set_id = rs.id "
            + "WHERE v.id = #{versionId}")
    Map<String, Object> findVersionWithRuleSet(@Param("versionId") Integer versionId);
}
