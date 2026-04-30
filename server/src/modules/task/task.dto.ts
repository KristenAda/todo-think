import { z } from "zod";

// ==================== Project DTOs ====================

export const CreateProjectDto = z.object({
  name: z.string().min(1, "项目名称不能为空").max(100),
  description: z.string().optional(),
  managerId: z.number().int().positive("负责人ID无效"),
  // 前端可选传 orgId，未传则由 Controller 从 JWT 上下文自动推导
  orgId: z.number().int().positive("归属组织ID无效").optional(),
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "SUSPENDED"]).optional(),
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  endDate: z.string().datetime({ offset: true }).optional().nullable(),
});
export type CreateProjectDtoType = z.infer<typeof CreateProjectDto>;

export const UpdateProjectDto = CreateProjectDto.partial().extend({
  version: z.number().int().nonnegative("更新时必须提供数据版本号以确保一致性"),
  // orgId 在更新时也可选
  orgId: z.number().int().positive("归属组织ID无效").optional().nullable(),
});
export type UpdateProjectDtoType = z.infer<typeof UpdateProjectDto>;

export const ProjectPageDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  name: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "SUSPENDED"]).optional(),
});
export type ProjectPageDtoType = z.infer<typeof ProjectPageDto>;

// ==================== TestCase 内联 DTO ====================

export const TestCaseInputDto = z.object({
  description: z.string().min(1, "用例描述不能为空"),
  expectedResult: z.string().min(1, "预期结果不能为空"),
});
export type TestCaseInputDtoType = z.infer<typeof TestCaseInputDto>;

/** 更新任务时：带 id 为更新该条，不带 id 为新增；未出现在列表中的旧用例将被删除 */
export const TestCaseUpsertDto = z.object({
  id: z.number().int().positive().optional(),
  description: z.string().min(1, "用例描述不能为空"),
  expectedResult: z.string().min(1, "预期结果不能为空"),
});
export type TestCaseUpsertDtoType = z.infer<typeof TestCaseUpsertDto>;

// ==================== Task DTOs ====================

const taskWorkDomainEnum = z.enum([
  "SOFTWARE_DEVELOPMENT",
  "PRODUCT_DESIGN",
  "OPERATIONS_SUPPORT",
  "DATA_ANALYTICS",
  "GENERAL",
]);

export const CreateTaskDto = z.object({
  projectId: z.number().int().positive("项目ID无效"),
  orgId: z.number().int().positive("归属组织ID无效").optional().nullable(), // 👉 未传时由 Controller 自动推导
  parentId: z.number().int().positive().optional().nullable(), // 👉 新增字段
  workDomain: taskWorkDomainEnum.default("GENERAL"),
  type: z.enum(["FEATURE", "BUG", "CHORE", "ENHANCEMENT"]).default("FEATURE"), // 👉 新增字段
  priority: z.enum(["P0", "P1", "P2", "P3"]).default("P2"), // 👉 新增字段
  dueDate: z.string().optional().nullable(), // 👉 新增字段
  title: z.string().min(1, "任务名称不能为空").max(200),
  description: z.string().optional(),
  mainAssigneeId: z.number().int().positive().optional().nullable(),
  testerId: z.number().int().positive().optional().nullable(),
  coAssigneeIds: z.array(z.number().int().positive()).optional().default([]),
  estimatedHours: z.number().positive().optional().nullable(),
  testCases: z.array(TestCaseInputDto).optional().default([]),
  /** 已上传完成的附件 ID（可选，须为当前用户本人上传） */
  attachmentIds: z.array(z.number().int().positive()).max(50).optional(),
});
export type CreateTaskDtoType = z.infer<typeof CreateTaskDto>;

