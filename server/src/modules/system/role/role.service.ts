import { BaseService } from "@/core/base.service";
import { Result } from "@/core/result";
import prisma from "@/core/prisma";

class RoleService extends BaseService {
  constructor() {
    super("role");
  }

  async pageList(page: number, pageSize: number, params: any) {
    const where: any = {};
    if (params.roleName) where.roleName = { contains: params.roleName };
    if (params.roleCode) where.roleCode = { contains: params.roleCode };
    if (params.description) where.description = { contains: params.description };
    if (params.enabled !== undefined) where.enabled = params.enabled;

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.model.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { createTime: "desc" },
      }),
      this.model.count({ where }),
    ]);
    return { list, total };
  }

  // 给角色分配菜单权限
  async updateMenus(roleId: number, menuIds: number[]) {
    await this.model.update({
      where: { id: roleId },
      data: {
        menus: { set: menuIds.map((mid) => ({ id: mid })) },
      },
    });
    return Result.success(null, "权限分配成功");
  }

  // 获取某个角色拥有的菜单 ID 列表（回显用）
  async getMenuIdsByRoleId(roleId: number) {
    const role = await this.model.findUnique({
      where: { id: roleId },
      include: { menus: true },
    });
    const menuIds = role?.menus.map((m: any) => m.id) || [];
    return Result.success(menuIds);
  }

  // 分配数据权限
  async updateDataScope(roleId: number, dataScope: number, deptIds: number[] = []) {
    const deptsUpdate =
      dataScope === 2 ? { set: deptIds.map((id) => ({ id })) } : { set: [] };
    await this.model.update({
      where: { id: roleId },
      data: { dataScope, depts: deptsUpdate },
    });
    return Result.success(null, "数据权限分配成功");
  }
}

export default new RoleService();
