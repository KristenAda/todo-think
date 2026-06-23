package com.todothink.modules.message.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.todothink.modules.message.entity.Message;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MessageMapper extends BaseMapper<Message> {
}
