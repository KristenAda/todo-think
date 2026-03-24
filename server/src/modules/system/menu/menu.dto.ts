import { z } from 'zod'

/**
 * 权限项 DTO
 */
export const AuthItemDto = z.object({
  authMark: z.string(),
  title: z.string()
})

export type AuthItemDtoType = z.infer<typeof AuthItemDto>

/**
 * 菜单创建 DTO
 */
export const CreateMenuDto = z.object({
  parentId: z.number().optional(),
  name: z.string().min(1, '菜单名称标识不能为空').max(50),
  title: z.string().min(1, '菜单显示名称不能为空').max(100),
  path: z.string().optional(),
  component: z.string().optional(),
  icon: z.string().optional(),
  type: z.number().default(2), // 1:目录 2:菜单 3:按钮
  sort: z.number().default(0),
  isEnable: z.boolean().default(true),
  keepAlive: z.boolean().default(true),
  isIframe: z.boolean().default(false),
  isHide: z.boolean().default(false),
  isHideTab: z.boolean().default(false),
  link: z.string().optional(),
  showBadge: z.boolean().default(false),
  showTextBadge: z.string().optional(),
  fixedTab: z.boolean().default(false),
  activePath: z.string().optional(),
  isFullPage: z.boolean().default(false),
  roles: z.array(z.string()).optional(),
  authList: z.array(AuthItemDto).optional()
})

export type CreateMenuDtoType = z.infer<typeof CreateMenuDto>

/**
 * 菜单更新 DTO
 */
export const UpdateMenuDto = z.object({
  id: z.number(),
  parentId: z.number().optional(),
  name: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(100).optional(),
  path: z.string().optional(),
  component: z.string().optional(),
  icon: z.string().optional(),
  type: z.number().optional(),
  sort: z.number().optional(),
  isEnable: z.boolean().optional(),
  keepAlive: z.boolean().optional(),
  isIframe: z.boolean().optional(),
  isHide: z.boolean().optional(),
  isHideTab: z.boolean().optional(),
  link: z.string().optional(),
  showBadge: z.boolean().optional(),
  showTextBadge: z.string().optional(),
  fixedTab: z.boolean().optional(),
  activePath: z.string().optional(),
  isFullPage: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
  authList: z.array(AuthItemDto).optional()
})

export type UpdateMenuDtoType = z.infer<typeof UpdateMenuDto>

/**
 * 菜单查询 DTO
 */
export const QueryMenuDto = z.object({
  title: z.string().optional(),
  path: z.string().optional()
})

export type QueryMenuDtoType = z.infer<typeof QueryMenuDto>
