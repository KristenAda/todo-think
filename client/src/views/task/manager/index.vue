<template>
  <div class="task-manager-wrapper">
    <div class="search-bar">
      <div class="bar-left">
        <el-select v-model="query.projectId" placeholder="选择项目" clearable style="width:200px" @change="loadTasks">
          <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-input v-model="query.keyword" placeholder="搜索任务名称..." clearable style="width:220px" @keyup.enter="loadTasks" @clear="loadTasks" />
        <el-select v-model="query.status" placeholder="任务状态" clearable style="width:160px" @change="loadTasks">
          <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-button type="primary" @click="loadTasks">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>
      <div class="bar-right">
        <el-button type="primary" @click="openCreateDialog">+ 新建任务</el-button>
      </div>
    </div>

    <div class="table-card">
      <el-table v-loading="loading" :data="taskList" stripe row-key="id">
        <el-table-column prop="title" label="任务名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="所属项目" width="160">
          <template #default="{ row }"><span>{{ row.project?.name ?? '-' }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="主负责人" width="150">
          <template #default="{ row }">
            <div v-if="row.mainAssignee" class="user-cell">
              <el-avatar :size="26" :src="row.mainAssignee.avatar ?? undefined">{{ initials(row.mainAssignee) }}</el-avatar>
              <span>{{ row.mainAssignee.nickName || row.mainAssignee.userName }}</span>
            </div>
            <span v-else class="text-muted">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="协助人" width="150">
          <template #default="{ row }">
            <div class="avatar-group" v-if="row.coAssignees?.length">
              <el-tooltip v-for="ca in row.coAssignees.slice(0,4)" :key="ca.id" :content="ca.user.nickName || ca.user.userName" placement="top">
                <el-avatar :size="26" :src="ca.user.avatar ?? undefined" class="stacked-avatar">{{ initials(ca.user) }}</el-avatar>
              </el-tooltip>
              <span v-if="row.coAssignees.length > 4" class="more-count">+{{ row.coAssignees.length - 4 }}</span>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="预估工时" width="95" align="center">
          <template #default="{ row }">{{ row.estimatedHours != null ? row.estimatedHours + 'h' : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm title="确认删除该任务？" @confirm="handleDelete(row.id)">
              <template #reference><el-button link type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-bar">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize"
          :total="total" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next"
          background @size-change="loadTasks" @current-change="loadTasks" />
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <ArtDialog v-model="dialogVisible" :title="editingId ? '编辑任务' : '新建任务'" icon="solar:checklist-bold-duotone" width="700px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="任务名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入任务名称" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="所属项目" prop="projectId">
          <el-select v-model="form.projectId" placeholder="请选择项目" style="width:100%">
            <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入任务描述" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="主要负责人">
              <el-select v-model="form.mainAssigneeId" placeholder="请选择" clearable style="width:100%">
                <el-option v-for="u in userList" :key="u.id" :label="u.nickName || u.userName" :value="u.id" :disabled="form.coAssigneeIds.includes(u.id)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="协助负责人">
              <el-select v-model="form.coAssigneeIds" multiple collapse-tags collapse-tags-tooltip placeholder="可多选" style="width:100%">
                <el-option v-for="u in userList" :key="u.id" :label="u.nickName || u.userName" :value="u.id" :disabled="form.mainAssigneeId === u.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="测试验收人">
              <el-select v-model="form.testerId" placeholder="请选择" clearable style="width:100%">
                <el-option v-for="u in userList" :key="u.id" :label="u.nickName || u.userName" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预估工时(h)">
              <el-input-number v-model="form.estimatedHours" :min="0.5" :step="0.5" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="测试用例">
          <div class="test-case-list">
            <div v-for="(tc, idx) in form.testCases" :key="idx" class="test-case-item">
              <span class="tc-index">{{ idx + 1 }}</span>
              <div class="tc-fields">
                <el-input v-model="tc.description" placeholder="用例描述/操作步骤" size="small" />
                <el-input v-model="tc.expectedResult" placeholder="预期结果" size="small" style="margin-top:6px" />
              </div>
              <el-button circle size="small" type="danger" plain @click="removeTestCase(idx)">X</el-button>
            </div>
            <el-button text type="primary" @click="addTestCase">
              <art-svg-icon icon="mdi:plus-circle-outline" style="margin-right:4px" /> 添加测试用例
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </ArtDialog>

    <TaskDetailDrawer v-if="drawerVisible" v-model="drawerVisible" :task-id="selectedTaskId!" @refresh="loadTasks" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { fetchTaskPage, fetchCreateTask, fetchUpdateTask, fetchDeleteTask, fetchProjectList, fetchOrgMembers } from '@/api/task';
import TaskDetailDrawer from '../detail/TaskDetailDrawer.vue';

