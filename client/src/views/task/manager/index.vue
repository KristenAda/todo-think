<template>
  <div class="task-manager-wrapper art-full-height">
    <div class="search-bar">
      <div class="bar-left">
        <el-select
          v-model="searchParams.projectId"
          placeholder="选择项目"
          clearable
          style="width: 200px"
          @change="runSearch"
        >
          <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索任务名称..."
          clearable
          style="width: 220px"
          @keyup.enter="runSearch"
          @clear="runSearch"
        />
        <el-select
          v-model="searchParams.status"
          placeholder="任务状态"
          clearable
          style="width: 160px"
          @change="runSearch"
        >
          <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-button type="primary" @click="runSearch">搜索</el-button>
        <el-button @click="resetSearchParams">重置</el-button>
      </div>
      <div class="bar-right" />
    </div>

    <ElCard class="art-table-card" shadow="never" style="margin-top: 12px">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="openCreateDialog" v-ripple>+ 新建任务</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        row-key="id"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 新建/编辑弹窗 -->
    <ArtDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑任务' : '新建任务'"
      icon="solar:checklist-bold-duotone"
      width="700px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="任务名称" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入任务名称"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属项目" prop="projectId">
          <el-select v-model="form.projectId" placeholder="请选择项目" style="width: 100%">
            <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="任务领域">
              <el-select v-model="form.workDomain" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="w in WORK_DOMAIN_OPTIONS"
                  :key="w.value"
                  :label="w.label"
                  :value="w.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="事项类型">
              <el-select v-model="form.type" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="t in TYPE_OPTIONS"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="form.priority" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="p in PRIORITY_OPTIONS"
                  :key="p.value"
                  :label="p.label"
                  :value="p.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期">
              <el-date-picker
                v-model="form.dueDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="管理者">
              <el-select
                v-model="form.managerId"
                placeholder="请选择"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="u in userList"
                  :key="u.id"
                  :label="u.nickName || u.userName"
                  :value="u.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主要负责人">
              <el-select
                v-model="form.mainAssigneeId"
                placeholder="请选择"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="u in userList"
                  :key="u.id"
                  :label="u.nickName || u.userName"
                  :value="u.id"
                  :disabled="form.coAssigneeIds.includes(u.id)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="协助负责人">
              <el-select
                v-model="form.coAssigneeIds"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="可多选"
                style="width: 100%"
              >
                <el-option
                  v-for="u in userList"
                  :key="u.id"
                  :label="u.nickName || u.userName"
                  :value="u.id"
                  :disabled="form.mainAssigneeId === u.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="测试验收人">
              <el-select v-model="form.testerId" placeholder="请选择" clearable style="width: 100%">
                <el-option
                  v-for="u in userList"
                  :key="u.id"
                  :label="u.nickName || u.userName"
                  :value="u.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="预估工时(h)">
              <el-input-number
                v-model="form.estimatedHours"
                :min="0.5"
                :step="0.5"
                :precision="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="附件">
          <TaskAttachmentField
            ref="taskAttachRef"
            hint="可选，多文件依次上传（分片+断点续传）；新建或编辑保存时一并写入任务附件集"
          />
        </el-form-item>
        <el-form-item v-if="form.workDomain === 'SOFTWARE_DEVELOPMENT'" label="测试用例">
          <div class="test-case-list">
            <div
              v-for="(tc, idx) in form.testCases"
              :key="tc.id ?? `new-${idx}`"
              class="test-case-item"
            >
              <span class="tc-index">{{ idx + 1 }}</span>
              <div class="tc-fields">
                <el-input v-model="tc.description" placeholder="用例描述/操作步骤" size="small" />
                <el-input
                  v-model="tc.expectedResult"
                  placeholder="预期结果"
                  size="small"
                  style="margin-top: 6px"
                />
              </div>
              <el-button circle size="small" type="danger" plain @click="removeTestCase(idx)"
                >X</el-button
              >
            </div>
            <el-button text type="primary" @click="addTestCase">
              <art-svg-icon icon="mdi:plus-circle-outline" style="margin-right: 4px" /> 添加测试用例
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </ArtDialog>

    <TaskDetailDrawer
      v-if="drawerVisible"
      v-model="drawerVisible"
      :task-id="selectedTaskId!"
      @refresh="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, nextTick, h, watch } from 'vue';
  import { ElMessage, ElMessageBox, ElTag, ElAvatar, ElTooltip } from 'element-plus';
  import type { FormInstance, FormRules } from 'element-plus';
  import {
    fetchTaskPage,
    fetchTaskInfo,
    fetchCreateTask,
    fetchUpdateTask,
    fetchDeleteTask,
    fetchProjectList,
    fetchOrgMembers
  } from '@/api/task';
  import { useTable } from '@/hooks/core/useTable';
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue';
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue';
  import TaskDetailDrawer from '../detail/TaskDetailDrawer.vue';
  import TaskAttachmentField from '../components/TaskAttachmentField.vue';

  /** 将任务分页接口转为 useTable 可用的 PaginatedResponse，并修正记录类型推导 */
  async function fetchTaskPageForTable(params: Api.Task.TaskPageParams) {
    const sanitized: Api.Task.TaskPageParams = {
      ...params,
      keyword: params.keyword?.trim() || undefined
    };
    const res = await fetchTaskPage(sanitized);
    if (!res) {
      return {
        records: [] as Api.Task.Task[],
        total: 0,
        current: params.page ?? 1,
        size: params.pageSize ?? 10
      };
    }
    return {
      records: res.list,
      total: res.total,
      current: res.page,
      size: res.pageSize
    };
  }

  const STATUS_OPTIONS: { label: string; value: Api.Task.TaskStatus }[] = [
    { label: '待分配', value: 'PENDING' },
    { label: '开发中', value: 'IN_PROGRESS' },
    { label: '待提测', value: 'SELF_TESTING' },
    { label: '验收中', value: 'QA_REVIEW' },
    { label: '打回修改', value: 'REJECTED' },
    { label: '已完成', value: 'COMPLETED' },
    { label: '已暂停', value: 'PAUSED' },
    { label: '已取消', value: 'CANCELLED' }
  ];
  const STATUS_TAG: Record<Api.Task.TaskStatus, 'primary' | 'success' | 'warning' | 'info' | 'danger'> =
    {
      PENDING: 'info',
      IN_PROGRESS: 'primary',
      SELF_TESTING: 'warning',
      QA_REVIEW: 'warning',
      REJECTED: 'danger',
      COMPLETED: 'success',
      PAUSED: 'warning',
      CANCELLED: 'info'
    };
  const WORK_DOMAIN_OPTIONS: { label: string; value: Api.Task.TaskWorkDomain }[] = [
    { label: '软件开发', value: 'SOFTWARE_DEVELOPMENT' },
    { label: '产品与设计', value: 'PRODUCT_DESIGN' },
    { label: '运维与实施', value: 'OPERATIONS_SUPPORT' },
    { label: '数据分析', value: 'DATA_ANALYTICS' },
    { label: '综合与其他', value: 'GENERAL' }
  ];
  const TYPE_OPTIONS: { label: string; value: Api.Task.TaskType }[] = [
    { label: '需求', value: 'FEATURE' },
    { label: '缺陷', value: 'BUG' },
    { label: '技术债/杂项', value: 'CHORE' },
    { label: '优化', value: 'ENHANCEMENT' }
  ];
  const PRIORITY_OPTIONS: { label: string; value: Api.Task.TaskPriority }[] = [
    { label: '紧急(P0)', value: 'P0' },
    { label: '高(P1)', value: 'P1' },
    { label: '中(P2)', value: 'P2' },
    { label: '低(P3)', value: 'P3' }
  ];
  function statusLabel(s: Api.Task.TaskStatus) {
    return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
  }
  function statusTagType(s: Api.Task.TaskStatus): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
    return STATUS_TAG[s] ?? 'info';
  }
  function initials(u: Api.Task.SimpleUser) {
    return (u.nickName || u.userName)?.[0]?.toUpperCase() ?? '?';
  }

  /** 提交前过滤空行并 trim；新建无 id，编辑保留 id */
  function buildTestCasesForApi(
    cases: { id?: number; description: string; expectedResult: string }[]
  ): Api.Task.TestCaseUpsert[] {
    const out: Api.Task.TestCaseUpsert[] = [];
    for (const tc of cases) {
      const description = tc.description.trim();
      const expectedResult = tc.expectedResult.trim();
      if (!description || !expectedResult) continue;
      if (tc.id != null) out.push({ id: tc.id, description, expectedResult });
      else out.push({ description, expectedResult });
    }
    return out;
  }

  const submitting = ref(false);
  const dialogVisible = ref(false);
  const drawerVisible = ref(false);
  const editingId = ref<number | null>(null);
  /** 编辑保存时使用的乐观锁版本（来自详情接口） */
  const editingVersion = ref(0);
  const selectedTaskId = ref<number | null>(null);
  const projectList = ref<Api.Task.SimpleProject[]>([]);
  const userList = ref<Api.Task.SimpleUser[]>([]);
  const formRef = ref<FormInstance>();
  const taskAttachRef = ref<InstanceType<typeof TaskAttachmentField> | null>(null);

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    searchParams,
    getData,
    getDataByPage,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    refreshRemove,
    refreshCreate,
    refreshUpdate
  } = useTable({
    core: {
      apiFn: fetchTaskPageForTable,
      paginationKey: { current: 'page', size: 'pageSize' },
      apiParams: {
        page: 1,
        pageSize: 10,
        projectId: undefined as number | undefined,
        status: undefined as Api.Task.TaskStatus | undefined,
        keyword: ''
      },
      immediate: false,
      columnsFactory: () => [
        { type: 'globalIndex', width: 60, label: '序号' },
        {
          prop: 'title',
          label: '任务名称',
          minWidth: 180,
          showOverflowTooltip: true
        },
        {
          prop: 'project',
          label: '所属项目',
          width: 160,
          formatter: (row) => row.project?.name ?? '-'
        },
        {
          prop: 'status',
          label: '状态',
          width: 110,
          formatter: (row) =>
            h(ElTag, { type: statusTagType(row.status), size: 'small' }, () => statusLabel(row.status))
        },
        {
          prop: 'mainAssignee',
          label: '主负责人',
          width: 150,
          formatter: (row) => {
            if (!row.mainAssignee) {
              return h('span', { class: 'text-muted' }, '未分配');
            }
            return h('div', { class: 'task-mgr-user-cell' }, [
              h(ElAvatar, { size: 26, src: row.mainAssignee.avatar ?? undefined }, () =>
                initials(row.mainAssignee!)
              ),
              h(
                'span',
                { class: 'task-mgr-user-cell__name' },
                row.mainAssignee.nickName || row.mainAssignee.userName
              )
            ]);
          }
        },
        {
          prop: 'coAssignees',
          label: '协助人',
          width: 150,
          formatter: (row) => {
            if (!row.coAssignees?.length) {
              return h('span', { class: 'text-muted' }, '-');
            }
            const nodes = row.coAssignees.slice(0, 4).map((ca) =>
              h(
                ElTooltip,
                { content: ca.user.nickName || ca.user.userName, placement: 'top' },
                {
                  default: () =>
                    h(
                      ElAvatar,
                      { size: 26, src: ca.user.avatar ?? undefined, class: 'task-mgr-stacked-avatar' },
                      () => initials(ca.user)
                    )
                }
              )
            );
            const more =
              row.coAssignees.length > 4
                ? h('span', { class: 'task-mgr-more-count' }, `+${row.coAssignees.length - 4}`)
                : null;
            return h('div', { class: 'task-mgr-avatar-group' }, [...nodes, more].filter(Boolean));
          }
        },
        {
          prop: 'estimatedHours',
          label: '预估工时',
          width: 95,
          align: 'center',
          formatter: (row) => (row.estimatedHours != null ? `${row.estimatedHours}h` : '-')
        },
        {
          prop: 'operation',
          label: '操作',
          width: 100,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  { key: 'detail', label: '详情', icon: 'ri:file-list-3-line' },
                  { key: 'edit', label: '编辑任务', icon: 'ri:edit-2-line' },
                  {
                    key: 'delete',
                    label: '删除任务',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c'
                  }
                ],
                onClick: (item: ButtonMoreItem) => taskRowAction(item, row)
              })
            ])
        }
      ]
    }
  });

  function runSearch() {
    getDataByPage();
  }

  function taskRowAction(item: ButtonMoreItem, row: Api.Task.Task) {
    switch (item.key) {
      case 'detail':
        openDetail(row);
        break;
      case 'edit':
        openEditDialog(row);
        break;
      case 'delete':
        confirmDeleteTask(row);
        break;
    }
  }

  async function confirmDeleteTask(row: Api.Task.Task) {
    try {
      await ElMessageBox.confirm(`确定删除任务「${row.title}」吗？此操作不可恢复。`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      await fetchDeleteTask(row.id);
      ElMessage.success('删除成功');
      await refreshRemove();
    } catch (e) {
      if (e !== 'cancel') {
        /* http 拦截器已处理 */
      }
    }
  }

  const form = reactive({
    title: '',
    projectId: undefined as number | undefined,
    description: '',
    workDomain: 'GENERAL' as Api.Task.TaskWorkDomain,
    type: 'FEATURE' as Api.Task.TaskType,
    priority: 'P2' as Api.Task.TaskPriority,
    dueDate: undefined as string | undefined,
    managerId: undefined as number | undefined,
    mainAssigneeId: undefined as number | undefined,
    coAssigneeIds: [] as number[],
    testerId: undefined as number | undefined,
    estimatedHours: undefined as number | undefined,
    testCases: [] as { id?: number; description: string; expectedResult: string }[]
  });

  const rules: FormRules = {
    title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
    projectId: [{ required: true, message: '请选择项目', trigger: 'change' }]
  };

  watch(
    () => form.workDomain,
    (domain) => {
      if (domain !== 'SOFTWARE_DEVELOPMENT') {
        form.testCases = [];
      }
    }
  );

  async function loadProjects() {
    const res = await fetchProjectList();
    if (res) projectList.value = res;
  }

  async function loadUsers() {
    // 仅加载当前用户所在组织及下级组织的成员
    const res = await fetchOrgMembers();
    if (res) userList.value = res;
  }

  function openCreateDialog() {
    editingId.value = null;
    Object.assign(form, {
      title: '',
      projectId: undefined,
      description: '',
      workDomain: 'GENERAL',
      type: 'FEATURE',
      priority: 'P2',
      dueDate: undefined,
      managerId: undefined,
      mainAssigneeId: undefined,
      coAssigneeIds: [],
      testerId: undefined,
      estimatedHours: undefined,
      testCases: []
    });
    dialogVisible.value = false;
    nextTick(() => {
      dialogVisible.value = true;
      taskAttachRef.value?.reset();
    });
  }

  async function openEditDialog(row: Api.Task.Task) {
    editingId.value = row.id;
    let detail: Api.Task.Task | null = null;
    try {
      detail = await fetchTaskInfo(row.id);
    } catch {
      detail = null;
    }
    editingVersion.value = detail?.version ?? row.version ?? 0;

    const base = detail ?? row;
    const wd = base.workDomain ?? 'GENERAL';
    Object.assign(form, {
      title: base.title,
      projectId: base.projectId,
      description: base.description ?? '',
      workDomain: wd,
      type: base.type,
      priority: base.priority,
      dueDate: base.dueDate ? base.dueDate.slice(0, 10) : undefined,
      managerId: base.managerId ?? undefined,
      mainAssigneeId: base.mainAssigneeId ?? undefined,
      coAssigneeIds: (detail?.coAssignees ?? row.coAssignees).map((ca) => ca.userId),
      testerId: base.testerId ?? undefined,
      estimatedHours: base.estimatedHours ?? undefined,
      testCases:
        wd === 'SOFTWARE_DEVELOPMENT'
          ? (detail?.testCases ?? []).map((tc) => ({
              id: tc.id,
              description: tc.description,
              expectedResult: tc.expectedResult
            }))
          : []
    });
    dialogVisible.value = false;
    nextTick(() => {
      dialogVisible.value = true;
      nextTick(() => {
        const atts = detail?.attachments;
        if (atts?.length) {
          taskAttachRef.value?.setExisting(
            atts.map((a) => ({
              linkId: a.id,
              attachmentId: a.attachmentId,
              originalName: a.attachment.originalName,
              mimeType: a.attachment.mimeType,
              size: a.attachment.size,
              sort: a.sort
            }))
          );
        } else {
          taskAttachRef.value?.reset();
        }
      });
    });
  }

  function openDetail(row: Api.Task.Task) {
    selectedTaskId.value = row.id;
    drawerVisible.value = true;
  }
  function addTestCase() {
    form.testCases.push({ description: '', expectedResult: '' });
  }
  function removeTestCase(idx: number) {
    form.testCases.splice(idx, 1);
  }

  async function handleSubmit() {
    await formRef.value?.validate();
    submitting.value = true;
    try {
      if (editingId.value) {
        try {
          await taskAttachRef.value?.uploadAll();
        } catch {
          return;
        }
        const attachmentIds =
          taskAttachRef.value?.getAttachmentIdsForSubmit?.() ??
          taskAttachRef.value?.getAttachmentIds?.() ??
          [];
        await fetchUpdateTask(editingId.value, {
          version: editingVersion.value,
          title: form.title,
          description: form.description || undefined,
          workDomain: form.workDomain,
          type: form.type,
          priority: form.priority,
          dueDate: form.dueDate || null,
          managerId: form.managerId ?? null,
          mainAssigneeId: form.mainAssigneeId ?? null,
          coAssigneeIds: form.coAssigneeIds,
          testerId: form.testerId ?? null,
          estimatedHours: form.estimatedHours ?? null,
          attachmentIds,
          testCases: buildTestCasesForApi(form.testCases)
        });
        ElMessage.success('更新成功');
        await refreshUpdate();
      } else {
        try {
          await taskAttachRef.value?.uploadAll();
        } catch {
          return;
        }
        const attachmentIds = taskAttachRef.value?.getAttachmentIds() ?? [];
        await fetchCreateTask({
          projectId: form.projectId!,
          title: form.title,
          description: form.description || undefined,
          workDomain: form.workDomain,
          type: form.type,
          priority: form.priority,
          dueDate: form.dueDate || undefined,
          managerId: form.managerId ?? undefined,
          mainAssigneeId: form.mainAssigneeId ?? undefined,
          coAssigneeIds: form.coAssigneeIds,
          testerId: form.testerId ?? undefined,
          estimatedHours: form.estimatedHours ?? undefined,
          testCases: buildTestCasesForApi(form.testCases).map((tc) => ({
            description: tc.description,
            expectedResult: tc.expectedResult
          })),
          attachmentIds: attachmentIds.length ? attachmentIds : undefined
        });
        ElMessage.success('创建成功');
        taskAttachRef.value?.reset();
        await refreshCreate();
      }
      dialogVisible.value = false;
    } catch {
      /* http 拦截器已处理 */
    } finally {
      submitting.value = false;
    }
  }

  onMounted(() => {
    getData();
    loadProjects();
    loadUsers();
  });
</script>

<style scoped lang="scss">
  .task-manager-wrapper {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .search-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    background: var(--default-box-color);
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    .bar-left {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
  }
  .test-case-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .test-case-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    .tc-index {
      min-width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--el-color-primary);
      color: #fff;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 4px;
    }
    .tc-fields {
      flex: 1;
    }
  }
