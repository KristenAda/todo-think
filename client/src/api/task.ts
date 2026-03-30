import request from '@/utils/http';

const BASE = {
  project: '/projects',
  task: '/tasks',
  performance: '/performance'
};

// ==================== Project API ====================

export function fetchProjectPage(params: Api.Task.ProjectPageParams) {
  return request.get<Api.Task.PageResult<Api.Task.Project>>({
    url: BASE.project,
    params
  });
}

export function fetchProjectList() {
  return request.get<Api.Task.SimpleProject[]>({
    url: `${BASE.project}/list`
  });
}

export function fetchProjectInfo(id: number) {
  return request.get<Api.Task.Project>({
    url: `${BASE.project}/${id}`
  });
}

export function fetchCreateProject(data: Api.Task.CreateProjectParams) {
  return request.post<Api.Task.Project>({
    url: BASE.project,
    data
  });
}

export function fetchUpdateProject(id: number, data: Api.Task.UpdateProjectParams) {
  return request.put<Api.Task.Project>({
    url: `${BASE.project}/${id}`,
    data
  });
}

export function fetchDeleteProject(id: number) {
  return request.delete({
    url: `${BASE.project}/${id}`
  });
}

// ==================== Task API ====================

export function fetchTaskPage(params: Api.Task.TaskPageParams) {
  return request.get<Api.Task.PageResult<Api.Task.Task>>({
    url: BASE.task,
    params
  });
}

export function fetchTaskInfo(id: number) {
  return request.get<Api.Task.Task>({
    url: `${BASE.task}/${id}`
  });
}

export function fetchCreateTask(data: Api.Task.CreateTaskParams) {
  return request.post<Api.Task.Task>({
    url: BASE.task,
    data
  });
}

export function fetchUpdateTask(id: number, data: Api.Task.UpdateTaskParams) {
  return request.put<Api.Task.Task>({
    url: `${BASE.task}/${id}`,
    data
  });
}

export function fetchDeleteTask(id: number) {
  return request.delete({
    url: `${BASE.task}/${id}`
  });
}

export function fetchStartWork(taskId: number) {
  return request.post<Api.Task.Task>({
    url: `${BASE.task}/${taskId}/start-work`
  });
}

export function fetchAddWorkLog(taskId: number, data: Api.Task.CreateWorkLogParams) {
  return request.post<Api.Task.WorkLog>({
    url: `${BASE.task}/${taskId}/worklogs`,
    data
  });
}

export function fetchSubmitTest(taskId: number, data: Api.Task.SubmitTestParams) {
  return request.post<Api.Task.Task>({
    url: `${BASE.task}/${taskId}/submit-test`,
    data
  });
}

export function fetchQaAudit(taskId: number, data: Api.Task.QaAuditParams) {
  return request.post<Api.Task.Task>({
    url: `${BASE.task}/${taskId}/qa-audit`,
    data
  });
}

// ==================== Performance API ====================

/** 效能统计 Mock 数据（当后端无数据时自动注入） */
function getMockPerformanceStats(
  params: Api.Task.PerformancePageParams
): Api.Task.PageResult<Api.Task.PerformanceStat> {
  const mockUsers: Api.Task.SimpleUser[] = [
    { id: 101, userName: 'zhangwei', nickName: '张威', avatar: null, userEmail: 'zhangwei@demo.com' },
    { id: 102, userName: 'liuna', nickName: '刘娜', avatar: null, userEmail: 'liuna@demo.com' },
    { id: 103, userName: 'wangfang', nickName: '王芳', avatar: null, userEmail: 'wangfang@demo.com' },
    { id: 104, userName: 'chenbo', nickName: '陈博', avatar: null, userEmail: 'chenbo@demo.com' },
    { id: 105, userName: 'sunli', nickName: '孙丽', avatar: null, userEmail: 'sunli@demo.com' },
    { id: 106, userName: 'zhaoyong', nickName: '赵勇', avatar: null, userEmail: 'zhaoyong@demo.com' }
  ];

  const rawStats: Api.Task.PerformanceStat[] = [
    { user: mockUsers[0], totalTasks: 18, totalActualHours: 92.5, totalEstimatedHours: 80, totalBugCount: 1, firstPassCount: 16, firstPassRate: 89 },
    { user: mockUsers[1], totalTasks: 12, totalActualHours: 56, totalEstimatedHours: 60, totalBugCount: 0, firstPassCount: 12, firstPassRate: 100 },
    { user: mockUsers[2], totalTasks: 21, totalActualHours: 115, totalEstimatedHours: 100, totalBugCount: 3, firstPassCount: 15, firstPassRate: 71 },
    { user: mockUsers[3], totalTasks: 9, totalActualHours: 38, totalEstimatedHours: 45, totalBugCount: 0, firstPassCount: 9, firstPassRate: 100 },
    { user: mockUsers[4], totalTasks: 15, totalActualHours: 72, totalEstimatedHours: 70, totalBugCount: 2, firstPassCount: 10, firstPassRate: 67 },
    { user: mockUsers[5], totalTasks: 7, totalActualHours: 28, totalEstimatedHours: 35, totalBugCount: 4, firstPassCount: 3, firstPassRate: 43 }
  ];

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const total = rawStats.length;
  const list = rawStats.slice((page - 1) * pageSize, page * pageSize);

  return { list, total, page, pageSize, totalPage: Math.ceil(total / pageSize) };
}

export async function fetchPerformanceStats(
  params: Api.Task.PerformancePageParams
): Promise<Api.Task.PageResult<Api.Task.PerformanceStat>> {
  try {
    const result = await request.get<Api.Task.PageResult<Api.Task.PerformanceStat>>({
      url: `${BASE.performance}/stats`,
      params
    });
    // 后端有真实数据时直接返回
    if (result && result.list && result.list.length > 0) return result;
  } catch {
    // 接口报错时降级到 mock
  }
  // 后端无数据或出错时注入 mock
  return getMockPerformanceStats(params);
}

// ==================== Org Members API ====================

/** 获取当前用户所在组织及下级组织的成员（任务负责人候选） */
export function fetchOrgMembers() {
  return request.get<Api.Task.SimpleUser[]>({
    url: `${BASE.project}/org-members`
  });
}
