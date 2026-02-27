import request from '@/apis/index';

const BASE_URL = '/sys/menu';

/**
 * 获取菜单列表 / 菜单树
 */
export const getMenuListApi = (data?: any) =>
  request.post(`${BASE_URL}/list`, data);

/**
 * 新增菜单
 */
export const addMenuApi = (data: any) => request.post(`${BASE_URL}/add`, data);

/**
 * 修改菜单
 */
export const updateMenuApi = (data: any) =>
  request.post(`${BASE_URL}/update`, data);

/**
 * 删除菜单
 */
export const deleteMenuApi = (data: { id: number | string }) =>
  request.post(`${BASE_URL}/delete`, data);
