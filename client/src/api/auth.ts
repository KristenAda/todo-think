import request from '@/utils/http';

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/auth/login',
    params
  });
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>({
    url: '/auth/info'
  });
}

/**
 * 用户注册
 * @param data 注册参数 (包含用户名、密码等)
 * @returns 注册响应
 */
export function fetchRegister(data: any) {
  return request.post({
    url: '/auth/register',
    data,
    showSuccessMessage: true
  });
}
