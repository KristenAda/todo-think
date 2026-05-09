<template>
  <ArtDialog
    v-model="innerVisible"
    :title="mode === 'edit' ? '编辑任务' : '新建任务'"
    icon="solar:checklist-bold-duotone"
    width="1060px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <div class="task-form-layout">
        <div class="task-form-layout__left">
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
              :rows="4"
              placeholder="请输入任务描述"
            />
          </el-form-item>

          <el-row :gutter="24">
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

          <el-row :gutter="24">
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

          <el-row :gutter="24">
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
            <el-col :span="12">
              <el-form-item label="难度档位">
                <el-select
                  v-model="form.complexityTier"
                  placeholder="选择任务难度"
                  style="width: 100%"
                  popper-class="tier-dropdown-popper"
                >
                  <el-option
                    v-for="opt in TASK_COMPLEXITY_TIER_OPTIONS"
                    :key="opt.value"
                    :label="`${opt.label}（系数 ${opt.coefficient}）`"
                    :value="opt.value"
                  >
                    <div class="tier-option">
                      <span class="tier-option__title"
                        >{{ opt.label }}（系数 {{ opt.coefficient }}）</span
                      >
                      <span class="tier-option__desc">{{ opt.description }}</span>
                    </div>
                  </el-option>
                </el-select>
                <div class="field-hint-inline">
                  绩效结算按档位映射为公式变量 complexity，无需手写小数。
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="基础积分" style="margin-bottom: 8px">
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

          <el-form-item style="margin-bottom: 20px">
            <el-alert
              type="info"
              :closable="false"
              show-icon
              style="line-height: 1.5; padding: 6px 12px"
            >
              <template #title>
                基础积分会自动给出建议并填充（不展示建议值）。<br />
                规则：建议基础积分 = (类型基准 + min(预估工时,12)*0.8) × 优先级系数 ×
                领域系数；你可在上方直接调整。
              </template>
            </el-alert>
          </el-form-item>

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
        </div>

        <div class="task-form-layout__right">
          <div class="right-panel-title">人员分配</div>

          <el-form-item label="负责人" class="right-panel-item">
            <div class="task-form-member-field">
              <div class="task-form-member-tags">
                <template v-if="mainAssigneeUser || coAssigneeUsers.length">
                  <el-tag
                    v-if="mainAssigneeUser"
                    type="primary"
                    closable
                    class="task-form-user-tag task-form-user-tag--main"
                    title="主要负责人"
                    @close="removeMainAssigneeTag"
                  >
                    <span class="task-form-user-tag-inner">
                      <UserAvatar
                        :size="18"
                        :src="mainAssigneeUser.avatar ?? undefined"
                        :name="userDisplayName(mainAssigneeUser)"
                        :gender="mainAssigneeUser.userGender ?? ''"
                      />
                      <span>{{ userDisplayName(mainAssigneeUser) }}</span>
                    </span>
                  </el-tag>
                  <el-tag
                    v-for="u in coAssigneeUsers"
                    :key="u.id"
                    type="success"
                    closable
                    class="task-form-user-tag task-form-user-tag--co"
                    title="点击切换为主要负责人"
                    @close="removeCoAssigneeTag(u.id)"
                  >
                    <span
                      class="task-form-user-tag-inner task-form-user-tag-inner--promote"
                      @click.stop="promoteToMainAssignee(u.id)"
                    >
                      <UserAvatar
                        :size="18"
                        :src="u.avatar ?? undefined"
                        :name="userDisplayName(u)"
                        :gender="u.userGender ?? ''"
                      />
                      <span>{{ userDisplayName(u) }}</span>
                    </span>
                  </el-tag>
                </template>
                <div v-else class="task-form-member-placeholder">暂未分配主要负责人</div>
              </div>
              <el-button class="dashed-action-btn" plain @click="openAssigneePicker">
                <art-svg-icon
                  icon="mdi:account-plus-outline"
                  style="margin-right: 4px; font-size: 16px"
                />
                选择人员
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="测试验收人" class="right-panel-item">
            <div class="task-form-member-field">
              <div class="task-form-member-tags">
                <el-tag
                  v-if="testerUser"
                  type="warning"
                  closable
                  class="task-form-user-tag"
                  @close="clearTester"
                >
                  <span class="task-form-user-tag-inner">
                    <UserAvatar
                      :size="18"
                      :src="testerUser.avatar ?? undefined"
                      :name="userDisplayName(testerUser)"
                      :gender="testerUser.userGender ?? ''"
                    />
                    <span>{{ userDisplayName(testerUser) }}</span>
                  </span>
                </el-tag>
                <div v-else class="task-form-member-placeholder">可暂不指定</div>
              </div>
              <el-button class="dashed-action-btn" plain @click="openTesterPicker">
                <art-svg-icon
                  icon="mdi:clipboard-account-outline"
                  style="margin-right: 4px; font-size: 16px"
                />
                选择验收人
              </el-button>
            </div>
          </el-form-item>
        </div>
      </div>
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
            <UserAvatar
              :size="48"
              :src="u.avatar ?? undefined"
              :name="userDisplayName(u)"
              :gender="u.userGender ?? ''"
              avatar-class="member-pick-card__avatar"
            />
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
      <el-button type="default" @click="confirmAssigneePicker">确定</el-button>
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
                <span class="member-pick-card__meta-item member-pick-card__meta-item--muted">
                  可选
                </span>
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
            <UserAvatar
              :size="48"
              :src="u.avatar ?? undefined"
              :name="userDisplayName(u)"
              :gender="u.userGender ?? ''"
              avatar-class="member-pick-card__avatar"
            />
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
      <el-button type="default" @click="confirmTesterPicker">确定</el-button>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
  import { ElMessage } from 'element-plus';
  import type { FormInstance, FormRules } from 'element-plus';
  import { fetchTaskInfo, fetchCreateTask, fetchUpdateTask, fetchOrgMembers } from '@/api/task';
  import TaskAttachmentField from './TaskAttachmentField.vue';
  import {
    TaskComplexityTierEnum,
    TASK_COMPLEXITY_TIER_OPTIONS,
    inferComplexityTierFromCoefficient
  } from '@/enums/modules/taskComplexityTierEnum';

  const props = defineProps<{
    modelValue: boolean;
    mode: 'create' | 'edit';
    projectList: Api.Task.SimpleProject[];
    editRow: Api.Task.Task | null;
  }>();

  const emit = defineEmits<{
    'update:modelValue': [v: boolean];
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
    complexityTier: TaskComplexityTierEnum.STANDARD as Api.Task.TaskComplexityTier,
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
      (typeBase[form.type] + hourPart) *
      priorityFactor[form.priority] *
      domainFactor[form.workDomain];
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

  /** 在表单右侧标签区点击协作人胶囊，将其切换为主要负责人 */
  function promoteToMainAssignee(userId: number) {
    if (form.mainAssigneeId === userId) return;
    const oldMain = form.mainAssigneeId;
    const rest = form.coAssigneeIds.filter((id) => id !== userId);
    if (oldMain != null && oldMain !== userId) {
      rest.push(oldMain);
    }
    form.mainAssigneeId = userId;
    form.coAssigneeIds = rest;
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
      complexityTier: TaskComplexityTierEnum.STANDARD,
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
      complexityTier: base.complexityTier ?? inferComplexityTierFromCoefficient(base.complexity),
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
          complexityTier: form.complexityTier,
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
          complexityTier: form.complexityTier,
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

<style lang="scss">
  /* 解决下拉选项文字较长时拥挤的问题 */
  .tier-dropdown-popper {
    .el-select-dropdown__item {
      height: auto !important;
      padding: 8px 12px !important;
      white-space: normal;
      line-height: 1.5;
    }
  }
</style>

<style scoped lang="scss">
  /* ---- 核心布局样式 ---- */
  .task-form-layout {
    display: flex;
    gap: 28px;
    align-items: flex-start;
  }

  .task-form-layout__left {
    flex: 1;
    min-width: 0;
  }

  .task-form-layout__right {
    width: 360px;
    flex-shrink: 0;
    /* 优化侧边栏背景色与边框，更有质感 */
    background: #f8f9fc;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 20px 16px;
    box-sizing: border-box;
    /* 给右侧栏加一点极弱的阴影提升立体感 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  }

  /* ---- 右侧面板内表单项重写 ---- */
  .right-panel-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 6px;

    &::before {
      content: '';
      display: block;
      width: 3px;
      height: 14px;
      background: var(--el-color-primary);
      border-radius: 2px;
    }
  }

  .right-panel-item {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 24px;

    /* 强制重写 Element Plus 标签样式，使其居左并在顶部 */
    :deep(.el-form-item__label) {
      width: auto !important;
      justify-content: flex-start;
      line-height: 1.4;
      padding: 0 0 10px 0;
      color: var(--el-text-color-primary);
      font-weight: 500;
    }

    :deep(.el-form-item__content) {
      margin-left: 0 !important;
    }
  }

  /* ---- 选人组件相关 ---- */
  .task-form-member-field {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 12px;
  }
  .task-form-member-tags {
    display: flex;
    flex-wrap: wrap; /* 允许横向折行 */
    flex-direction: row; /* 取消之前的 column，改为横向排列 */
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .task-form-member-placeholder {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-radius: 6px;
    padding: 8px 12px;
    text-align: center;
    border: 1px dashed var(--el-border-color-lighter);
  }

  /* 让 Tag 变得更丰满，适应右侧布局 */
  .task-form-user-tag {
    min-height: 32px;
    padding: 4px 10px 4px 4px; /* 左侧内边距调小以贴合头像，右侧留出空间 */
    border-radius: 999px; /* 胶囊圆角 */
    display: inline-flex;
    align-items: center;
    border: 1px solid transparent;

    :deep(.el-tag__content) {
      display: inline-flex;
      align-items: center;
      /* 重点：去掉了之前的 width: 100%，让它根据内容自适应宽度 */
    }

    :deep(.el-tag__close) {
      margin-left: 4px;
      border-radius: 50%;
    }

    /* 对应图中蓝色主负责人的样式 */
    &.el-tag--primary {
      background-color: #f2f5fa;
      border-color: #dce5fa;
      color: #4a75f6;

      :deep(.el-tag__close) {
        color: #7b9af8;
        &:hover {
          background-color: #dce5fa;
          color: #4a75f6;
        }
      }
    }
    /* 对应图中白色普通负责人的样式 (这里直接覆盖 success/warning 统一为白底灰边) */
    &:not(.el-tag--primary) {
      background-color: #ffffff;
      border-color: #e4e7ed;
      color: #606266;

      :deep(.el-tag__close) {
        color: #a8abb2;
        &:hover {
          background-color: #f4f4f5;
          color: #606266;
        }
      }
    }
  }
  .task-form-user-tag-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
  }

  /* 协作人胶囊：点击主体切换为主要负责人（关闭按钮不受影响） */
  .task-form-user-tag-inner--promote {
    cursor: pointer;
    border-radius: 999px;
    padding: 2px 4px 2px 2px;
    margin: -2px -4px -2px -2px;
    transition:
      background-color 0.15s ease,
      opacity 0.15s ease;

    &:hover {
      // background-color: var(--el-fill-color-light);
    }

    &:active {
      opacity: 0.92;
    }
  }

  /* 虚线风格添加按钮 */
  .dashed-action-btn {
    width: 100%;
    border-style: dashed;
    border-color: var(--el-border-color);
    color: var(--el-text-color-regular);
    background: transparent;

    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  /* ---- 其他通用表单微调 ---- */
  .field-hint-inline {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }

  .tier-option {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.35;
    padding: 4px 0;
  }

  .tier-option__title {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  .tier-option__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: normal;
  }

  /* 测试用例表格样式 */
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

  /* ---- 弹窗中的人员选择卡片 (保留原有样式) ---- */
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

  :deep(.member-pick-card__avatar.color-avatar) {
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
