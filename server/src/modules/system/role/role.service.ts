import { BaseService } from "@/core/base.service";
import { Result } from "@/core/result";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class RoleService extends BaseService {
  constructor() {
    super("role");
  }

  // Java风格：通常查询会带分页，且可能带查询条件
  async pageList(page: number, pageSize: number, params: any) {
    const where: any = {};
    if (params.name) {
      where.name = { contains: params.name }; // 模糊搜索角色名
    }
    return this.page(page, pageSize, where);
  }

  // ★★★ 核心功能：给角色分配菜单权限 ★★★
  async updateMenus(roleId: number, menuIds: number[]) {
    // Prisma 的 set 语法：先清空原有关联，再建立新关联，一步到位
    await this.model.update({
      where: { id: roleId },
      data: {
        menus: {
          set: menuIds.map((mid) => ({ id: mid })), // 关联新的菜单ID列表
        },
      },
    });
    return Result.success(null, "权限分配成功");
  }

  // 获取某个角色拥有的菜单ID列表（回显用）
  async getMenuIdsByRoleId(roleId: number) {
    const role = await this.model.findUnique({
      where: { id: roleId },
      include: { menus: true }, // 连表查询菜单
    });
    // 只返回 id 数组
    const menuIds = role?.menus.map((m: any) => m.id) || [];
    return Result.success(menuIds);
  }
}

export default new RoleService();
