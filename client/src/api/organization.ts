import request from '@/utils/http';

export function fetchDeptTree() {
  return request.get<Api.Organization.DeptTreeNode[]>({ url: '/departments/tree' });
}
export function fetchAllUsers() {
  return request.get<Api.Organization.OrgUser[]>({ url: '/departments/users' });
}
export function fetchDeptManagers(deptId: number) {
  return request.get<Api.Organization.OrgUser[]>({ url: `/departments/${deptId}/managers` });
}
export function fetchAddManagers(deptId: number, userIds: number[]) {
  return request.post({ url: `/departments/${deptId}/managers`, data: { userIds } });
}
export function fetchRemoveManager(deptId: number, userId: number) {
  return request.del({ url: `/departments/${deptId}/managers/${userId}` });
}
export function fetchDeptMembers(deptId: number) {
  return request.get<Api.Organization.OrgUser[]>({ url: `/departments/${deptId}/members` });
}
export function fetchAddMembers(deptId: number, userIds: number[]) {
  return request.post({ url: `/departments/${deptId}/members`, data: { userIds } });
}
export function fetchRemoveMember(deptId: number, userId: number) {
  return request.del({ url: `/departments/${deptId}/members/${userId}` });
}
