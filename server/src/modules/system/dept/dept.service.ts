// src/modules/system/dept/dept.service.ts
import { BaseService } from "@/core/base.service";
import { Result } from "@/core/result";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class DeptService extends BaseService {
  constructor() {
    super("department");
  }

  // 1. 获取部门树 (包含负责人信息)
  async getTree(params: any) {
    const where: any = {};
    if (params.name) where.name = { contains: params.name };

    const list = await this.model.findMany({
      where,
      orderBy: { sort: "asc" },
      include: {
        manager: { select: { id: true, nickname: true, username: true } }, // 查出负责人的名字
        _count: { select: { users: true } }, // 顺便查出部门有多少人
      },
    });

    return Result.success(this.listToTree(list));
  }

  // 2. 删除部门 (增强版：有子部门或有员工时禁止删除)
  async deleteDept(id: number) {
    // 检查子部门
    const hasChildren = await this.model.findFirst({ where: { parentId: id } });
    if (hasChildren) throw new Error("该部门下存在子部门，无法删除");

    // 检查员工
    const hasUsers = await prisma.user.findFirst({ where: { deptId: id } });
    if (hasUsers) throw new Error("该部门下尚有员工，无法删除");

    return super.delete(id);
  }

  // 3. 向部门添加员工 (可以是批量)
  async addEmployees(deptId: number, userIds: number[]) {
    // 也就是把这些 User 的 deptId 改为当前 deptId
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { deptId: deptId },
    });
    return Result.success();
  }

  // 4. 从部门移除员工
  async removeEmployees(userIds: number[]) {
    // 把 deptId 置空
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { deptId: null },
    });
    return Result.success();
  }

  // 5. 获取部门下的员工列表
  async getEmployees(deptId: number, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where: { deptId },
        skip,
        take: pageSize,
        select: {
          id: true,
          username: true,
          nickname: true,
          email: true,
          status: true,
        }, // 不查密码
      }),
      prisma.user.count({ where: { deptId } }),
    ]);
    return { list, total };
  }

  // === 工具：转树结构 ===
  private listToTree(list: any[], parentId: number | null = null): any[] {
    const tree: any[] = [];
    for (const item of list) {
      if (item.parentId === parentId) {
        const children = this.listToTree(list, item.id);
        if (children.length > 0) item.children = children;
        tree.push(item);
      }
    }
    return tree;
  }
}

export default new DeptService();
