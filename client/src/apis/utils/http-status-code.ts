/**
 * 网络状态码枚举类
 */
export enum HttpStatusCode {
  /**
   * 输入内容有误
   */
  ContentIncorrect = 400,
  /**
   * 未登录 -> 请求拦截器中统一处理
   */
  Unauthorized = 401,

  /**
   * 无权限
   */
  Forbidden = 403,

  /**
   * 资源未找到
   */
  ResourceNotFound = 404,

  /**
   * 拒绝访问
   */
  NotAcceptable = 406,

  /**
   * 服务错误
   */
  ProgramException = 500,
  /**
   * 服务不可用
   */
  ServiceUnavailable = 503,

  /**
   * 网关超时
   */
  GatewayTimeout = 504,

  /**
   * 业务异常
   */
  BusinessException = 601,

  /**
   * 业务异常 -> 需向上返回给用户进行特殊处理
   */
  BusinessExceptionNeedDeal = 602,
}
