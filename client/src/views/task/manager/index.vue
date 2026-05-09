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
        <el-button type="default" @click="runSearch">搜索</el-button>
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

    <TaskFormDialog
      v-model="taskDialogVisible"
      :mode="taskDialogMode"
      :project-list="projectList"
      :edit-row="taskDialogEditRow"
      @submitted="onTaskFormSubmitted"
    />

    <TaskDetailDrawer
      v-if="drawerVisible"
      v-model="drawerVisible"
      :task-id="selectedTaskId!"
      @refresh="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick, h } from 'vue';
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus';
  import UserAvatar from '@/components/core/base/UserAvatar.vue';
  import { fetchTaskPage, fetchDeleteTask, fetchProjectList } from '@/api/task';
  import { useTable } from '@/hooks/core/useTable';
  import ArtTableRowActions from '@/components/core/forms/art-table-row-actions/index.vue';
  import TaskDetailDrawer from '../detail/TaskDetailDrawer.vue';
  import TaskFormDialog from '../components/TaskFormDialog.vue';
  import mittBus from '@/utils/sys/mittBus';

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
  const STATUS_TAG: Record<
    Api.Task.TaskStatus,
    'primary' | 'success' | 'warning' | 'info' | 'danger'
  > = {
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
  function statusLabel(s: Api.Task.TaskStatus) {
    return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
  }
  function statusTagType(
    s: Api.Task.TaskStatus
  ): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
    return STATUS_TAG[s] ?? 'info';
  }

  function workDomainLabel(w: Api.Task.TaskWorkDomain) {
    return WORK_DOMAIN_OPTIONS.find((x) => x.value === w)?.label ?? w;
  }

  function typeLabel(t: Api.Task.TaskType) {
    return TYPE_OPTIONS.find((x) => x.value === t)?.label ?? t;
  }

  function priorityTagType(p: Api.Task.TaskPriority): 'danger' | 'warning' | 'primary' | 'info' {
    if (p === 'P0') return 'danger';
    if (p === 'P1') return 'warning';
    if (p === 'P2') return 'primary';
    return 'info';
  }

  const taskDialogVisible = ref(false);
  const taskDialogMode = ref<'create' | 'edit'>('create');
  const taskDialogEditRow = ref<Api.Task.Task | null>(null);
  const drawerVisible = ref(false);
  const selectedTaskId = ref<number | null>(null);
  const projectList = ref<Api.Task.SimpleProject[]>([]);

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    searchParams,
    getData,
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
          prop: 'workDomain',
          label: '任务领域',
          width: 120,
          formatter: (row) =>
            h(ElTag, { type: 'info', size: 'small', effect: 'light' }, () =>
              workDomainLabel(row.workDomain)
            )
        },
        {
          prop: 'type',
          label: '事项类型',
          width: 110,
          formatter: (row) =>
            h(ElTag, { type: 'info', size: 'small', effect: 'light' }, () => typeLabel(row.type))
        },
        {
          prop: 'priority',
          label: '优先级',
          width: 100,
          formatter: (row) =>
            h(
              ElTag,
              { type: priorityTagType(row.priority), size: 'small', effect: 'light' },
              () => row.priority
            )
        },
        {
          prop: 'status',
          label: '状态',
          width: 110,
          formatter: (row) =>
            h(ElTag, { type: statusTagType(row.status), size: 'small' }, () =>
              statusLabel(row.status)
            )
        },
        {
          prop: 'assignees',
          label: '负责人',
          minWidth: 240,
          formatter: (row) => {
            const nodes: any[] = [];

            if (row.mainAssignee) {
              const u = row.mainAssignee;
              nodes.push(
                h('div', { class: 'task-mgr-assignee task-mgr-assignee--main' }, [
                  h(UserAvatar, {
                    size: 22,
                    src: u.avatar ?? undefined,
                    name: u.nickName || u.userName,
                    gender: u.userGender ?? ''
                  }),
                  h('span', { class: 'task-mgr-assignee__name' }, u.nickName || u.userName)
                ])
              );
            }

            if (row.coAssignees?.length) {
              const max = 6;
              const list = row.coAssignees.slice(0, max);
              for (const ca of list) {
                const u = ca.user;
                nodes.push(
                  h('div', { class: 'task-mgr-assignee task-mgr-assignee--co' }, [
                    h(UserAvatar, {
                      size: 22,
                      src: u.avatar ?? undefined,
                      name: u.nickName || u.userName,
                      gender: u.userGender ?? ''
                    }),
                    h('span', { class: 'task-mgr-assignee__name' }, u.nickName || u.userName)
                  ])
                );
              }
              if (row.coAssignees.length > max) {
                nodes.push(
                  h('span', { class: 'task-mgr-assignee-more' }, `+${row.coAssignees.length - max}`)
                );
              }
            }

            if (!nodes.length) return h('span', { class: 'text-muted' }, '未分配');
            return h('div', { class: 'task-mgr-assignees' }, nodes);
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
          prop: 'baseScore',
          label: '基础积分',
          width: 95,
          align: 'center',
          formatter: (row) => (row.baseScore != null ? String(row.baseScore) : '-')
        },
        {
          prop: 'operation',
          label: '操作',
          width: 176,
          align: 'center',
          fixed: 'right',
          formatter: (row) =>
            h(ArtTableRowActions, {
              items: [
                { key: 'detail', label: '详情', onClick: () => openDetail(row) },
                { key: 'edit', label: '编辑', onClick: () => openEditDialog(row) },
                {
                  key: 'delete',
                  label: '删除',
                  danger: true,
                  onClick: () => confirmDeleteTask(row)
                }
              ]
            })
        }
      ]
    }
  });

  function runSearch() {
    refreshData();
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

  async function loadProjects() {
    const res = await fetchProjectList();
    if (res) projectList.value = res;
  }

  function openCreateDialog() {
    taskDialogMode.value = 'create';
    taskDialogEditRow.value = null;
    taskDialogVisible.value = false;
    nextTick(() => {
      taskDialogVisible.value = true;
    });
  }

  function openEditDialog(row: Api.Task.Task) {
    taskDialogMode.value = 'edit';
    taskDialogEditRow.value = row;
    taskDialogVisible.value = false;
    nextTick(() => {
      taskDialogVisible.value = true;
    });
  }

  function openDetail(row: Api.Task.Task) {
    selectedTaskId.value = row.id;
    drawerVisible.value = true;
  }

  async function onTaskFormSubmitted(kind: 'create' | 'update') {
    if (kind === 'create') await refreshCreate();
    else await refreshUpdate();
  }

  const handleOpenTaskDetail = (taskId: number) => {
    selectedTaskId.value = taskId;
    drawerVisible.value = true;
  };

  onMounted(() => {
    getData();
    loadProjects();
    mittBus.on('openTaskDetail', handleOpenTaskDetail);
  });

  onBeforeUnmount(() => {
    mittBus.off('openTaskDetail', handleOpenTaskDetail);
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

    .task-mgr-user-cell .el-avatar,
    .task-mgr-user-cell .user-avatar-wrap {
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

    .task-mgr-assignees {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      align-items: center;
      line-height: 1.2;
    }

    .task-mgr-assignee {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 3px 10px 3px 3px;
      border-radius: 999px;
      border: 1px solid var(--el-border-color-extra-light);
      background: var(--el-fill-color-blank);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .task-mgr-assignee--main {
      border-color: var(--el-color-primary-light-7);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    .task-mgr-assignee--co {
      border-color: var(--el-color-success-light-7);
      background: var(--el-color-success-light-9);
      color: var(--el-color-success);
    }

    .task-mgr-assignee .user-avatar-wrap,
    .task-mgr-assignee .el-avatar {
      flex-shrink: 0;
    }

    .task-mgr-assignee__name {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      font-weight: 500;
      line-height: 1;
      color: var(--el-text-color-primary);
    }

    .task-mgr-assignee--main .task-mgr-assignee__name {
      color: var(--el-color-primary);
    }

    .task-mgr-assignee--co .task-mgr-assignee__name {
      color: var(--el-color-success);
    }

    .task-mgr-assignee-more {
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-secondary);
      padding: 2px 6px;
      border-radius: 999px;
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color-lighter);
    }
  }
</style>
