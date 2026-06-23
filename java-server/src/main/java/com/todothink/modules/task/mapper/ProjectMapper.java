package com.todothink.modules.task.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.todothink.modules.task.entity.Project;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ProjectMapper extends BaseMapper<Project> {

    @Select("SELECT COUNT(*) FROM task WHERE project_id = #{projectId}")
    Long countTasksByProjectId(@Param("projectId") Integer projectId);
}
