// client/src/apis/modules/auth.ts
import http from '@/apis/index';

// ========== 类型定义 (Types) ==========

// 登录请求参数
export interface LoginReqParams {
  username: string;
  password?: string;
}

// 登录成功后的响应数据结构 (根据你后端的实际结构微调)
export interface LoginResData {
  token: string;
  user: {
    id: number;
    username: string;
    deptId: string;
    roles?: string[];
    [key: string]: any;
  };
  permissions: string[]; // 用户的按钮权限标识，如 ['sys:user:add']
}

// ========== 接口定义 (APIs) ==========

/**
 * @description 系统登录
 * @param data {LoginReqParams} 用户名和密码
 * @returns {Promise<LoginResData>} 包含 Token 和用户基础信息
 */
export function loginApi(data: LoginReqParams): Promise<LoginResData> {
  return http({
    url: '/auth/login', // 对应 Koa2 后端路由的登录接口
    method: 'post',
    data,
  });
}

/**
 * @description 获取当前登录用户的菜单树 (用于动态路由)
 * @returns {Promise<any>} 返回树形结构的 SysMenu 数组
 */
export function getUserMenuTreeApi(): Promise<any> {
  return http({
    url: '/sys/menu/tree', // 对应后端 Java/RPC 风格获取当前用户菜单
    method: 'post',
    // 参数视后端而定，如果后端从 JWT 解析 userId，则前端不需要传 data
  });
}

/**
 * @description 系统登出
 * @returns {Promise<any>}
 */
export function logoutApi(): Promise<any> {
  return http({
    url: '/auth/logout',
    method: 'post',
  });
}
