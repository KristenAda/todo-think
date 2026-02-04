// src/modules/system/user/user.service.ts
import { BaseService } from "@/core/base.service";
import { AuthUtil } from "@/core/auth.util";
import { Result } from "@/core/result";

class UserService extends BaseService {
  constructor() {
    super("user");
  }

  // 覆写 add：因为要加密密码
  async add(data: any) {
    if (data.password) {
      data.password = AuthUtil.hashPassword(data.password);
    }
    return super.add(data);
  }

  // 覆写 update：如果没传密码，去掉密码字段防止被置空
  async update(id: number, data: any) {
    if (data.password) {
      data.password = AuthUtil.hashPassword(data.password);
    } else {
      delete data.password; // 不更新密码
    }
    return super.update(id, data);
  }

  // 分页查询：需要显示用户所属部门、拥有角色
  async pageList(page: number, pageSize: number, params: any) {
    const where: any = {};
    if (params.username) where.username = { contains: params.username };
    if (params.deptId) where.deptId = Number(params.deptId);

    const skip = (page - 1) * pageSize;

    // Prisma 连表查询
    const [list, total] = await Promise.all([
      this.model.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          dept: true, // 显示部门信息
          roles: true, // 显示角色信息
        },
      }),
      this.model.count({ where }),
    ]);

    // 可以在这里把 password 字段剔除，防止泄露
    list.forEach((u: any) => delete u.password);

    return { list, total };
  }

  // ★★★ 核心：给用户分配角色 ★★★
  async assignRoles(userId: number, roleIds: number[]) {
    await this.model.update({
      where: { id: userId },
      data: {
        roles: {
          set: roleIds.map((id) => ({ id })), // 覆盖更新
        },
      },
    });
    return Result.success();
  }
}

export default new UserService();
