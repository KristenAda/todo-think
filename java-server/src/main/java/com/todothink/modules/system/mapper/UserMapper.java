package com.todothink.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.todothink.modules.system.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    List<String> selectRoleCodesByUserId(@Param("userId") Integer userId);

    List<Integer> selectRoleIdsByUserId(@Param("userId") Integer userId);
}
