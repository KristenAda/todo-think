package com.todothink.modules.dashboard.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DashboardQueryMapper {

    Long sumBugCount(@Param("userId") Integer userId, @Param("coTaskIds") List<Integer> coTaskIds);
}
