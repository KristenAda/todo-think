import request from '@/utils/http';

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 */
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/user/list',
    params
  });
}

/**
 * 新增用户
 */
export function fetchAddUser(data: any) {
  return request.post({
    url: '/user/add',
    data
  });
}

/**
 * 编辑用户
 */
export function fetchUpdateUser(data: any) {
  return request.post({
    url: '/user/update',
    data
  });
}

/**
 * 删除用户
 */
export function fetchDeleteUser(id: number) {
  return request.post({
    url: '/user/delete',
    data: { id }
  });
}

/**
 * 分配用户角色
 */
export function fetchAssignUserRoles(userId: number, roleIds: number[]) {
  return request.post({
    url: '/user/assignRoles',
    data: { userId, roleIds }
  });
}

// ==================== 角色管理 ====================

/**
 * 获取角色列表
 */
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/role/list',
    params
  });
}

/**
 * 新增角色
 */
export function fetchAddRole(data: any) {
  return request.post({
    url: '/role/add',
    data
  });
}

/**
 * 编辑角色
 */
export function fetchUpdateRole(data: any) {
  return request.post({
    url: '/role/update',
    data
  });
}

/**
 * 删除角色
 */
export function fetchDeleteRole(id: number) {
  return request.post({
    url: '/role/delete',
    data: { id }
  });
}

/**
 * 分配角色菜单权限
 */
export function fetchAssignRoleMenus(roleId: number, menuIds: number[]) {
  return request.post({
    url: '/role/assignMenus',
    data: { roleId, menuIds }
  });
}

/**
 * 获取角色已分配的菜单ID列表
 */
export function fetchGetRoleMenus(roleId: number) {
  return request.post({
    url: '/role/getMenus',
    data: { roleId }
  });
}

/**
 * 分配角色数据权限
 */
export function fetchUpdateRoleDataScope(roleId: number, dataScope: number, deptIds?: number[]) {
  return request.post({
    url: '/role/updateDataScope',
    data: { roleId, dataScope, deptIds }
  });
}

// ==================== 菜单管理 ====================

/**
 * 获取菜单列表
 */
export function fetchGetMenuList() {
  return request.get<Api.SystemManage.MenuItem[]>({
    url: '/menu/list'
  });
}

/**
 * 获取当前用户的菜单树（动态路由）
 */
export function fetchGetUserMenuTree() {
  return request.get<Api.SystemManage.MenuItem[]>({
    url: '/menu/tree'
  });
}

/**
 * 新增菜单
 */
export function fetchAddMenu(data: any) {
  return request.post({
    url: '/menu/add',
    data
  });
}

/**
 * 编辑菜单
 */
export function fetchUpdateMenu(data: any) {
  return request.post({
    url: '/menu/update',
    data
  });
}

/**
 * 删除菜单
 */
export function fetchDeleteMenu(id: number) {
  return request.post({
    url: '/menu/delete',
    data: { id }
  });
}

// ==================== 个人中心 ====================

/**
 * 获取当前登录用户个人资料
 */
export function fetchGetProfile() {
  return request.get<Api.SystemManage.UserProfile>({
    url: '/user/profile'
  });
}

/**
 * 更新当前登录用户个人资料
 */
export function fetchUpdateProfile(data: Api.SystemManage.UpdateProfileParams) {
  return request.post<Api.SystemManage.UserProfile>({
    url: '/user/profile',
    data
  });
}

/**
 * 修改密码
 */
export function fetchChangePassword(data: { oldPassword: string; newPassword: string }) {
  return request.post({
    url: '/user/change-password',
    data
  });
}
