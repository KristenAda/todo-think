import request from '@/apis/index';

const BASE_URL = '/sys/role';

/**
 * 获取角色列表
 */
export const getRoleListApi = (data?: any) =>
  request.post(`${BASE_URL}/list`, data);

/**
 * 新增角色
 */
export const addRoleApi = (data: any) => request.post(`${BASE_URL}/add`, data);

/**
 * 修改角色
 */
export const updateRoleApi = (data: any) =>
  request.post(`${BASE_URL}/update`, data);

/**
 * 删除角色
 */
export const deleteRoleApi = (data: { id: number | string }) =>
  request.post(`${BASE_URL}/delete`, data);

/**
 * 分配权限
 */
export const assignRolePermsApi = (data: {
  roleId: number | string;
  menuIds: Array<number | string>;
}) => request.post(`${BASE_URL}/assignPerms`, data);

/**
 * 获取角色已有权限 (回显)
 */
export const getRolePermsApi = (data: { id: number | string }) =>
  request.post(`${BASE_URL}/getPerms`, data);
