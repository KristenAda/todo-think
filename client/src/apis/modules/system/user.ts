import request from '@/apis/index';

const BASE_URL = '/sys/user';

/**
 * 获取用户列表(分页)
 */
export const getUserListApi = (data?: any) =>
  request.post(`${BASE_URL}/list`, data);

/**
 * 新增用户
 */
export const addUserApi = (data: any) => request.post(`${BASE_URL}/add`, data);

/**
 * 修改用户
 */
export const updateUserApi = (data: any) =>
  request.post(`${BASE_URL}/update`, data);

/**
 * 删除用户
 */
export const deleteUserApi = (data: { id: number | string }) =>
  request.post(`${BASE_URL}/delete`, data);

/**
 * 给用户分配角色
 */
export const assignUserRolesApi = (data: {
  userId: number | string;
  roleIds: Array<number | string>;
}) => request.post(`${BASE_URL}/assignRoles`, data);
