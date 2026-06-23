package com.todothink.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.todothink.modules.system.entity.Menu;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MenuMapper extends BaseMapper<Menu> {

    List<Menu> selectMenusByRoleIds(@Param("roleIds") List<Integer> roleIds);
}
