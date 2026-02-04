import { BaseService } from "@/core/base.service";
import { Result } from "@/core/result";

class MenuService extends BaseService {
  constructor() {
    super("menu"); // 操作 prisma.menu
  }

  // 覆写基类的 list，因为菜单管理通常不需要分页，而是查全部
  async listAll() {
    const list = await this.model.findMany({
      orderBy: { sort: "asc" }, // 按 sort 字段排序
    });
    return Result.success(this.listToTree(list));
  }

  // 获取当前用户的菜单树 (留个坑，后面做角色关联时用)
  async getUserMenus(userId: number) {
    // 目前先返回所有，后面会改成根据 Role 过滤
    return this.listAll();
  }

  // === 工具方法：把扁平数组转成树形结构 ===
  private listToTree(list: any[], parentId: number | null = null): any[] {
    const tree: any[] = [];
    for (const item of list) {
      if (item.parentId === parentId) {
        const children = this.listToTree(list, item.id);
        if (children.length > 0) {
          item.children = children;
        }
        tree.push(item);
      }
    }
    return tree;
  }
}

export default new MenuService();
