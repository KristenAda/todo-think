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
  return request.del({
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
  return request.del({
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

export function fetchAddTaskComment(taskId: number, data: Api.Task.CreateTaskCommentParams) {
  return request.post<Api.Task.TaskComment>({
    url: `${BASE.task}/${taskId}/comments`,
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

// ==================== Task 逆向状态流转 API ====================

export function fetchPauseTask(taskId: number) {
  return request.post<Api.Task.Task>({
    url: `${BASE.task}/${taskId}/pause`
  });
}

export function fetchResumeTask(taskId: number) {
  return request.post<Api.Task.Task>({
    url: `${BASE.task}/${taskId}/resume`
  });
}

export function fetchReopenTask(taskId: number) {
  return request.post<Api.Task.Task>({
    url: `${BASE.task}/${taskId}/reopen`
  });
}

// ==================== Performance API ====================

/** 研发效能统计：按已完成任务聚合主负责人维度，分页由服务端完成 */
export function fetchPerformanceStats(params: Api.Task.PerformancePageParams) {
  return request.get<Api.Task.PerformanceStatsPageData>({
    url: `${BASE.performance}/stats`,
    params
  });
}

/** 当前用户累计积分（右上角货币展示） */
export function fetchMyTotalPoints() {
  return request.get<{ totalPoints: number }>({
    url: `${BASE.performance}/my-total-points`
  });
}

/** 积分流水：分页列表（含当前筛选条件下的积分合计） */
export function fetchPointsLedgerPage(params: Api.Task.PointsLedgerPageParams) {
  return request.get<Api.Task.PointsLedgerPageData>({
    url: `${BASE.performance}/points-ledger`,
    params
  });
}

/** 积分流水：单条详情（规则重算说明、结算快照） */
export function fetchPointsLedgerDetail(entryId: string) {
  return request.get<Api.Task.PointsLedgerDetail>({
    url: `${BASE.performance}/points-ledger/${encodeURIComponent(entryId)}`
  });
}

// ==================== Rule Engine API ====================

export function fetchRuleSetList(params?: { projectId?: number }) {
  return request.get<Api.Task.RuleSet[]>({
    url: '/rule-sets',
    params
  });
}

export function fetchCreateRuleSet(data: Api.Task.CreateRuleSetParams) {
  return request.post<Api.Task.RuleSet>({
    url: '/rule-sets',
    data
  });
}

export function fetchUpdateRuleSet(id: number, data: Partial<Api.Task.CreateRuleSetParams> & { status?: string }) {
  return request.put<Api.Task.RuleSet>({
    url: `/rule-sets/${id}`,
    data
  });
}

export function fetchDeleteRuleSet(id: number) {
  return request.del<Api.Task.RuleSet>({
    url: `/rule-sets/${id}`
  });
}

export function fetchRuleSetVersions(ruleSetId: number) {
  return request.get<Api.Task.RuleSetVersion[]>({
    url: `/rule-sets/${ruleSetId}/versions`
  });
}

export function fetchRuleSetVersionDetail(versionId: number) {
  return request.get<Api.Task.RuleSetVersion>({
    url: `/rule-set-versions/${versionId}`
  });
}

export function fetchPublishRuleSetVersion(ruleSetId: number, data: Api.Task.PublishRuleSetVersionParams) {
  return request.post<Api.Task.RuleSetVersion>({
    url: `/rule-sets/${ruleSetId}/publish`,
    data
  });
}

export function fetchSaveRuleSetDraft(
  ruleSetId: number,
  data: { definition?: Record<string, unknown>; variables?: unknown[] }
) {
  return request.put<Api.Task.RuleSet>({
    url: `/rule-sets/${ruleSetId}/draft`,
    data
  });
}

export function fetchScoringRuleVersions(projectId: number) {
  return request.get<Api.Task.ScoringRuleVersionOption[]>({
    url: `${BASE.project}/${projectId}/scoring-rule-versions`
  });
}

export function fetchSetActiveScoringRuleVersion(
  projectId: number,
  data: { activeRuleSetVersionId: number | null }
) {
  return request.put<{ id: number; activeRuleSetVersionId: number | null }>({
    url: `${BASE.project}/${projectId}/active-scoring-rule-version`,
    data
  });
}

export function fetchSimulateRuleSet(data: Api.Task.SimulateRuleSetParams) {
  return request.post<Api.Task.RuleSimulationResult>({
    url: '/rule-sets/simulate',
    data
  });
}

export function fetchCreateTaskAdjustment(data: Api.Task.CreateTaskAdjustmentParams) {
  return request.post({
    url: '/rule-sets/adjustments',
    data
  });
}

export function fetchRuleVariables(params?: { projectId?: number }) {
  return request.get<Api.Task.RuleVariable[]>({
    url: '/rule-variables',
    params
  });
}

export function fetchUpsertRuleVariables(data: { variables: Api.Task.RuleVariable[] }) {
  return request.post<Api.Task.RuleVariable[]>({
    url: '/rule-variables/upsert',
    data
  });
}

// ==================== Org Members API ====================

/** 获取当前用户所在组织及下级组织的成员（任务负责人候选） */
export function fetchOrgMembers() {
  return request.get<Api.Task.SimpleUser[]>({
    url: `${BASE.project}/org-members`
  });
}
