import { BaseService } from "@/core/base.service";
import { AuthUtil } from "@/core/auth.util";

class AuthService extends BaseService {
  constructor() {
    super("user"); // 操作 User 表
  }

  // 注册
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
}

export default new AuthService();
