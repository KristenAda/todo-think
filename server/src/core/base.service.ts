import prisma from "@/core/prisma";
import { Prisma } from "@prisma/client";

/**
 * 利用 Prisma DMMF 元数据，过滤掉模型中不存在的字段
 * 防止前端传入多余字段导致 Prisma 报错
 */
function filterFields(modelName: string, data: Record<string, unknown>): Record<string, unknown> {
  try {
    const model = Prisma.dmmf.datamodel.models.find(
      (m) => m.name.toLowerCase() === modelName.toLowerCase(),
    );
    if (!model) return data;

    const validFields = new Set(model.fields.map((f) => f.name));
    const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (validFields.has(key)) {
        filtered[key] = data[key];
      }
    }
    return filtered;
  } catch {
    // DMMF 不可用时直接返回原始数据，不阻断业务
    return data;
  }
}

export class BaseService {
  public model: any;
  private modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
    this.model = (prisma as any)[modelName];
  }

  // 通用分页查询
  async page(page: number = 1, pageSize: number = 10, where: any = {}) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.model.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { id: "desc" },
      }),
      this.model.count({ where }),
    ]);
    return { list, total };
  }

  // 通用详情
  async info(id: number) {
    return await this.model.findUnique({ where: { id } });
  }

  // 通用新增（自动过滤多余字段）
  async add(data: any) {
    const clean = filterFields(this.modelName, { ...data });
    delete clean.id;
    return await this.model.create({ data: clean });
  }

  // 通用更新（自动过滤多余字段）
  async update(id: number, data: any) {
    const clean = filterFields(this.modelName, { ...data });
    delete clean.id;
    return await this.model.update({ where: { id }, data: clean });
  }

  // 通用删除
  async delete(id: number) {
    return await this.model.delete({ where: { id } });
  }
}
