import request from '@/utils/http';

// ==================== 工作台 ====================

export interface WorkbenchStats {
  pendingCount: number;
  qaCount: number;
  completedCount: number;
  bugCount: number;
}

export interface WorkbenchTask {
  id: number;
  title: string;
  status: Api.Task.TaskStatus;
  projectId: number;
  updatedAt: string;
  createdAt: string;
  project: { id: number; name: string };
  mainAssignee: Api.Task.SimpleUser | null;
}

export interface WorkbenchData {
  stats: WorkbenchStats;
  pendingTasks: WorkbenchTask[];
  qaTasks: WorkbenchTask[];
  processedTasks: WorkbenchTask[];
}

export function fetchWorkbench() {
  return request.get<WorkbenchData>({ url: '/dashboard/workbench' });
}
