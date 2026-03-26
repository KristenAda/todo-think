import { z } from 'zod';

// ==================== Project DTOs ====================

export const CreateProjectDto = z.object({
  name: z.string().min(1, '项目名称不能为空').max(100),
  description: z.string().optional(),
  managerId: z.number().int().positive('负责人ID无效'),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'SUSPENDED']).optional(),
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  endDate: z.string().datetime({ offset: true }).optional().nullable(),
});
export type CreateProjectDtoType = z.infer<typeof CreateProjectDto>;

export const UpdateProjectDto = CreateProjectDto.partial();
export type UpdateProjectDtoType = z.infer<typeof UpdateProjectDto>;

export const ProjectPageDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  name: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'SUSPENDED']).optional(),
});
export type ProjectPageDtoType = z.infer<typeof ProjectPageDto>;

// ==================== TestCase 内联 DTO ====================

export const TestCaseInputDto = z.object({
  description: z.string().min(1, '用例描述不能为空'),
  expectedResult: z.string().min(1, '预期结果不能为空'),
});
export type TestCaseInputDtoType = z.infer<typeof TestCaseInputDto>;

// ==================== Task DTOs ====================

export const CreateTaskDto = z.object({
  projectId: z.number().int().positive('项目ID无效'),
  title: z.string().min(1, '任务名称不能为空').max(200),
  description: z.string().optional(),
  managerId: z.number().int().positive().optional().nullable(),
  mainAssigneeId: z.number().int().positive().optional().nullable(),
  testerId: z.number().int().positive().optional().nullable(),
  coAssigneeIds: z.array(z.number().int().positive()).optional().default([]),
  estimatedHours: z.number().positive().optional().nullable(),
  testCases: z.array(TestCaseInputDto).optional().default([]),
});
export type CreateTaskDtoType = z.infer<typeof CreateTaskDto>;

export const UpdateTaskDto = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  managerId: z.number().int().positive().optional().nullable(),
  mainAssigneeId: z.number().int().positive().optional().nullable(),
  testerId: z.number().int().positive().optional().nullable(),
  coAssigneeIds: z.array(z.number().int().positive()).optional(),
  estimatedHours: z.number().positive().optional().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'SELF_TESTING', 'QA_REVIEW', 'REJECTED', 'COMPLETED']).optional(),
});
export type UpdateTaskDtoType = z.infer<typeof UpdateTaskDto>;

export const TaskPageDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  projectId: z.coerce.number().int().positive().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'SELF_TESTING', 'QA_REVIEW', 'REJECTED', 'COMPLETED']).optional(),
  mainAssigneeId: z.coerce.number().int().positive().optional(),
  keyword: z.string().optional(),
});
export type TaskPageDtoType = z.infer<typeof TaskPageDto>;

// ==================== WorkLog DTOs ====================

export const CreateWorkLogDto = z.object({
  hours: z.number().positive('工时必须大于0'),
  content: z.string().min(1, '工作内容不能为空'),
});
export type CreateWorkLogDtoType = z.infer<typeof CreateWorkLogDto>;

// ==================== 状态流转 DTOs ====================

export const SubmitTestDto = z.object({
  testCaseResults: z.array(
    z.object({
      id: z.number().int().positive(),
      selfTestStatus: z.enum(['PASSED', 'FAILED', 'UNTESTED']),
      selfTestRemark: z.string().optional(),
    })
  ).min(1, '至少提交一条用例结果'),
});
export type SubmitTestDtoType = z.infer<typeof SubmitTestDto>;

export const QaAuditDto = z.object({
  testCaseResults: z.array(
    z.object({
      id: z.number().int().positive(),
      qaStatus: z.enum(['PASSED', 'FAILED']),
      qaRemark: z.string().optional(),
    })
  ).min(1, '至少提交一条验收结果'),
  actualHours: z.number().positive().optional(), // 全部通过时必传
});
export type QaAuditDtoType = z.infer<typeof QaAuditDto>;

// ==================== Performance DTOs ====================

export const PerformancePageDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(10),
  projectId: z.coerce.number().int().positive().optional(),
});
export type PerformancePageDtoType = z.infer<typeof PerformancePageDto>;
