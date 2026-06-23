package com.todothink.modules.task.mapper;

import com.todothink.modules.task.entity.Task;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface TaskQueryMapper {

    List<Task> selectTaskPage(@Param("orgIds") List<Integer> orgIds,
            @Param("projectId") Integer projectId,
            @Param("status") String status,
            @Param("mainAssigneeId") Integer mainAssigneeId,
            @Param("keyword") String keyword,
            @Param("offset") int offset,
            @Param("limit") int limit);

    long countTaskPage(@Param("orgIds") List<Integer> orgIds,
            @Param("projectId") Integer projectId,
            @Param("status") String status,
            @Param("mainAssigneeId") Integer mainAssigneeId,
            @Param("keyword") String keyword);

    Long countTestCasesByTaskId(@Param("taskId") Integer taskId);

    Long countWorkLogsByTaskId(@Param("taskId") Integer taskId);

    List<Map<String, Object>> selectWorkLogsByTaskId(@Param("taskId") Integer taskId);

    List<Map<String, Object>> selectWorkLogAttachmentsByWorkLogIds(@Param("workLogIds") List<Integer> workLogIds);

    List<Map<String, Object>> selectCommentsByTaskId(@Param("taskId") Integer taskId);

    List<Map<String, Object>> selectCommentAttachmentsByCommentIds(@Param("commentIds") List<Integer> commentIds);

    List<Map<String, Object>> selectTimelinesByTaskId(@Param("taskId") Integer taskId);
}
