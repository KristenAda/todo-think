import { BaseService } from "@/core/base.service";
import { Result } from "@/core/result";
import prisma from "@/core/prisma";

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
    return Result.success(
      this.transformToFrontendFormat(this.listToTree(list))
    );
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

    if (!user) {
      // 抛出 401 状态码，通知前端此 Token 的用户在库中已不存在
      throw { status: 401, message: "用户信息异常或已失效，请重新登录" };
    }

    const isAdmin = user.roles.some((r: any) => r.roleCode === "admin");

    const defaultRoles = await prisma.role.findMany({
      where: { isDefaultRole: true, enabled: true, deletedAt: null },
      select: { id: true },
    });
    const mergedRoleIds = [
      ...new Set<number>([
        ...user.roles.map((r: any) => r.id as number),
        ...defaultRoles.map((r) => r.id),
      ]),
    ];

    let list: any[];
    if (isAdmin) {
      // 超级管理员：全部导航菜单（排除按钮 type=3）
      list = await this.model.findMany({
        where: { type: { in: [1, 2] } },
        orderBy: { sort: "asc" },
      });
    } else if (mergedRoleIds.length > 0) {
      // 普通用户：已分配角色 +「默认角色」合并后的菜单
      list = await this.model.findMany({
        where: {
          type: { in: [1, 2] },
          roleMenus: { some: { id: { in: mergedRoleIds } } },
        },
        orderBy: { sort: "asc" },
      });
    } else {
      list = [];
    }

    // 转换为前端期望的格式（包含 meta 对象）
    return Result.success(
      this.transformToFrontendFormat(this.listToTree(list))
    );
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
        parentId: menu.parentId ?? null,
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

  /** 更新菜单：校验上级变更不会产生循环引用（不能把菜单挪到自己的子树下） */
  async update(id: number, data: Record<string, unknown>) {
    if ("parentId" in data && data.parentId !== undefined) {
      const pid = data.parentId as number | null;
      if (pid !== null) {
        if (pid === id) {
          const e = new Error("上级菜单不能为当前菜单本身") as Error & { status: number };
          e.status = 400;
          throw e;
        }
        const invalid = await this.isUnderSubtree(id, pid);
        if (invalid) {
          const e = new Error("不能将菜单移动到其子菜单之下") as Error & { status: number };
          e.status = 400;
          throw e;
        }
      }
    }
    return super.update(id, data);
  }

  /** 从 nodeId 沿 parent 链向上走，若遇到 ancestorId 则说明 nodeId 在 ancestorId 的子树中 */
  private async isUnderSubtree(ancestorId: number, nodeId: number): Promise<boolean> {
    let cur: number | null = nodeId;
    let guard = 0;
    while (cur != null && guard++ < 10000) {
      if (cur === ancestorId) return true;
      const menuRow = (await this.model.findUnique({
        where: { id: cur },
        select: { parentId: true },
      })) as { parentId: number | null } | null;
      cur = menuRow?.parentId ?? null;
    }
    return false;
  }
}

export default new MenuService();
