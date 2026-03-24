import { z } from 'zod'

/**
 * 用户创建 DTO
 */
export const CreateUserDto = z.object({
  userName: z.string().min(2, '用户名至少2个字符').max(50),
  password: z.string().min(6, '密码至少6个字符').optional(),
  nickName: z.string().max(50).optional(),
  userPhone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  userEmail: z.string().email('邮箱格式不正确').optional(),
  userGender: z.string().optional(), // 新增：性别
  avatar: z.string().optional(),
  status: z.enum(['1', '2', '3', '4']).default('1'),
  remark: z.string().optional(),
  deptId: z.number().optional()
})

export type CreateUserDtoType = z.infer<typeof CreateUserDto>

/**
 * 用户更新 DTO
 */
export const UpdateUserDto = z.object({
  id: z.number(),
  userName: z.string().min(2).max(50).optional(),
  nickName: z.string().max(50).optional(),
  userPhone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  userEmail: z.string().email('邮箱格式不正确').optional(),
  userGender: z.string().optional(), // 新增：性别
  avatar: z.string().optional(),
  password: z.string().min(6).optional(),
  status: z.enum(['1', '2', '3', '4']).optional(),
  remark: z.string().optional(),
  deptId: z.number().optional()
})

export type UpdateUserDtoType = z.infer<typeof UpdateUserDto>

/**
 * 用户查询 DTO
 */
export const QueryUserDto = z.object({
  current: z.number().default(1),
  size: z.number().default(20),
  userName: z.string().optional(),
  userPhone: z.string().optional(),
  userEmail: z.string().optional(),
  userGender: z.string().optional(),
  status: z.string().optional(),
  deptId: z.number().optional()
})

export type QueryUserDtoType = z.infer<typeof QueryUserDto>

/**
 * 用户分配角色 DTO
 */
export const AssignRolesDto = z.object({
  userId: z.number(),
  roleIds: z.array(z.number())
})

export type AssignRolesDtoType = z.infer<typeof AssignRolesDto>
