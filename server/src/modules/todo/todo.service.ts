import { BaseService } from "@/core/base.service";

class TodoService extends BaseService {
  constructor() {
    super("todo"); // 告诉基类，我操作的是 'todo' 表
  }

  // 这里可以扩展特殊方法，比如：
  async clearCompleted() {
    return await this.model.deleteMany({ where: { completed: true } });
  }
}

export default new TodoService();
