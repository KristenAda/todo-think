import { z } from 'zod';

export const CreateProjectDto = z.object({
  name: z.string().min(1, '项目名称不能为空').max(100),
  description: z.string().optional(),
  managerId: z.number().int().positive('负责人ID无效'),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'SUSPENDED']).default('ACTIVE'),
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  endDate: z.string().datetime({ offset: true }).optional().nullable(),
});
export type CreateProjectDtoType = z.infer<typeof CreateProjectDto>;

export const UpdateProjectDto = CreateProjectDto.partial();
export type UpdateProjectDtoType = z.infer<typeof UpdateProjectDto>;

export const ProjectPageDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(12),
  name: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'SUSPENDED']).optional(),
});
export type ProjectPageDtoType = z.infer<typeof ProjectPageDto>;
