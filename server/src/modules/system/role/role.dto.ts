import { z } from 'zod'

/**
 * 角色创建 DTO
 */
export const CreateRoleDto = z.object({
  roleName: z.string().min(2, '角色名称至少2个字符').max(50),
  roleCode: z.string().min(2, '角色编码至少2个字符').max(50),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
  sort: z.number().default(0),
  dataScope: z.number().default(1),
  remark: z.string().optional()
})

export type CreateRoleDtoType = z.infer<typeof CreateRoleDto>

/**
 * 角色更新 DTO
 */
export const UpdateRoleDto = z.object({
  id: z.number(),
  roleName: z.string().min(2).max(50).optional(),
  roleCode: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  sort: z.number().optional(),
  dataScope: z.number().optional(),
  remark: z.string().optional()
})

export type UpdateRoleDtoType = z.infer<typeof UpdateRoleDto>

/**
 * 角色查询 DTO
 */
export const QueryRoleDto = z.object({
  current: z.number().default(1),
  size: z.number().default(20),
  roleName: z.string().optional(),
  roleCode: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional()
})

export type QueryRoleDtoType = z.infer<typeof QueryRoleDto>

/**
 * 角色分配菜单权限 DTO
 */
export const AssignMenusDto = z.object({
  roleId: z.number(),
  menuIds: z.array(z.number())
})

export type AssignMenusDtoType = z.infer<typeof AssignMenusDto>

/**
 * 角色分配数据权限 DTO
 */
export const AssignDataScopeDto = z.object({
  roleId: z.number(),
  dataScope: z.number(),
  deptIds: z.array(z.number()).optional()
})

export type AssignDataScopeDtoType = z.infer<typeof AssignDataScopeDto>
