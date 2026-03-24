import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class BaseService {
  public model: any;

  constructor(modelName: string) {
    // 动态获取 Prisma 的模型，例如 prisma.todo
    this.model = (prisma as any)[modelName];
  }

  // 通用分页查询
  async page(page: number = 1, pageSize: number = 10, where: any = {}) {
    const skip = (page - 1) * pageSize;
    // 并行查询数据和总数
    const [list, total] = await Promise.all([
      this.model.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { id: "desc" }, // 使用 id 排序，避免依赖特定时间字段名
      }),
      this.model.count({ where }),
    ]);
    return { list, total };
  }

  // 通用详情
  async info(id: number) {
    return await this.model.findUnique({ where: { id } });
  }

  // 通用新增
  async add(data: any) {
    const insertData = { ...data };
    delete insertData.id;
    return await this.model.create({ data: insertData });
  }

  // 通用更新
  async update(id: number, data: any) {
    return await this.model.update({ where: { id }, data });
  }

  // 通用删除
  async delete(id: number) {
    return await this.model.delete({ where: { id } });
  }
}
