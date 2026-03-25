import prisma from '@/core/prisma';
import { CreateProjectDtoType, UpdateProjectDtoType, ProjectPageDtoType } from './project.dto';

const managerSelect = {
  id: true,
  userName: true,
  nickName: true,
  avatar: true,
  userEmail: true,
};

class ProjectService {
  async page(dto: ProjectPageDtoType) {
    const { page, pageSize, name, status } = dto;
    const where: any = { deletedAt: null };
    if (name) where.name = { contains: name };
    if (status) where.status = status;

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createTime: 'desc' },
        include: {
          manager: { select: managerSelect },
          _count: { select: { tasks: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);
    return { list, total };
  }

  async info(id: number) {
    return prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        manager: { select: managerSelect },
        _count: { select: { tasks: true } },
      },
    });
  }

  async create(dto: CreateProjectDtoType) {
    return prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        managerId: dto.managerId,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: { manager: { select: managerSelect } },
    });
  }

  async update(id: number, dto: UpdateProjectDtoType) {
    return prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
      },
      include: { manager: { select: managerSelect } },
    });
  }

  // 软删除
  async delete(id: number) {
    return prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // 获取全量未删除项目（供下拉选择）
  async listAll() {
    return prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { createTime: 'desc' },
      select: { id: true, name: true, status: true },
    });
  }

  /**
   * 获取「当前用户所在组织及所有下级组织」的成员列表
   * 用于项目负责人候选人下拉框
   *
   * 逻辑：
   *  1. 找到当前用户所属的部门 ID 列表
   *  2. 查询所有部门，找出 ancestors 字段中包含这些部门 ID 的下级部门
   *  3. 合并所有相关部门 ID，查询成员并去重
   *  4. 兜底：若用户不在任何部门，返回全量用户
   */
  async getOrgMembers(currentUserId: number) {
    // 1. 找当前用户所在部门
    const myMemberships = await prisma.deptMember.findMany({
      where: { userId: currentUserId },
      select: { deptId: true },
    });
    const myDeptIds = myMemberships.map((m) => m.deptId);

    // 兜底：用户不在任何部门 → 返回全量用户
    if (myDeptIds.length === 0) {
      return prisma.user.findMany({
        where: { deletedAt: null },
        select: managerSelect,
        orderBy: { id: 'asc' },
      });
    }

    // 2. 查询所有未删除部门
    const allDepts = await prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, ancestors: true },
    });

    // 3. 找出「自身部门」及「ancestors 中包含自身部门 ID 的下级部门」
    const myDeptIdSet = new Set(myDeptIds.map(String));
    const relatedDeptIds = new Set<number>(myDeptIds);

    for (const dept of allDepts) {
      if (!dept.ancestors) continue;
      // ancestors 格式如 "0,1,5"，逗号分隔
      const ancestorIds = dept.ancestors.split(',').map((s) => s.trim()).filter(Boolean);
      const isDescendant = ancestorIds.some((aid) => myDeptIdSet.has(aid));
      if (isDescendant) relatedDeptIds.add(dept.id);
    }

    // 4. 查询这些部门的所有成员（去重）
    const memberRows = await prisma.deptMember.findMany({
      where: { deptId: { in: Array.from(relatedDeptIds) } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const memberUserIds = memberRows.map((r) => r.userId);

    // 确保当前用户自己也在候选人列表中
    if (!memberUserIds.includes(currentUserId)) {
      memberUserIds.push(currentUserId);
    }

    return prisma.user.findMany({
      where: { id: { in: memberUserIds }, deletedAt: null },
      select: managerSelect,
      orderBy: { id: 'asc' },
    });
  }
}

export default new ProjectService();
