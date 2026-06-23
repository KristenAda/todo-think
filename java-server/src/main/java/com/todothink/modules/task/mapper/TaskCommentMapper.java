package com.todothink.modules.task.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.todothink.modules.task.entity.TaskComment;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TaskCommentMapper extends BaseMapper<TaskComment> {
}
