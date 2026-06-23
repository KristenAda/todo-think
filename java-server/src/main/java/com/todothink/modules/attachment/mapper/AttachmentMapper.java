package com.todothink.modules.attachment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.todothink.modules.attachment.entity.Attachment;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AttachmentMapper extends BaseMapper<Attachment> {
}
