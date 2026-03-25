import { BaseService } from "@/core/base.service";
import { AuthUtil } from "@/core/auth.util";
import { Result } from "@/core/result";

/** 从用户对象中移除敏感字段后返回 */
function omitPassword<T extends { password?: unknown }>(user: T): Omit<T, "password"> {
  const { password: _pwd, ...rest } = user;
  return rest;
}

class UserService extends BaseService {
  constructor() {
    super("user");
  }

  // 覆写 add：先对密码做 SHA-256（与前端保持一致），再 bcrypt 加密存储
  async add(data: any) {
    if (data.password) {
      data.password = AuthUtil.hashPassword(AuthUtil.sha256(data.password));
    }
    const res = await super.add(data);
    return omitPassword(res);
  }

  // 覆写 update：同上，如果没传密码则不更新
  async update(id: number, data: any) {
    if (data.avatar && data.avatar.length > 10 * 1024 * 1024) {
      throw new Error("头像文件过大，请上传小于 5MB 的图片");
    }

    if (data.password) {
      data.password = AuthUtil.hashPassword(AuthUtil.sha256(data.password));
    } else {
      delete data.password;
    }

    const res = await super.update(id, data);
    return omitPassword(res);
  }

  // 分页查询：显示用户所属部门、拥有角色，过滤密码
  async pageList(page: number, pageSize: number, params: any) {
    const where: any = {};
    if (params.userName) where.userName = { contains: params.userName };
    if (params.userPhone) where.userPhone = { contains: params.userPhone };
    if (params.userEmail) where.userEmail = { contains: params.userEmail };
    if (params.status) where.status = params.status;
    const skip = (page - 1) * pageSize;

    const [list, total] = await Promise.all([
      this.model.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { createTime: "desc" },
        include: {
          roles: { select: { roleCode: true } },
        },
      }),
      this.model.count({ where }),
    ]);

    const transformedList = list.map((u: any) => {
      const { password: _pwd, roles, ...rest } = u;
      return {
        ...rest,
        userRoles: roles.map((r: any) => r.roleCode),
      };
    });

    return { list: transformedList, total };
  }

  // 获取用户已分配的角色 ID 列表（分配弹窗回显用）
  async getUserRoles(userId: number) {
    const user = await this.model.findUnique({
      where: { id: userId },
      include: { roles: { select: { id: true } } },
    });
    return (user?.roles ?? []).map((r: any) => r.id);
  }

  // 给用户分配角色（覆盖更新）
  async assignRoles(userId: number, roleIds: number[]) {
    await this.model.update({
      where: { id: userId },
      data: {
        roles: {
          set: roleIds.map((id) => ({ id })),
        },
      },
    });
    return Result.success();
  }
}

export default new UserService();
