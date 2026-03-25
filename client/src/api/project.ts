import request from '@/utils/http';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';

export interface ProjectItem {
  id: number;
  name: string;
  description: string | null;
  managerId: number;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createTime: string;
  updateTime: string;
  manager: { id: number; userName: string; nickName: string | null; avatar: string | null };
  _count: { tasks: number };
}

export interface ProjectPageParams {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: ProjectStatus;
}

export interface CreateProjectParams {
  name: string;
  description?: string;
  managerId: number;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export type OrgMemberItem = {
  id: number;
  userName: string;
  nickName: string | null;
  avatar: string | null;
  userEmail: string | null;
};

// request.get<T> 直接返回 T（即后端 data.data 字段），无需解构
export function fetchProjectOrgMembers() {
  return request.get<OrgMemberItem[]>({ url: '/projects/org-members' });
}

export function fetchProjectPage(params: ProjectPageParams) {
  return request.get<{ list: ProjectItem[]; total: number; page: number; pageSize: number }>({
    url: '/projects',
    params,
  });
}

export function fetchProjectCreate(data: CreateProjectParams) {
  return request.post<ProjectItem>({ url: '/projects', data });
}

export function fetchProjectUpdate(id: number, data: Partial<CreateProjectParams>) {
  return request.put<ProjectItem>({ url: `/projects/${id}`, data });
}

export function fetchProjectDelete(id: number) {
  return request.del({ url: `/projects/${id}` });
}
