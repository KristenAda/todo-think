import request from '@/apis/index';

const BASE_URL = '/sys/dept';

/**
 * 获取部门树
 */
export const getDeptTreeApi = (data?: any) =>
  request.post(`${BASE_URL}/tree`, data);

/**
 * 新增部门
 */
export const addDeptApi = (data: any) => request.post(`${BASE_URL}/add`, data);

/**
 * 修改部门
 */
export const updateDeptApi = (data: any) =>
  request.post(`${BASE_URL}/update`, data);

/**
 * 删除部门
 */
export const deleteDeptApi = (data: { id: number | string }) =>
  request.post(`${BASE_URL}/delete`, data);

/**
 * 查部门人员
 */
export const getDeptEmployeesApi = (data: any) =>
  request.post(`${BASE_URL}/employees`, data);

/**
 * 部门加人
 */
export const addDeptEmployeeApi = (data: any) =>
  request.post(`${BASE_URL}/addEmployee`, data);

/**
 * 部门踢人
 */
export const removeDeptEmployeeApi = (data: any) =>
  request.post(`${BASE_URL}/removeEmployee`, data);
