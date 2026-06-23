package com.todothink.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.todothink.modules.system.entity.DeptMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DeptMemberMapper extends BaseMapper<DeptMember> {

    List<DeptMember> selectByDeptId(@Param("deptId") Integer deptId);
}
