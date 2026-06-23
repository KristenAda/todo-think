package com.todothink.modules.system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RelationMapper {

    void deleteUserRoles(@Param("userId") Integer userId);

    void insertUserRoles(@Param("userId") Integer userId, @Param("roleIds") List<Integer> roleIds);

    void deleteRoleMenus(@Param("roleId") Integer roleId);

    void insertRoleMenus(@Param("roleId") Integer roleId, @Param("menuIds") List<Integer> menuIds);

    List<Integer> selectMenuIdsByRoleId(@Param("roleId") Integer roleId);

    void deleteRoleDepts(@Param("roleId") Integer roleId);

    void insertRoleDepts(@Param("roleId") Integer roleId, @Param("deptIds") List<Integer> deptIds);
}
