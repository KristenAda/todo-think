import { z } from "zod";

export const RuleSetCreateDto = z.object({
  code: z.string().trim().min(3).max(64),
  name: z.string().trim().min(1).max(100),
  scope: z.enum(["GLOBAL", "PROJECT"]).default("PROJECT"),
  projectId: z.number().int().positive().optional().nullable(),
});
export type RuleSetCreateDtoType = z.infer<typeof RuleSetCreateDto>;

export const RuleSetUpdateDto = z.object({
  code: z.string().trim().min(3).max(64).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  scope: z.enum(["GLOBAL", "PROJECT"]).optional(),
  projectId: z.number().int().positive().optional().nullable(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});
export type RuleSetUpdateDtoType = z.infer<typeof RuleSetUpdateDto>;

export const RuleSetPublishDto = z.object({
  definition: z.any(),
  effectiveFrom: z.string().datetime({ offset: true }).optional().nullable(),
  effectiveTo: z.string().datetime({ offset: true }).optional().nullable(),
});
export type RuleSetPublishDtoType = z.infer<typeof RuleSetPublishDto>;

/** 规则集草稿：至少保存公式定义或变量其一 */
export const RuleSetDraftDto = z
  .object({
    definition: z.any().optional(),
    variables: z.array(z.any()).optional(),
  })
  .refine((d) => d.definition !== undefined || d.variables !== undefined, {
    message: "definition 与 variables 至少提供其一",
  });
export type RuleSetDraftDtoType = z.infer<typeof RuleSetDraftDto>;

export const RuleSetSimulateDto = z.object({
  ruleSetVersionId: z.number().int().positive().optional(),
  definition: z.any().optional(),
  inputSnapshot: z.any(),
});
export type RuleSetSimulateDtoType = z.infer<typeof RuleSetSimulateDto>;

export const CreateTaskAdjustmentDto = z.object({
  taskId: z.number().int().positive(),
  ruleSetVersionId: z.number().int().positive().optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});
export type CreateTaskAdjustmentDtoType = z.infer<typeof CreateTaskAdjustmentDto>;

export const RuleVariableUpsertDto = z.object({
  variables: z.array(
    z.object({
      id: z.number().int().positive().optional(),
      code: z.string().trim().min(1).max(64),
      label: z.string().trim().min(1).max(100),
      valueType: z.enum(["Number", "Float", "Integer"]).default("Number"),
      description: z.string().trim().max(255).optional().nullable(),
      sourcePath: z.string().trim().min(1).max(100),
      defaultValue: z.number().optional().nullable(),
      scope: z.enum(["GLOBAL", "PROJECT"]).default("GLOBAL"),
      projectId: z.number().int().positive().optional().nullable(),
      enabled: z.boolean().default(true),
      sort: z.number().int().default(0),
    }),
  ),
});
export type RuleVariableUpsertDtoType = z.infer<typeof RuleVariableUpsertDto>;

