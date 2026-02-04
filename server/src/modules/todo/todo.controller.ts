import { Context } from "koa";
import todoService from "./todo.service";
import { Result } from "../../core/result";

class TodoController {
  // 获取分页列表
  async list(ctx: Context) {
    // 获取 query 参数，默认第1页，每页10条
    const page = Number(ctx.query.page) || 1;
    const pageSize = Number(ctx.query.pageSize) || 10;
    const keyword = ctx.query.keyword as string; // 支持搜索

    // 构造查询条件
    const where = keyword ? { title: { contains: keyword } } : {};

    const { list, total } = await todoService.page(page, pageSize, where);
    ctx.body = Result.page(list, total, page, pageSize);
  }

  // 新增
  async create(ctx: Context) {
    const data = ctx.request.body;
    // 这里可以加参数校验逻辑
    const res = await todoService.add(data);
    ctx.body = Result.success(res);
  }

  // 删除
  async remove(ctx: Context) {
    const id = Number(ctx.params.id);
    await todoService.delete(id);
    ctx.body = Result.success(null, "删除成功");
  }

  // 扩展：清除已完成
  async clear(ctx: Context) {
    await todoService.clearCompleted();
    ctx.body = Result.success(null, "清理完成");
  }
}

export default new TodoController();
