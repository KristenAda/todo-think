import request from '@/utils/http';

const BASE = {
  project: '/projects',
  task: '/tasks',
  performance: '/performance',
};

// ==================== Project API ====================

export function fetchProjectPage(params: Api.Task.ProjectPageParams) {
  return request.get<Api.Task.PageResult<Api.Task.Project>>({
    url: BASE.project,
    params,
  });
}

export function fetchProjectList() {
  return request.get<Api.Task.SimpleProject[]>({
    url: `${BASE.project}/list`,
  });
}

export function fetchProjectInfo(id: number) {
  return request.get<Api.Task.Project>({
    url: `${BASE.project}/${id}`,
  });
}

export function fetchCreateProject(data: Api.Task.CreateProjectParams) {
  return request.post<Api.Task.Project>({
    url: BASE.project,
    data,
  });
}

export function fetchUpdateProject(id: number, data: Api.Task.UpdateProjectParams) {
  return request.put<Api.Task.Project>({
    url: `${BASE.project}/${id}`,
    data,
  });
}

export function fetchDeleteProject(id: number) {
  return request.delete({
    url: `${BASE.project}/${id}`,
  });
}

// ==================== Task API ====================

export function fetchTaskPage(params: Api.Task.TaskPageParams) {
  return request.get<Api.Task.PageResult<Api.Task.Task>>({
    url: BASE.task,
    params,
  });
}

export function fetchTaskInfo(id: number) {
  return request.get<Api.Task.Task>({
    url: `${BASE.task}/${id}`,
  });
}

export function fetchCreateTask(data: Api.Task.CreateTaskParams) {
  return request.post<Api.Task.Task>({
    url: BASE.task,
    data,
  });
}

export function fetchUpdateTask(id: number, data: Api.Task.UpdateTaskParams) {
  return request.put<Api.Task.Task>({
    url: `${BASE.task}/${id}`,
    data,
  });
}

export function fetchDeleteTask(id: number) {
  return request.delete({
    url: `${BASE.task}/${id}`,
  });
}

export function fetchStartWork(taskId: number) {
  return request.post<Api.Task.Task>({
    url: `${BASE.task}/${taskId}/start-work`,
  });
}

export function fetchAddWorkLog(taskId: number, data: Api.Task.CreateWorkLogParams) {
  return request.post<Api.Task.WorkLog>({
    url: `${BASE.task}/${taskId}/worklogs`,
    data,
  });
}

export function fetchSubmitTest(taskId: number, data: Api.Task.SubmitTestParams) {
  return request.post<Api.Task.Task>({
    url: `${BASE.task}/${taskId}/submit-test`,
    data,
  });
}

export function fetchQaAudit(taskId: number, data: Api.Task.QaAuditParams) {
  return request.post<Api.Task.Task>({
    url: `${BASE.task}/${taskId}/qa-audit`,
    data,
  });
}

// ==================== Performance API ====================

export function fetchPerformanceStats(projectId?: number) {
  return request.get<Api.Task.PerformanceStat[]>({
    url: `${BASE.performance}/stats`,
    params: projectId ? { projectId } : {},
  });
}

// ==================== Org Members API ====================

/** 获取当前用户所在组织及下级组织的成员（任务负责人候选） */
export function fetchOrgMembers() {
  return request.get<Api.Task.SimpleUser[]>({
    url: `${BASE.project}/org-members`,
  });
}
