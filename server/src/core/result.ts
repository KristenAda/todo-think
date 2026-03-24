export class Result {
  // 成功响应
  static success(data: any = null, message: string = "success") {
    return { code: 200, message: message, data };
  }

  // 分页响应
  static page(list: any[], total: number, page: number, pageSize: number) {
    return {
      code: 200,
      message: "success",
      data: {
        list,
        total,
        page,
        pageSize,
        totalPage: Math.ceil(total / pageSize),
      },
    };
  }

  // 错误响应
  static error(message: string = "error", code: number = 500) {
    return { code, message: message };
  }
}
