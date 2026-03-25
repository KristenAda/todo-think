import { BaseService } from "@/core/base.service";
import { AuthUtil } from "@/core/auth.util";
import prisma from "@/core/prisma";

class AuthService extends BaseService {
  constructor() {
    super("user");
  }

  // 注册（前端已对密码做 SHA-256，后端直接 bcrypt 存储）
  async register(data: any) {
    const exist = await this.model.findUnique({
      where: { userName: data.userName },
    });
    if (exist) throw new Error("用户名已存在");

    data.password = AuthUtil.hashPassword(data.password);
    return await this.model.create({ data });
  }

  // 登录（前端传入 sha256(明文)，与 bcrypt(sha256(明文)) 比对）
  async login(userName: string, password: string) {
    const user = await this.model.findUnique({ where: { userName } });
    if (!user) throw new Error("用户不存在");

    if (!AuthUtil.comparePassword(password, user.password)) {
      throw new Error("密码错误");
    }

    const userInfo = await this.getUserInfo(user.id);
    const token = AuthUtil.signToken({ id: user.id, userName: user.userName, roles: userInfo.roles });
    return { token, ...userInfo };
  }

  /**
   * 获取当前登录用户信息（包含角色和按钮权限）
   */
  async getUserInfo(userId: number) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        status: "1",
      },
      include: {
        roles: {
          where: {
            enabled: true,
            deletedAt: null,
          },
        },
      },
    });

    if (!user) {
      throw new Error("用户不存在或已被停用");
    }

    const roles = user.roles.map((r) => r.roleCode);
    const isAdmin = roles.includes("admin");

    let permissions: string[] = [];

    if (isAdmin) {
      permissions = ["*:*:*"];
    } else if (user.roles.length > 0) {
      const roleIds = user.roles.map((r) => r.id);

      const menus = await prisma.menu.findMany({
        where: {
          roleMenus: { some: { id: { in: roleIds } } },
          type: { in: [2, 3] },
        },
        select: { authList: true },
      });

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