export const UpdateTaskDto = z.object({
  version: z.number().int().nonnegative("更新时必须提供数据版本号以确保一致性"), // 👉 新增版本号校验
  parentId: z.number().int().positive().optional().nullable(), // 👉 新增字段
  workDomain: taskWorkDomainEnum.optional(),
  type: z.enum(["FEATURE", "BUG", "CHORE", "ENHANCEMENT"]).optional(), // 👉 新增字段
  priority: z.enum(["P0", "P1", "P2", "P3"]).optional(), // 👉 新增字段
  dueDate: z.string().optional().nullable(), // 👉 新增字段
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  mainAssigneeId: z.number().int().positive().optional().nullable(),
  testerId: z.number().int().positive().optional().nullable(),
  coAssigneeIds: z.array(z.number().int().positive()).optional(),
  estimatedHours: z.number().positive().optional().nullable(),
  // 👉 补充了 PAUSED 和 CANCELLED 状态
  status: z
    .enum([
      "PENDING",
      "IN_PROGRESS",
      "SELF_TESTING",
      "QA_REVIEW",
      "REJECTED",
      "COMPLETED",
      "PAUSED",
      "CANCELLED",
    ])
    .optional(),
  /** 传入则整体替换任务附件集（空数组表示清空）；不传则不修改附件 */
  attachmentIds: z.array(z.number().int().positive()).max(50).optional(),
  /** 传入则同步测试用例（空数组表示清空）；不传则不修改 */
  testCases: z.array(TestCaseUpsertDto).optional(),
});
export type UpdateTaskDtoType = z.infer<typeof UpdateTaskDto>;

export const TaskPageDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  projectId: z.coerce.number().int().positive().optional(),
  // 👉 补充了 PAUSED 和 CANCELLED 状态
  status: z
    .enum([
      "PENDING",
      "IN_PROGRESS",
      "SELF_TESTING",
      "QA_REVIEW",
      "REJECTED",
      "COMPLETED",
      "PAUSED",
      "CANCELLED",
    ])
    .optional(),
  mainAssigneeId: z.coerce.number().int().positive().optional(),
  keyword: z.string().optional(),
});
export type TaskPageDtoType = z.infer<typeof TaskPageDto>;

// ==================== WorkLog DTOs ====================

export const CreateWorkLogDto = z.object({
  hours: z.number().positive("工时必须大于0"),
  content: z.string().min(1, "工作内容不能为空"),
  /** 已上传完成的附件 ID（可选） */
  attachmentIds: z.array(z.number().int().positive()).max(50).optional(),
});
export type CreateWorkLogDtoType = z.infer<typeof CreateWorkLogDto>;

export const CreateTaskCommentDto = z.object({
  content: z.string().trim().min(1, "评论内容不能为空").max(2000),
  attachmentIds: z.array(z.number().int().positive()).max(20).optional(),
});
export type CreateTaskCommentDtoType = z.infer<typeof CreateTaskCommentDto>;

// ==================== 状态流转 DTOs ====================

export const SubmitTestDto = z.object({
  testCaseResults: z
    .array(
      z.object({
        id: z.number().int().positive(),
        selfTestStatus: z.enum(["PASSED", "FAILED", "UNTESTED"]),
        selfTestRemark: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});
export type SubmitTestDtoType = z.infer<typeof SubmitTestDto>;

export const QaAuditDto = z.object({
  testCaseResults: z
    .array(
      z.object({
        id: z.number().int().positive(),
        qaStatus: z.enum(["PASSED", "FAILED"]),
        qaRemark: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  actualHours: z.number().positive().optional(), // 全部通过时必传
  /** 非软件开发任务用于显式表示验收结论 */
  decision: z.enum(["pass", "reject"]).optional(),
  /** 任务级打回原因 */
  qaRejectReason: z.string().trim().min(1).max(500).optional(),
});
export type QaAuditDtoType = z.infer<typeof QaAuditDto>;

// ==================== Performance DTOs ====================

export const PerformancePageDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(10),
  projectId: z.coerce.number().int().positive().optional(),
});
export type PerformancePageDtoType = z.infer<typeof PerformancePageDto>;

// ==================== ProjectTaskRule ====================

export const ProjectTaskRuleDto = z.object({
  requireEstimateHours: z.boolean().optional().default(false),
  requireDueDate: z.boolean().optional().default(false),
  requireTestEvidenceForDev: z.boolean().optional().default(true),
  allowCoAssigneeSubmitQa: z.boolean().optional().default(false),
  allowQaRejectWithoutHours: z.boolean().optional().default(true),
});
export type ProjectTaskRuleDtoType = z.infer<typeof ProjectTaskRuleDto>;
