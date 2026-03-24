import { BaseService } from "@/core/base.service";
import { AuthUtil } from "@/core/auth.util";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class AuthService extends BaseService {
  constructor() {
    super("user"); // 操作 User 表
  }

  // 注册
  async register(data: any) {
    // 检查用户名是否存在
    const exist = await this.model.findUnique({
      where: { userName: data.userName },
    });
    if (exist) throw new Error("用户名已存在");

    // 密码加密
    data.password = AuthUtil.hashPassword(data.password);
    return await this.model.create({ data });
  }

  // 登录
  async login(userName: string, password: string) {
    // 1. 找用户
    const user = await this.model.findUnique({ where: { userName } });
    if (!user) throw new Error("用户不存在");

    // 2. 比对密码
    if (!AuthUtil.comparePassword(password, user.password)) {
      throw new Error("密码错误");
    }

    // 3. 生成 Token
    const token = AuthUtil.signToken({ id: user.id, userName: user.userName });

    // 4. 获取完整用户信息（含角色、权限），一并返回给前端
    const userInfo = await this.getUserInfo(user.id);
    return { token, ...userInfo };
  }

  /**
   * ★ 获取当前登录用户信息（包含角色和按钮权限）
   * 通常在前端调用 /auth/info 接口时触发
   */
  async getUserInfo(userId: number) {
    // 1. 获取用户信息及关联的有效角色
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null, // 过滤已软删除的用户
        status: "1", // 用户必须是启用状态（字符串类型）
      },
      include: {
        roles: {
          where: {
            enabled: true, // 角色必须是启用状态
            deletedAt: null, // 过滤已软删除的角色
          },
        },
      },
    });

    if (!user) {
      throw new Error("用户不存在或已被停用");
    }

    // 2. 提取角色标识集合 (roleCode)
    const roles = user.roles.map((r) => r.roleCode);
    const isAdmin = roles.includes("admin");

    // 3. 提取操作权限标识集合
    let permissions: string[] = [];

    if (isAdmin) {
      // 超级管理员直接赋予通配符权限
      permissions = ["*:*:*"];
    } else if (user.roles.length > 0) {
      // 普通用户：根据其拥有的有效角色去 Menu 表连表查询权限标识
      const roleIds = user.roles.map((r) => r.id);

      const menus = await prisma.menu.findMany({
        where: {
          roleMenus: {
            some: {
              id: { in: roleIds },
            },
          },
          type: { in: [2, 3] },
        },
        select: {
          authList: true, // 查询 authList 字段
        },
      });

      // 从 authList JSON 中提取权限标识并去重
      const permsSet = new Set<string>();
      menus.forEach((menu) => {
        if (menu.authList) {
          try {
            const authList = JSON.parse(menu.authList);
            if (Array.isArray(authList)) {
              authList.forEach((auth: { authMark: string }) => {
                if (auth.authMark) permsSet.add(auth.authMark);
              });
            }
          } catch {}
        }
      });
      permissions = Array.from(permsSet);
    }

    // 4. 清除敏感数据，防止密码等字段泄漏到前端
    const { password, deletedAt, ...safeUserInfo } = user as any;

    // 5. 返回前端所需的标准结构
    return {
      userId: user.id,
      userName: user.userName,
      email: user.userEmail,
      avatar: user.avatar,
      roles,
      buttons: permissions,
    };
  }
}

export default new AuthService();
