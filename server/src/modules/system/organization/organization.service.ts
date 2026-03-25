import prisma from '@/core/prisma';

const userSelect = {
  id: true,
  userName: true,
  nickName: true,
  userEmail: true,
  userPhone: true,
  userGender: true,
  avatar: true,
  status: true,
};

class OrganizationService {
  private buildTree(depts: any[], parentId: number | null = null): any[] {
    return depts
      .filter((d) => (d.parentId ?? null) === parentId)
      .map((d) => ({ ...d, children: this.buildTree(depts, d.id) }));
  }

  async getTree() {
    const depts = await prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      select: {
        id: true, parentId: true, name: true, sort: true,
        leader: true, phone: true, email: true, status: true, ancestors: true,
        _count: { select: { managers: true, members: true } },
      },
    });
    return this.buildTree(depts);
  }

  async getManagers(deptId: number) {
    const rows = await prisma.deptManager.findMany({
      where: { deptId },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => r.user);
  }

  async getMembers(deptId: number) {
    const rows = await prisma.deptMember.findMany({
      where: { deptId },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => r.user);
  }

  async addManagers(deptId: number, userIds: number[]) {
    const data = userIds.map((userId) => ({ deptId, userId }));
    await prisma.deptManager.createMany({ data, skipDuplicates: true });
  }

  async removeManager(deptId: number, userId: number) {
    await prisma.deptManager.delete({ where: { deptId_userId: { deptId, userId } } });
  }

  async addMembers(deptId: number, userIds: number[]) {
    const data = userIds.map((userId) => ({ deptId, userId }));
    await prisma.deptMember.createMany({ data, skipDuplicates: true });
  }

  async removeMember(deptId: number, userId: number) {
    await prisma.deptMember.delete({ where: { deptId_userId: { deptId, userId } } });
  }

  async isManager(deptId: number, userId: number): Promise<boolean> {
    const row = await prisma.deptManager.findUnique({
      where: { deptId_userId: { deptId, userId } },
    });
    return !!row;
  }

  async getAllUsers() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: userSelect,
      orderBy: { id: 'asc' },
    });
  }
}

export default new OrganizationService();