const STATUS_OPTIONS: { label: string; value: Api.Task.TaskStatus }[] = [
  { label: '待分配', value: 'PENDING' },
  { label: '开发中', value: 'IN_PROGRESS' },
  { label: '待提测', value: 'SELF_TESTING' },
  { label: '验收中', value: 'QA_REVIEW' },
  { label: '打回修改', value: 'REJECTED' },
  { label: '已完成', value: 'COMPLETED' },
];
const STATUS_TAG: Record<Api.Task.TaskStatus, string> = {
  PENDING: 'info', IN_PROGRESS: '', SELF_TESTING: 'warning',
  QA_REVIEW: 'warning', REJECTED: 'danger', COMPLETED: 'success',
};
function statusLabel(s: Api.Task.TaskStatus) { return STATUS_OPTIONS.find(o => o.value === s)?.label ?? s; }
function statusTagType(s: Api.Task.TaskStatus) { return STATUS_TAG[s] ?? 'info'; }
function initials(u: Api.Task.SimpleUser) { return (u.nickName || u.userName)?.[0]?.toUpperCase() ?? '?'; }

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const drawerVisible = ref(false);
const editingId = ref<number | null>(null);
const selectedTaskId = ref<number | null>(null);
const taskList = ref<Api.Task.Task[]>([]);
const total = ref(0);
const projectList = ref<Api.Task.SimpleProject[]>([]);
const userList = ref<Api.Task.SimpleUser[]>([]);
const formRef = ref<FormInstance>();

const query = reactive({
  page: 1, pageSize: 10,
  projectId: undefined as number | undefined,
  status: undefined as Api.Task.TaskStatus | undefined,
  keyword: '',
});

const form = reactive({
  title: '',
  projectId: undefined as number | undefined,
  description: '',
  mainAssigneeId: undefined as number | undefined,
  coAssigneeIds: [] as number[],
  testerId: undefined as number | undefined,
  estimatedHours: undefined as number | undefined,
  testCases: [] as { description: string; expectedResult: string }[],
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
};

async function loadTasks() {
  loading.value = true;
  try {
    const res = await fetchTaskPage({ ...query, keyword: query.keyword || undefined });
    if (res) { taskList.value = res.list; total.value = res.total; }
  } finally { loading.value = false; }
}

async function loadProjects() {
  const res = await fetchProjectList();
  if (res) projectList.value = res;
}

async function loadUsers() {
  // 仅加载当前用户所在组织及下级组织的成员
  const res = await fetchOrgMembers();
  if (res) userList.value = res;
}


function resetQuery() { query.page = 1; query.projectId = undefined; query.status = undefined; query.keyword = ''; loadTasks(); }

function openCreateDialog() {
  editingId.value = null;
  Object.assign(form, { title: '', projectId: undefined, description: '', mainAssigneeId: undefined, coAssigneeIds: [], testerId: undefined, estimatedHours: undefined, testCases: [] });
  dialogVisible.value = true;
}

function openEditDialog(row: Api.Task.Task) {
  editingId.value = row.id;
  Object.assign(form, {
    title: row.title, projectId: row.projectId, description: row.description ?? '',
    mainAssigneeId: row.mainAssigneeId ?? undefined,
    coAssigneeIds: row.coAssignees.map(ca => ca.userId),
    testerId: row.testerId ?? undefined,
    estimatedHours: row.estimatedHours ?? undefined,
    testCases: [],
  });
  dialogVisible.value = true;
}

function openDetail(row: Api.Task.Task) { selectedTaskId.value = row.id; drawerVisible.value = true; }
function addTestCase() { form.testCases.push({ description: '', expectedResult: '' }); }
function removeTestCase(idx: number) { form.testCases.splice(idx, 1); }

async function handleSubmit() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    if (editingId.value) {
      await fetchUpdateTask(editingId.value, {
        title: form.title, description: form.description || undefined,
        mainAssigneeId: form.mainAssigneeId ?? null, coAssigneeIds: form.coAssigneeIds,
        testerId: form.testerId ?? null, estimatedHours: form.estimatedHours ?? null,
      });
      ElMessage.success('更新成功');
    } else {
      await fetchCreateTask({
        projectId: form.projectId!, title: form.title, description: form.description || undefined,
        mainAssigneeId: form.mainAssigneeId ?? null, coAssigneeIds: form.coAssigneeIds,
        testerId: form.testerId ?? null, estimatedHours: form.estimatedHours ?? null,
        testCases: form.testCases.filter(tc => tc.description && tc.expectedResult),
      });
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadTasks();
  } catch { /* http 拦截器已处理 */ } finally { submitting.value = false; }
}

async function handleDelete(id: number) {
  await fetchDeleteTask(id);
  ElMessage.success('删除成功');
  loadTasks();
}

onMounted(() => { loadTasks(); loadProjects(); loadUsers(); });
</script>

<style scoped lang="scss">
.task-manager-wrapper { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.search-bar {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  background: var(--art-main-bg-color, #fff); padding: 16px 20px; border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  .bar-left { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
}
.table-card {
  background: var(--art-main-bg-color, #fff); border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06); padding: 16px 20px;
}
.pagination-bar { margin-top: 16px; display: flex; justify-content: flex-end; }
.user-cell { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.text-muted { color: #999; font-size: 13px; }
.avatar-group { display: flex; align-items: center; }
.stacked-avatar { margin-left: -8px; border: 2px solid #fff; }
.more-count { font-size: 12px; color: #666; margin-left: 4px; }
.test-case-list { display: flex; flex-direction: column; gap: 10px; }
.test-case-item {
  display: flex; align-items: flex-start; gap: 10px;
  .tc-index { min-width: 22px; height: 22px; border-radius: 50%; background: var(--el-color-primary); color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; margin-top: 4px; }
  .tc-fields { flex: 1; }
}
</style>

