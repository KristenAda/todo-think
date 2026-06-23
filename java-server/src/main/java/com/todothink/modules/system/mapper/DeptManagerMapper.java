package com.todothink.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.todothink.modules.system.entity.DeptManager;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DeptManagerMapper extends BaseMapper<DeptManager> {

    List<DeptManager> selectByDeptId(@Param("deptId") Integer deptId);
}
