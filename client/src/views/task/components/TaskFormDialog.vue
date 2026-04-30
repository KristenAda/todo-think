<template>
  <ArtDialog
    v-model="innerVisible"
    :title="mode === 'edit' ? '编辑任务' : '新建任务'"
    icon="solar:checklist-bold-duotone"
    width="900px"
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
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="基础积分">
            <el-input-number
              v-model="form.baseScore"
              :min="0"
              :step="0.5"
              :precision="1"
              style="width: 100%"
              @change="() => (form.baseScoreSource = 'MANUAL')"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin: -6px 0 10px"
        title="基础积分会根据任务信息自动给出建议并填充（不展示建议值）。规则：建议基础积分 = (类型基准 + min(预估工时,12)*0.8) × 优先级系数 × 领域系数；你可在输入框内直接调整。"
      />
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
      <el-button @click="innerVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </ArtDialog>

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
            @click="onAssigneeCardClick(u.id)"
          >
            <el-checkbox
              class="member-pick-card__check"
              :model-value="assigneePickerSelectedIds.includes(u.id)"
              @click.stop="onAssigneeCardClick(u.id)"
            />
            <el-avatar :size="48" :src="u.avatar ?? undefined" class="member-pick-card__avatar">
              {{ initials(u) }}
            </el-avatar>
            <div class="member-pick-card__body">
              <div class="member-pick-card__name">{{ userDisplayName(u) }}</div>
              <div class="member-pick-card__email">{{ displayEmail(u.userEmail) }}</div>
              <div class="member-pick-card__meta">
                <span class="member-pick-card__meta-item">
                  <art-svg-icon icon="mdi:gender-male-female" class="member-pick-card__meta-icon" />
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
            @click="onTesterCardClick(testerNoneSentinel)"
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
            @click="onTesterCardClick(u.id)"
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
                  <art-svg-icon icon="mdi:gender-male-female" class="member-pick-card__meta-icon" />
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
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
  import { ElMessage } from 'element-plus';
  import type { FormInstance, FormRules } from 'element-plus';
  import { fetchTaskInfo, fetchCreateTask, fetchUpdateTask, fetchOrgMembers } from '@/api/task';
  import TaskAttachmentField from './TaskAttachmentField.vue';

  const props = defineProps<{
    modelValue: boolean;
    mode: 'create' | 'edit';
    projectList: Api.Task.SimpleProject[];
    /** 编辑时传入列表行 */
    editRow: Api.Task.Task | null;
  }>();

  const emit = defineEmits<{
    'update:modelValue': [v: boolean];
    /** 与原先 refreshCreate / refreshUpdate 对齐 */
    submitted: [kind: 'create' | 'update'];
  }>();

  const innerVisible = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
  });

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

  function initials(u: Api.Task.SimpleUser) {
    return (u.nickName || u.userName)?.[0]?.toUpperCase() ?? '?';
  }

  function userDisplayName(u: Api.Task.SimpleUser) {
    return u.nickName || u.userName;
  }

  function displayEmail(v: string | null | undefined) {
    if (v == null || String(v).trim() === '') return '未填写邮箱';
    return v;
  }

  function displayPhone(v: string | null | undefined) {
    if (v == null || String(v).trim() === '') return '未填写手机';
    return v;
  }

  function displayGender(v: string | null | undefined) {
    if (v == null || String(v).trim() === '') return '未填写';
    return v;
  }

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
  const editingId = ref<number | null>(null);
  const editingVersion = ref(0);
  const userList = ref<Api.Task.SimpleUser[]>([]);
  const formRef = ref<FormInstance>();
  const taskAttachRef = ref<InstanceType<typeof TaskAttachmentField> | null>(null);

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
    suggestedBaseScore: 0 as number,
    baseScore: undefined as number | undefined,
    baseScoreSource: 'AUTO' as 'AUTO' | 'MANUAL',
    testCases: [] as {
      id?: number;
      description: string;
      expectedResult: string;
      _clientKey?: number;
    }[]
  });

  const testCaseClientKey = ref(0);

  const rules: FormRules = {
    title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
    projectId: [{ required: true, message: '请选择项目', trigger: 'change' }]
  };

  function calcSuggestedBaseScore() {
    const typeBase: Record<Api.Task.TaskType, number> = {
      FEATURE: 12,
      BUG: 10,
      ENHANCEMENT: 8,
      CHORE: 6
    };
    const priorityFactor: Record<Api.Task.TaskPriority, number> = {
      P0: 1.6,
      P1: 1.3,
      P2: 1,
      P3: 0.8
    };
    const domainFactor: Record<Api.Task.TaskWorkDomain, number> = {
      SOFTWARE_DEVELOPMENT: 1,
      PRODUCT_DESIGN: 0.9,
      OPERATIONS_SUPPORT: 0.8,
      DATA_ANALYTICS: 0.95,
      GENERAL: 0.85
    };
    const hourPart = Math.min(12, Math.max(0, Number(form.estimatedHours ?? 0))) * 0.8;
    const score =
      (typeBase[form.type] + hourPart) * priorityFactor[form.priority] * domainFactor[form.workDomain];
    form.suggestedBaseScore = Number(score.toFixed(1));
    if (form.baseScoreSource !== 'MANUAL' || form.baseScore == null) {
      form.baseScore = form.suggestedBaseScore;
      form.baseScoreSource = 'AUTO';
    }
  }

  watch(
    () => form.workDomain,
    (domain) => {
      if (domain !== 'SOFTWARE_DEVELOPMENT') {
        form.testCases = [];
      }
      calcSuggestedBaseScore();
    }
  );
  watch(() => form.type, calcSuggestedBaseScore);
  watch(() => form.priority, calcSuggestedBaseScore);
  watch(() => form.estimatedHours, calcSuggestedBaseScore);

  const testerNoneSentinel = -1;

  const assigneePickerVisible = ref(false);
  const assigneePickerSelectedIds = ref<number[]>([]);
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

  function onAssigneeCardClick(id: number) {
    const checked = assigneePickerSelectedIds.value.includes(id);
    onAssigneeToggle(id, !checked);
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

  function onTesterCardClick(id: number) {
    testerPickerTempId.value = id;
  }

  function resetCreateForm() {
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
      suggestedBaseScore: 0,
      baseScore: undefined,
      baseScoreSource: 'AUTO',
      testCases: []
    });
    calcSuggestedBaseScore();
  }

  async function hydrateFromEditRow(row: Api.Task.Task) {
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
      suggestedBaseScore: base.suggestedBaseScore ?? 0,
      baseScore: base.baseScore ?? base.suggestedBaseScore ?? undefined,
      baseScoreSource: base.baseScoreSource ?? 'AUTO',
      testCases:
        wd === 'SOFTWARE_DEVELOPMENT'
          ? (detail?.testCases ?? []).map((tc) => ({
              id: tc.id,
              description: tc.description,
              expectedResult: tc.expectedResult
            }))
          : []
    });

    await nextTick();
    await nextTick();
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
  }

  watch(
    () => props.modelValue,
    async (visible) => {
      if (!visible) return;
      if (props.mode === 'create') {
        resetCreateForm();
        await nextTick();
        taskAttachRef.value?.reset();
      } else if (props.editRow) {
        await hydrateFromEditRow(props.editRow);
      }
    }
  );

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
          baseScore: form.baseScore ?? null,
          baseScoreSource: form.baseScoreSource,
          attachmentIds,
          testCases: buildTestCasesForApi(form.testCases)
        });
        ElMessage.success('更新成功');
        emit('submitted', 'update');
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
          baseScore: form.baseScore ?? undefined,
          testCases: buildTestCasesForApi(form.testCases).map((tc) => ({
            description: tc.description,
            expectedResult: tc.expectedResult
          })),
          attachmentIds: attachmentIds.length ? attachmentIds : undefined
        });
        ElMessage.success('创建成功');
        taskAttachRef.value?.reset();
        emit('submitted', 'create');
      }
      innerVisible.value = false;
    } catch {
      /* http 拦截器已处理 */
    } finally {
      submitting.value = false;
    }
  }

  async function loadUsers() {
    const res = await fetchOrgMembers();
    if (res) userList.value = res;
  }

  onMounted(() => {
    loadUsers();
  });
</script>

<style scoped lang="scss">
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
