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
    // 转换为前端期望的 meta 嵌套格式，与管理端表格和弹窗对齐
    return Result.success(this.transformToFrontendFormat(this.listToTree(list)));
  }

  // 获取当前登录用户的导航菜单树（动态路由专用）
  // - 超级管理员 (roleCode=admin)：返回全部目录+菜单
  // - 普通用户：根据角色关联，只返回有权限的目录+菜单
  async getUserMenus(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { enabled: true, deletedAt: null },
        },
      },
    });

    if (!user) return Result.success([]);

    const isAdmin = user.roles.some((r: any) => r.roleCode === "admin");

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
          roleMenus: { some: { id: { in: roleIds } } },
        },
        orderBy: { sort: "asc" },
      });
    } else {
      list = [];
    }

    // 转换为前端期望的格式（包含 meta 对象）
    return Result.success(this.transformToFrontendFormat(this.listToTree(list)));
  }

  // 转换菜单数据为前端期望的格式
  private transformToFrontendFormat(menus: any[]): any[] {
    return menus.map((menu) => {
      const meta: any = {
        title: menu.title,
        icon: menu.icon,
        sort: menu.sort,
        isEnable: menu.isEnable,
        keepAlive: menu.keepAlive,
        isIframe: menu.isIframe,
        isHide: menu.isHide,
        isHideTab: menu.isHideTab,
        link: menu.link,
        showBadge: menu.showBadge,
        showTextBadge: menu.showTextBadge,
        fixedTab: menu.fixedTab,
        activePath: menu.activePath,
        isFullPage: menu.isFullPage,
      };

      // 解析 roles 和 authList
      if (menu.roles) {
        try {
          meta.roles = JSON.parse(menu.roles);
        } catch {
          meta.roles = [];
        }
      }

      if (menu.authList) {
        try {
          meta.authList = JSON.parse(menu.authList);
        } catch {
          meta.authList = [];
        }
      }

      const result: any = {
        id: menu.id,
        name: menu.name,
        path: menu.path,
        component: menu.component,
        meta,
      };

      // 递归处理子菜单
      if (menu.children && menu.children.length > 0) {
        result.children = this.transformToFrontendFormat(menu.children);
      }

      return result;
    });
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
