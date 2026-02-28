import { BaseService } from "@/core/base.service";
import { AuthUtil } from "@/core/auth.util";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class AuthService extends BaseService {
  constructor() {
    super("user"); // 操作 User 表
  }

  // 注册1
  async register(data: any) {
    // 检查用户名是否存在
    const exist = await this.model.findUnique({
      where: { username: data.username },
    });
    if (exist) throw new Error("用户名已存在");

    // 密码加密
    data.password = AuthUtil.hashPassword(data.password);
    return await this.model.create({ data });
  }

  // 登录
  async login(username: string, password: string) {
    // <-- 修正：这里参数是 string
    // 1. 找用户
    const user = await this.model.findUnique({ where: { username } });
    if (!user) throw new Error("用户不存在");

    // 2. 比对密码
    if (!AuthUtil.comparePassword(password, user.password)) {
      throw new Error("密码错误");
    }

    // 3. 生成 Token (不把密码放进去)
    const token = AuthUtil.signToken({ id: user.id, username: user.username });
    return {
      token,
      user: { id: user.id, username: user.username, nickname: user.nickname },
    };
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
        status: 1, // 用户必须是启用状态
      },
      include: {
        roles: {
          where: {
            status: 1, // 角色必须是启用状态
            deletedAt: null, // 过滤已软删除的角色
          },
        },
      },
    });

    if (!user) {
      throw new Error("用户不存在或已被停用");
    }

    // 2. 提取角色标识集合 (roleKey)
    const roles = user.roles.map((r) => r.roleKey);
    const isAdmin = roles.includes("admin");

    // 3. 提取操作权限标识集合 (perms)
    let permissions: string[] = [];

    if (isAdmin) {
      // 超级管理员直接赋予通配符权限
      permissions = ["*:*:*"];
    } else if (user.roles.length > 0) {
      // 普通用户：根据其拥有的有效角色去 Menu 表连表查询权限标识
      const roleIds = user.roles.map((r) => r.id);

      const menus = await prisma.menu.findMany({
        where: {
          roles: {
            some: {
              id: { in: roleIds }, // 只要菜单关联的角色ID在这个用户的角色列表里就行
            },
          },
          perms: {
            not: null, // 必须配置了权限标识
          },
          // 只有菜单(2)和按钮(3)通常需要收集 perms 进行鉴权，目录(1)不需要
          type: {
            in: [2, 3],
          },
        },
        select: {
          perms: true, // 只查 perms 字段，减少网络传输和内存占用
        },
      });

      // 提取 perms、过滤空字符串并去重 (不同角色可能拥有相同的菜单权限)
      const permsSet = new Set<string>();
      menus.forEach((menu) => {
        if (menu.perms && menu.perms.trim() !== "") {
          // 处理有些框架用逗号分割多个权限的情况（比如 "system:user:add,system:user:edit"）
          const permArray = menu.perms.split(",");
          permArray.forEach((p) => permsSet.add(p.trim()));
        }
      });
      permissions = Array.from(permsSet);
    }

    // 4. 清除敏感数据，防止密码等字段泄漏到前端
    const { password, deletedAt, ...safeUserInfo } = user;

    // 5. 返回前端成熟框架 (如 Vben/RuoYi) 所需的标准结构
    return {
      user: safeUserInfo,
      roles,
      permissions,
    };
  }
}

export default new AuthService();