</style>

<!-- formatter(h) 挂载在表格内部，节点无 SFC scoped 的 data-v，样式须放在非 scoped 且限定在页面根下 -->
<style lang="scss">
  .task-manager-wrapper {
    .task-mgr-user-cell {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 26px;
      font-size: 13px;
      line-height: 1;
      vertical-align: middle;
    }

    .task-mgr-user-cell .el-avatar {
      flex-shrink: 0;
    }

    .task-mgr-user-cell__name {
      line-height: 26px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .text-muted {
      color: var(--el-text-color-placeholder);
      font-size: 13px;
      line-height: 26px;
    }

    .task-mgr-avatar-group {
      display: inline-flex;
      align-items: center;
      flex-wrap: nowrap;
      min-height: 26px;
      line-height: 1;
      vertical-align: middle;
    }

    .task-mgr-avatar-group .el-tooltip__trigger {
      display: inline-flex;
      align-items: center;
      line-height: 0;
    }

    .task-mgr-stacked-avatar {
      margin-left: -8px;
      border: 2px solid var(--default-box-color);
      flex-shrink: 0;
    }

    .task-mgr-avatar-group > :first-child .task-mgr-stacked-avatar {
      margin-left: 0;
    }

    .task-mgr-more-count {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-left: 4px;
      line-height: 26px;
      flex-shrink: 0;
    }
  }
</style>
