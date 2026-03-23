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
    // 验证头像大小（base64 字符串）
    if (data.avatar) {
      // base64 字符串大小约为原文件的 1.33 倍
      // 限制 base64 字符串不超过 10MB（约 7.5MB 的原文件）
      if (data.avatar.length > 10 * 1024 * 1024) {
        throw new Error("头像文件过大，请上传小于 5MB 的图片");
      }
    }

    if (data.password) {
      data.password = AuthUtil.hashPassword(data.password);
    } else {
      delete data.password; // 不更新密码
    }

    try {
      return await super.update(id, data);
    } catch (error: any) {
      console.error("用户更新失败:", error);
      if (error.code === "P2025") {
        throw new Error("用户不存在");
      }
      throw error;
    }
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

  // 获取用户已分配的角色ID列表（分配弹窗回显用）
  async getUserRoles(userId: number) {
    const user = await this.model.findUnique({
      where: { id: userId },
      include: { roles: { select: { id: true } } },
    });
    return (user?.roles ?? []).map((r: any) => r.id);
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
