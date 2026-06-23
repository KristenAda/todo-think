package com.todothink.modules.task.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.todothink.modules.task.entity.WorkLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface WorkLogMapper extends BaseMapper<WorkLog> {
}
