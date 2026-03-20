import { BaseService } from "@/core/base.service";
import { Result } from "@/core/result";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class MenuService extends BaseService {
  constructor() {
    super("menu");
  }

  // 获取所有菜单（管理端列表），支持 title 模糊筛选
  async listAll(title?: string) {
    const where: any = {};
    if (title) where.title = { contains: title };

    const list = await this.model.findMany({
      where,
      orderBy: { sort: "asc" },
    });
    return Result.success(this.listToTree(list));
  }

  // 获取当前登录用户的导航菜单树（动态路由专用）
  // - 超级管理员 (roleKey=admin)：返回全部目录+菜单
  // - 普通用户：根据角色关联，只返回有权限的目录+菜单
  async getUserMenus(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { status: 1, deletedAt: null },
        },
      },
    });

    if (!user) return Result.success([]);

    const isAdmin = user.roles.some((r: any) => r.roleKey === "admin");

    let list: any[];
    if (isAdmin) {
      // 超级管理员：全部导航菜单（排除按钮 type=3）
      list = await this.model.findMany({
        where: { type: { in: [1, 2] } },
        orderBy: { sort: "asc" },
      });
    } else if (user.roles.length > 0) {
      const roleIds = user.roles.map((r: any) => r.id);
      // 普通用户：通过角色关联过滤
      list = await this.model.findMany({
        where: {
          type: { in: [1, 2] },
          roles: { some: { id: { in: roleIds } } },
        },
        orderBy: { sort: "asc" },
      });
    } else {
      list = [];
    }

    return Result.success(this.listToTree(list));
  }

  // === 工具方法：扁平数组 → 树形结构 ===
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
