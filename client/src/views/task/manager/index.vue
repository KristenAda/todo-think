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
      width="900px"
      destroy-on-close·
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
        <el-form-item label="负责人">
          <div class="task-form-member-field task-form-member-field--block">
            <div class="task-form-member-tags">
              <template v-if="mainAssigneeUser || coAssigneeUsers.length">
                <el-tag
                  v-if="mainAssigneeUser"
                  type="primary"
                  closable
                  class="task-form-user-tag"
                  @close="removeMainAssigneeTag"
                >
                  <span class="task-form-user-tag-inner">
                    <el-avatar :size="20" :src="mainAssigneeUser.avatar ?? undefined">{{
                      initials(mainAssigneeUser)
                    }}</el-avatar>
                    <span>{{ userDisplayName(mainAssigneeUser) }}</span>
                  </span>
                </el-tag>
                <el-tag
                  v-for="u in coAssigneeUsers"
                  :key="u.id"
                  type="success"
                  closable
                  class="task-form-user-tag"
                  @close="removeCoAssigneeTag(u.id)"
                >
                  <span class="task-form-user-tag-inner">
                    <el-avatar :size="20" :src="u.avatar ?? undefined">{{ initials(u) }}</el-avatar>
                    <span>{{ userDisplayName(u) }}</span>
                  </span>
                </el-tag>
              </template>
              <span v-else class="task-form-member-placeholder">未选择</span>
            </div>
            <el-button @click="openAssigneePicker">选择人员</el-button>
          </div>
        </el-form-item>
        <el-form-item label="测试验收人">
          <div class="task-form-member-field task-form-member-field--block">
            <div class="task-form-member-tags">
              <el-tag
                v-if="testerUser"
                type="warning"
                closable
                class="task-form-user-tag"
                @close="clearTester"
              >
                <span class="task-form-user-tag-inner">
                  <el-avatar :size="20" :src="testerUser.avatar ?? undefined">{{
                    initials(testerUser)
                  }}</el-avatar>
                  <span>{{ userDisplayName(testerUser) }}</span>
                </span>
              </el-tag>
              <span v-else class="task-form-member-placeholder">未选择</span>
            </div>
            <el-button @click="openTesterPicker">选择人员</el-button>
          </div>
        </el-form-item>
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
          <div class="test-case-table-wrap">
            <el-table
              :data="form.testCases"
              border
              size="small"
              class="test-case-table"
              empty-text="暂无测试用例，点击下方添加"
              :row-key="testCaseRowKey"
            >
              <el-table-column type="index" label="#" width="52" align="center" />
              <el-table-column label="用例描述 / 操作步骤" min-width="220">
                <template #default="{ row }">
                  <el-input
                    v-model="row.description"
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 6 }"
                    placeholder="描述操作步骤或场景"
                    resize="none"
                  />
                </template>
              </el-table-column>
              <el-table-column label="预期结果" min-width="200">
                <template #default="{ row }">
                  <el-input
                    v-model="row.expectedResult"
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 6 }"
                    placeholder="期望看到的结果"
                    resize="none"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="72" align="center" fixed="right">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="removeTestCase($index)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button class="test-case-table__add" text type="primary" @click="addTestCase">
              <art-svg-icon icon="mdi:plus-circle-outline" style="margin-right: 4px" />
              添加测试用例
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </ArtDialog>

    <!-- 负责人：ArtDialog + 卡片列表（数据 fetchOrgMembers） -->
    <ArtDialog
      v-model="assigneePickerVisible"
      title="选择负责人"
      subtitle="勾选参与人员并指定唯一主要负责人"
      icon="mdi:account-group-outline"
      width="600px"
      :z-index="9100"
      :show-minimize="false"
      :show-maximize="false"
    >
      <div class="task-member-picker">
        <p class="task-member-picker__hint">
          勾选左侧复选框加入任务；在已选人员中须指定一位「主要负责人」。
        </p>
        <div class="task-member-picker__scroll">
          <el-radio-group v-model="assigneePickerMainId" class="task-member-picker__radio-group">
            <div
              v-for="u in userList"
              :key="u.id"
              class="member-pick-card"
              :class="{ 'member-pick-card--active': assigneePickerSelectedIds.includes(u.id) }"
            >
              <el-checkbox
                class="member-pick-card__check"
                :model-value="assigneePickerSelectedIds.includes(u.id)"
                @change="(v: string | number | boolean) => onAssigneeToggle(u.id, v === true)"
                @click.stop
              />
              <el-avatar :size="48" :src="u.avatar ?? undefined" class="member-pick-card__avatar">
                {{ initials(u) }}
              </el-avatar>
              <div class="member-pick-card__body">
                <div class="member-pick-card__name">{{ userDisplayName(u) }}</div>
                <div class="member-pick-card__email">{{ displayEmail(u.userEmail) }}</div>
                <div class="member-pick-card__meta">
                  <span class="member-pick-card__meta-item">
                    <art-svg-icon
                      icon="mdi:gender-male-female"
                      class="member-pick-card__meta-icon"
                    />
                    {{ displayGender(u.userGender) }}
                  </span>
                  <span class="member-pick-card__meta-item">
                    <art-svg-icon icon="mdi:phone-outline" class="member-pick-card__meta-icon" />
                    {{ displayPhone(u.userPhone) }}
                  </span>
                </div>
              </div>
              <div
                class="member-pick-card__side"
                :class="{
                  'member-pick-card__side--disabled': !assigneePickerSelectedIds.includes(u.id)
                }"
              >
                <el-radio
                  :label="u.id"
                  :disabled="!assigneePickerSelectedIds.includes(u.id)"
                  @click.stop
                >
                  主要负责人
                </el-radio>
              </div>
            </div>
          </el-radio-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="assigneePickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssigneePicker">确定</el-button>
      </template>
    </ArtDialog>

    <!-- 测试验收人：ArtDialog + 卡片单选 -->
    <ArtDialog
      v-model="testerPickerVisible"
      title="选择测试验收人"
      subtitle="从组织成员中指定，可不选"
      icon="mdi:clipboard-check-outline"
      width="600px"
      :z-index="9100"
      :show-minimize="false"
      :show-maximize="false"
    >
      <div class="task-member-picker">
        <div class="task-member-picker__scroll task-member-picker__scroll--tight">
          <el-radio-group v-model="testerPickerTempId" class="task-member-picker__radio-group">
            <div
              class="member-pick-card member-pick-card--tester"
              :class="{ 'member-pick-card--active': testerPickerTempId === testerNoneSentinel }"
            >
              <el-radio class="member-pick-card__radio" :label="testerNoneSentinel" @click.stop />
              <div class="member-pick-card__icon-slot">
                <art-svg-icon icon="mdi:account-off-outline" />
              </div>
              <div class="member-pick-card__body">
                <div class="member-pick-card__name">暂不指定</div>
                <div class="member-pick-card__email">稍后在任务中再指定验收人</div>
                <div class="member-pick-card__meta">
                  <span class="member-pick-card__meta-item member-pick-card__meta-item--muted"
                    >—</span
                  >
                </div>
              </div>
            </div>
            <div
              v-for="u in userList"
              :key="u.id"
              class="member-pick-card member-pick-card--tester"
              :class="{ 'member-pick-card--active': testerPickerTempId === u.id }"
            >
              <el-radio class="member-pick-card__radio" :label="u.id" @click.stop />
              <el-avatar :size="48" :src="u.avatar ?? undefined" class="member-pick-card__avatar">
                {{ initials(u) }}
              </el-avatar>
              <div class="member-pick-card__body">
                <div class="member-pick-card__name">{{ userDisplayName(u) }}</div>
                <div class="member-pick-card__email">{{ displayEmail(u.userEmail) }}</div>
                <div class="member-pick-card__meta">
                  <span class="member-pick-card__meta-item">
                    <art-svg-icon
                      icon="mdi:gender-male-female"
                      class="member-pick-card__meta-icon"
                    />
                    {{ displayGender(u.userGender) }}
                  </span>
                  <span class="member-pick-card__meta-item">
                    <art-svg-icon icon="mdi:phone-outline" class="member-pick-card__meta-icon" />
                    {{ displayPhone(u.userPhone) }}
                  </span>
                </div>
              </div>
            </div>
          </el-radio-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="testerPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTesterPicker">确定</el-button>
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
  import { ref, reactive, computed, onMounted, nextTick, h, watch } from 'vue';
  import { ElMessage, ElMessageBox, ElTag, ElAvatar } from 'element-plus';
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
  const PRIORITY_OPTIONS: { label: string; value: Api.Task.TaskPriority }[] = [
    { label: '紧急(P0)', value: 'P0' },
    { label: '高(P1)', value: 'P1' },
    { label: '中(P2)', value: 'P2' },
    { label: '低(P3)', value: 'P3' }
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
  function initials(u: Api.Task.SimpleUser) {
    return (u.nickName || u.userName)?.[0]?.toUpperCase() ?? '?';
  }

  function userDisplayName(u: Api.Task.SimpleUser) {
    return u.nickName || u.userName;
  }

  /** 选人卡片展示：空邮箱/手机占位 */
  function displayEmail(v: string | null | undefined) {
    if (v == null || String(v).trim() === '') return '未填写邮箱';
    return v;
  }

  function displayPhone(v: string | null | undefined) {
    if (v == null || String(v).trim() === '') return '未填写手机';
    return v;
  }

  /** 后端存中文「男/女」等，原样展示并兜底 */
  function displayGender(v: string | null | undefined) {
    if (v == null || String(v).trim() === '') return '未填写';
    return v;
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
                  h(ElAvatar, { size: 22, src: u.avatar ?? undefined }, () => initials(u)),
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
                    h(ElAvatar, { size: 22, src: u.avatar ?? undefined }, () => initials(u)),
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
    refreshData();
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
    mainAssigneeId: undefined as number | undefined,
    coAssigneeIds: [] as number[],
    testerId: undefined as number | undefined,
    estimatedHours: undefined as number | undefined,
    testCases: [] as {
      id?: number;
      description: string;
      expectedResult: string;
      /** 本地新增行稳定 key，不参与提交 */
      _clientKey?: number;
    }[]
  });

  /** 测试用例表格行：无后端 id 时递增，避免删行后 row-key 错乱 */
  const testCaseClientKey = ref(0);

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

  /** 测试验收人弹窗中「暂不指定」的占位值（与真实 userId 区分） */
  const testerNoneSentinel = -1;

  const assigneePickerVisible = ref(false);
  /** 弹窗内已勾选的人员 id */
  const assigneePickerSelectedIds = ref<number[]>([]);
  /** 弹窗内指定的主要负责人 id，须在 selectedIds 中 */
  const assigneePickerMainId = ref<number | undefined>(undefined);

  const testerPickerVisible = ref(false);
  const testerPickerTempId = ref<number>(testerNoneSentinel);

  const mainAssigneeUser = computed(() =>
    form.mainAssigneeId != null
      ? (userList.value.find((u) => u.id === form.mainAssigneeId) ?? null)
      : null
  );

  const coAssigneeUsers = computed(() =>
    form.coAssigneeIds
      .map((id) => userList.value.find((u) => u.id === id))
      .filter((u): u is Api.Task.SimpleUser => !!u)
  );

  const testerUser = computed(() =>
    form.testerId != null ? (userList.value.find((u) => u.id === form.testerId) ?? null) : null
  );

  function onAssigneeToggle(id: number, checked: boolean) {
    const set = new Set(assigneePickerSelectedIds.value);
    if (checked) {
      set.add(id);
      if (assigneePickerMainId.value == null) assigneePickerMainId.value = id;
    } else {
      set.delete(id);
      if (assigneePickerMainId.value === id) {
        assigneePickerMainId.value = set.size > 0 ? [...set][0] : undefined;
      }
    }
    assigneePickerSelectedIds.value = [...set];
  }

  function openAssigneePicker() {
    const ids = [
      ...(form.mainAssigneeId != null ? [form.mainAssigneeId] : []),
      ...form.coAssigneeIds
    ];
    const uniq = [...new Set(ids)];
    assigneePickerSelectedIds.value = uniq;
    assigneePickerMainId.value = form.mainAssigneeId;
    if (uniq.length && (form.mainAssigneeId == null || !uniq.includes(form.mainAssigneeId))) {
      assigneePickerMainId.value = uniq[0];
    }
    assigneePickerVisible.value = true;
  }

  function confirmAssigneePicker() {
    const ids = assigneePickerSelectedIds.value;
    if (!ids.length) {
      form.mainAssigneeId = undefined;
      form.coAssigneeIds = [];
      assigneePickerVisible.value = false;
      return;
    }
    const main = assigneePickerMainId.value;
    if (main == null || !ids.includes(main)) {
      ElMessage.warning('请从已选人员中指定主要负责人');
      return;
    }
    form.mainAssigneeId = main;
    form.coAssigneeIds = ids.filter((i) => i !== main);
    assigneePickerVisible.value = false;
  }

  /** 移除主要负责人时，若有协助负责人则顺移为新的主要负责人 */
  function removeMainAssigneeTag() {
    if (form.coAssigneeIds.length) {
      const [next, ...rest] = form.coAssigneeIds;
      form.mainAssigneeId = next;
      form.coAssigneeIds = rest;
    } else {
      form.mainAssigneeId = undefined;
    }
  }

  function removeCoAssigneeTag(id: number) {
    form.coAssigneeIds = form.coAssigneeIds.filter((i) => i !== id);
  }

  function clearTester() {
    form.testerId = undefined;
  }

  function openTesterPicker() {
    testerPickerTempId.value = form.testerId ?? testerNoneSentinel;
    testerPickerVisible.value = true;
  }

  function confirmTesterPicker() {
    form.testerId =
      testerPickerTempId.value === testerNoneSentinel ? undefined : testerPickerTempId.value;
    testerPickerVisible.value = false;
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

  function testCaseRowKey(row: { id?: number; _clientKey?: number }) {
    return row.id != null ? `id-${row.id}` : `new-${row._clientKey ?? 0}`;
  }

  function addTestCase() {
    testCaseClientKey.value += 1;
    form.testCases.push({
      description: '',
      expectedResult: '',
      _clientKey: testCaseClientKey.value
    });
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
  .task-form-member-field {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
    width: 100%;
  }

  .task-form-member-field--block {
    flex-direction: column;
    align-items: stretch;
  }

  .task-form-member-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    flex: 1;
    min-width: 0;
    min-height: 32px;
  }

  .task-form-member-placeholder {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
    line-height: 32px;
  }

  .task-form-user-tag :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
  }

  .task-form-user-tag-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .test-case-table-wrap {
    width: 100%;
  }

  .test-case-table {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;

    :deep(.el-table__cell) {
      vertical-align: top;
      padding: 10px 12px;
    }

    :deep(.el-textarea__inner) {
      box-shadow: none;
    }
  }

  .test-case-table__add {
    margin-top: 10px;
  }

  /* —— 选人 ArtDialog：卡片列表（slot 仍带本组件 scoped） —— */
  .task-member-picker {
    margin: -4px 0 0;
  }

  .task-member-picker__hint {
    margin: 0 0 14px;
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--el-text-color-regular);
    background: linear-gradient(
      120deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-fill-color-light) 100%
    );
    border-radius: 10px;
    border: 1px solid var(--el-color-primary-light-7);
  }

  .task-member-picker__scroll {
    max-height: min(52vh, 440px);
    overflow-y: auto;
    padding: 2px 6px 8px 2px;
    margin-right: -4px;

    &--tight {
      max-height: min(56vh, 480px);
    }

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-darker);
      border-radius: 6px;
    }
  }

  .task-member-picker__radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    align-items: stretch;
  }

  .member-pick-card {
    display: grid;
    grid-template-columns: auto 48px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px 14px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--art-main-bg-color, var(--el-bg-color));
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(255, 255, 255, 0.06) inset;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.15s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
    }

    &--active {
      border-color: var(--el-color-primary-light-3);
      box-shadow:
        0 4px 18px rgba(0, 0, 0, 0.07),
        0 0 0 1px var(--el-color-primary-light-7) inset;
    }

    &--tester {
      grid-template-columns: auto 48px minmax(0, 1fr);
    }
  }

  .member-pick-card__check {
    align-self: center;

    :deep(.el-checkbox__inner) {
      border-radius: 6px;
    }
  }

  .member-pick-card__radio {
    margin: 0 !important;
    height: auto !important;
    align-self: center;

    :deep(.el-radio__label) {
      display: none;
    }
  }

  .member-pick-card__avatar {
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 2px solid var(--el-border-color-extra-light);
  }

  .member-pick-card__icon-slot {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
    font-size: 24px;
    border: 2px dashed var(--el-border-color-lighter);
  }

  .member-pick-card__body {
    min-width: 0;
  }

  .member-pick-card__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    letter-spacing: 0.01em;
    line-height: 1.35;
  }

  .member-pick-card__email {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
    word-break: break-all;
  }

  .member-pick-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    margin-top: 8px;
  }

  .member-pick-card__meta-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    &--muted {
      color: var(--el-text-color-placeholder);
    }
  }

  .member-pick-card__meta-icon {
    font-size: 15px;
    opacity: 0.88;
    color: var(--el-color-primary);
  }

  .member-pick-card__side {
    align-self: center;
    padding-left: 4px;

    :deep(.el-radio) {
      margin-right: 0;
      height: auto;
      white-space: nowrap;
    }

    :deep(.el-radio__label) {
      font-size: 13px;
      font-weight: 500;
      padding-left: 8px;
    }

    &--disabled {
      opacity: 0.38;
      pointer-events: none;
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

    .task-mgr-assignee__name {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      font-weight: 600;
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
