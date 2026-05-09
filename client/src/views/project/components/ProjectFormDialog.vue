<template>
  <ArtDialog
    v-model="innerVisible"
    :title="mode === 'edit' ? '编辑项目' : '新建项目'"
    :subtitle="createWizardSubtitle"
    icon="solar:folder-bold-duotone"
    width="1060px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <!-- 编辑：原左右布局，规则折叠为高级设置 -->
      <template v-if="mode === 'edit'">
        <div class="task-form-layout">
          <div class="task-form-layout__left">
            <el-form-item label="项目名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="请输入项目名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="项目描述">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="请输入项目描述"
              />
            </el-form-item>
            <el-form-item label="项目状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option
                  v-for="s in STATUS_OPTIONS"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="项目周期">
              <el-date-picker
                v-model="form.dateRange"
                type="daterange"
                range-separator="~"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
              />
            </el-form-item>

            <el-divider />

            <el-collapse v-model="editAdvancedRulesPanel" class="project-edit-advanced-collapse">
              <el-collapse-item name="rules">
                <template #title>
                  <div class="advanced-rules-collapse-title">
                    <span class="advanced-rules-collapse-title__main">高级规则设置</span>
                    <span class="advanced-rules-collapse-title__sub"
                      >如有个性化需要，可展开设置</span
                    >
                  </div>
                </template>
                <div class="task-rule-grid">
                  <div class="task-rule-item">
                    <span>要求预估工时</span>
                    <el-switch v-model="taskRulesForm.requireEstimateHours" />
                  </div>
                  <div class="task-rule-item">
                    <span>要求截止时间</span>
                    <el-switch v-model="taskRulesForm.requireDueDate" />
                  </div>
                  <div class="task-rule-item">
                    <span>开发提交验收需自测证据</span>
                    <el-switch v-model="taskRulesForm.requireTestEvidenceForDev" />
                  </div>
                  <div class="task-rule-item">
                    <span>允许协助人提交 QA</span>
                    <el-switch v-model="taskRulesForm.allowCoAssigneeSubmitQa" />
                  </div>
                  <div class="task-rule-item">
                    <span>打回修改允许不填工时</span>
                    <el-switch v-model="taskRulesForm.allowQaRejectWithoutHours" />
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>

          <div class="task-form-layout__right">
            <div class="right-panel-title">人员分配</div>

            <el-form-item label="负责人" prop="managerId" class="right-panel-item">
              <div class="task-form-member-field">
                <div class="task-form-member-tags">
                  <el-tag
                    v-if="projectManagerUser"
                    type="primary"
                    closable
                    class="task-form-user-tag task-form-user-tag--main"
                    title="项目负责人"
                    @close="clearProjectManager"
                  >
                    <span class="task-form-user-tag-inner">
                      <UserAvatar
                        :size="18"
                        :src="projectManagerUser.avatar ?? undefined"
                        :name="userDisplayName(projectManagerUser)"
                        :gender="projectManagerUser.userGender ?? ''"
                      />
                      <span>{{ userDisplayName(projectManagerUser) }}</span>
                    </span>
                  </el-tag>
                  <div v-else class="task-form-member-placeholder">
                    <span class="task-form-member-placeholder__main">暂未分配负责人</span>
                    <span class="task-form-member-placeholder__sub">请选择一名项目负责人</span>
                  </div>
                </div>
                <el-button class="dashed-action-btn" plain @click="openProjectManagerPicker">
                  <art-svg-icon
                    icon="mdi:account-plus-outline"
                    style="margin-right: 4px; font-size: 16px"
                  />
                  选择人员
                </el-button>
              </div>
            </el-form-item>
          </div>
        </div>
      </template>

      <!-- 新建：分步向导 -->
      <template v-else>
        <div class="project-create-wizard">
          <div class="wizard-steps wizard-steps--compact" aria-label="新建项目步骤">
            <template v-for="(step, idx) in CREATE_WIZARD_STEP_META" :key="step.key">
              <div
                class="wizard-step-crumb"
                :class="{
                  'wizard-step-crumb--active': createWizardStep === idx,
                  'wizard-step-crumb--done': createWizardStep > idx
                }"
              >
                <span class="wizard-step-crumb__n">{{ idx + 1 }}</span>
                <span class="wizard-step-crumb__t">{{ step.title }}</span>
              </div>
              <el-icon
                v-if="idx < CREATE_WIZARD_STEP_META.length - 1"
                class="wizard-step-crumb__arrow"
              >
                <ArrowRight />
              </el-icon>
            </template>
          </div>

          <div class="wizard-body">
            <!-- 1 基本信息 + 人员分配（左右布局，与编辑弹窗一致） -->
            <div v-show="createWizardStep === 0" class="wizard-pane wizard-pane--basic">
              <div class="task-form-layout">
                <div class="task-form-layout__left">
                  <el-form-item label="项目名称" prop="name">
                    <el-input
                      v-model="form.name"
                      placeholder="请输入项目名称"
                      maxlength="100"
                      show-word-limit
                    />
                  </el-form-item>
                  <el-form-item label="项目描述">
                    <el-input
                      v-model="form.description"
                      type="textarea"
                      :rows="3"
                      placeholder="请输入项目描述"
                    />
                  </el-form-item>
                  <el-form-item label="项目状态" prop="status">
                    <el-select v-model="form.status" style="width: 100%">
                      <el-option
                        v-for="s in STATUS_OPTIONS"
                        :key="s.value"
                        :label="s.label"
                        :value="s.value"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="项目周期">
                    <el-date-picker
                      v-model="form.dateRange"
                      type="daterange"
                      range-separator="~"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      style="width: 100%"
                    />
                  </el-form-item>
                </div>

                <div class="task-form-layout__right">
                  <div class="right-panel-title">人员分配</div>

                  <el-form-item label="负责人" prop="managerId" class="right-panel-item">
                    <div class="task-form-member-field">
                      <div class="task-form-member-tags">
                        <el-tag
                          v-if="projectManagerUser"
                          type="primary"
                          closable
                          class="task-form-user-tag task-form-user-tag--main"
                          title="项目负责人"
                          @close="clearProjectManager"
                        >
                          <span class="task-form-user-tag-inner">
                            <UserAvatar
                              :size="18"
                              :src="projectManagerUser.avatar ?? undefined"
                              :name="userDisplayName(projectManagerUser)"
                              :gender="projectManagerUser.userGender ?? ''"
                            />
                            <span>{{ userDisplayName(projectManagerUser) }}</span>
                          </span>
                        </el-tag>
                        <div v-else class="task-form-member-placeholder">
                          <span class="task-form-member-placeholder__main">暂未分配负责人</span>
                          <span class="task-form-member-placeholder__sub">
                            点击下方按钮从组织成员中选择
                          </span>
                        </div>
                      </div>
                      <el-button class="dashed-action-btn" plain @click="openProjectManagerPicker">
                        <art-svg-icon
                          icon="mdi:account-plus-outline"
                          style="margin-right: 4px; font-size: 16px"
                        />
                        选择人员
                      </el-button>
                    </div>
                  </el-form-item>
                </div>
              </div>
            </div>

            <!-- 2 规则 -->
            <div v-show="createWizardStep === 1" class="wizard-pane wizard-pane--rules">
              <p class="wizard-rules-intro"
                >以下为当前项目的任务流程规则，可按需调整；也可直接使用默认配置。</p
              >
              <div class="task-rule-grid">
                <div class="task-rule-item">
                  <span>要求预估工时</span>
                  <el-switch v-model="taskRulesForm.requireEstimateHours" />
                </div>
                <div class="task-rule-item">
                  <span>要求截止时间</span>
                  <el-switch v-model="taskRulesForm.requireDueDate" />
                </div>
                <div class="task-rule-item">
                  <span>开发提交验收需自测证据</span>
                  <el-switch v-model="taskRulesForm.requireTestEvidenceForDev" />
                </div>
                <div class="task-rule-item">
                  <span>允许协助人提交 QA</span>
                  <el-switch v-model="taskRulesForm.allowCoAssigneeSubmitQa" />
                </div>
                <div class="task-rule-item">
                  <span>打回修改允许不填工时</span>
                  <el-switch v-model="taskRulesForm.allowQaRejectWithoutHours" />
                </div>
              </div>
            </div>

            <!-- 3 完成 -->
            <div v-show="createWizardStep === 2" class="wizard-pane wizard-pane--review">
              <div class="wizard-review-card">
                <div class="wizard-review-row">
                  <span class="wizard-review-k">项目名称</span>
                  <span class="wizard-review-v">{{ form.name || '—' }}</span>
                </div>
                <div class="wizard-review-row">
                  <span class="wizard-review-k">项目状态</span>
                  <span class="wizard-review-v">{{ statusLabelOf(form.status) }}</span>
                </div>
                <div class="wizard-review-row">
                  <span class="wizard-review-k">项目周期</span>
                  <span class="wizard-review-v">{{ dateRangeSummary }}</span>
                </div>
                <div class="wizard-review-row wizard-review-row--top">
                  <span class="wizard-review-k">负责人</span>
                  <span class="wizard-review-v">{{
                    projectManagerUser ? userDisplayName(projectManagerUser) : '—'
                  }}</span>
                </div>
                <div class="wizard-review-row wizard-review-row--top">
                  <span class="wizard-review-k">任务流程规则</span>
                  <ul class="wizard-review-rules">
                    <li v-for="line in taskRulesSummaryLines" :key="line">{{ line }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-form>
    <template #footer>
      <template v-if="mode === 'edit'">
        <el-button @click="innerVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
      <template v-else>
        <el-button @click="innerVisible = false">取消</el-button>
        <el-button v-if="createWizardStep > 0" @click="createWizardStep--">上一步</el-button>
        <el-button
          v-if="createWizardStep < CREATE_WIZARD_STEP_META.length - 1"
          type="primary"
          @click="goCreateWizardNext"
          >下一步</el-button
        >
        <el-button v-else type="primary" :loading="submitting" @click="handleSubmit">
          创建项目
        </el-button>
      </template>
    </template>
  </ArtDialog>

  <ArtDialog
    v-model="managerPickerVisible"
    title="选择项目负责人"
    subtitle="从组织成员中单选一位负责人"
    icon="mdi:account-group-outline"
    width="600px"
    :z-index="9100"
    :show-minimize="false"
    :show-maximize="false"
  >
    <div class="task-member-picker">
      <div class="task-member-picker__scroll task-member-picker__scroll--tight">
        <el-radio-group v-model="managerPickerTempId" class="task-member-picker__radio-group">
          <div
            v-for="u in userList"
            :key="u.id"
            class="member-pick-card member-pick-card--tester"
            :class="{ 'member-pick-card--active': managerPickerTempId === u.id }"
            @click="onManagerCardClick(u.id)"
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
      <el-button @click="managerPickerVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmProjectManagerPicker">确定</el-button>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted } from 'vue';
  import { ArrowRight } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import type { FormInstance, FormRules } from 'element-plus';
  import {
    fetchProjectCreate,
    fetchProjectUpdate,
    fetchProjectOrgMembers,
    fetchProjectTaskRules,
    updateProjectTaskRules,
    type ProjectTaskRules,
    type ProjectItem,
    type ProjectStatus
  } from '@/api/project';
  import { PROJECT_STATUS_UI } from '@/enums/modules/projectEnum';

  const props = defineProps<{
    modelValue: boolean;
    mode: 'create' | 'edit';
    /** 编辑模式下传入当前卡片数据 */
    initialProject: ProjectItem | null;
  }>();

  const emit = defineEmits<{
    'update:modelValue': [v: boolean];
    success: [];
  }>();

  const innerVisible = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
  });

  const STATUS_OPTIONS = PROJECT_STATUS_UI;

  /** 编辑页：任务流程规则默认折叠 */
  const editAdvancedRulesPanel = ref<string[]>([]);

  const CREATE_WIZARD_STEP_META = [
    {
      key: 'basic',
      title: '基本信息',
      hint: '名称与负责人',
      subtitle: '填写项目信息与项目负责人'
    },
    { key: 'rules', title: '规则', hint: '流程开关', subtitle: '按需调整任务流程规则' },
    { key: 'done', title: '完成', hint: '确认创建', subtitle: '核对信息并创建项目' }
  ] as const;

  const createWizardStep = ref(0);

  const submitting = ref(false);
  const formRef = ref<FormInstance>();
  const userList = ref<
    {
      id: number;
      userName: string;
      nickName: string | null;
      avatar: string | null;
      userEmail?: string | null;
      userGender?: string | null;
      userPhone?: string | null;
    }[]
  >([]);

  const form = reactive({
    name: '',
    description: '',
    managerId: undefined as number | undefined,
    status: 'ACTIVE' as ProjectStatus,
    /** 使用 Date 绑定，避免 value-format 与后端带毫秒的 ISO 字符串不一致导致无法回显 */
    dateRange: null as [Date, Date] | null
  });

  const taskRulesForm = reactive<ProjectTaskRules>({
    requireEstimateHours: false,
    requireDueDate: false,
    requireTestEvidenceForDev: true,
    allowCoAssigneeSubmitQa: false,
    allowQaRejectWithoutHours: true
  });

  const createWizardSubtitle = computed(() => {
    if (props.mode !== 'create') return undefined;
    const meta = CREATE_WIZARD_STEP_META[createWizardStep.value];
    return meta ? `步骤 ${createWizardStep.value + 1}/3 · ${meta.subtitle}` : undefined;
  });

  function statusLabelOf(status: ProjectStatus): string {
    return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
  }

  function pad2(n: number): string {
    return String(n).padStart(2, '0');
  }

  const dateRangeSummary = computed(() => {
    const r = form.dateRange;
    if (!r?.[0] || !r?.[1]) return '未设置';
    const fmt = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    return `${fmt(r[0])} ~ ${fmt(r[1])}`;
  });

  const taskRulesSummaryLines = computed(() => {
    const t = taskRulesForm;
    return [
      `要求预估工时：${t.requireEstimateHours ? '开' : '关'}`,
      `要求截止时间：${t.requireDueDate ? '开' : '关'}`,
      `验收需自测证据：${t.requireTestEvidenceForDev ? '开' : '关'}`,
      `协助人可提交 QA：${t.allowCoAssigneeSubmitQa ? '开' : '关'}`,
      `打回可不填工时：${t.allowQaRejectWithoutHours ? '开' : '关'}`
    ];
  });

  async function goCreateWizardNext() {
    try {
      if (createWizardStep.value === 0) {
        await formRef.value?.validateField(['name', 'status', 'managerId']);
      }
      createWizardStep.value++;
    } catch {
      /* 表单校验未通过 */
    }
  }

  const rules: FormRules = {
    name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
    managerId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
    status: [{ required: true, message: '请选择项目状态', trigger: 'change' }]
  };

  const managerPickerVisible = ref(false);
  const managerPickerTempId = ref<number | undefined>(undefined);

  function userDisplayName(u: { userName: string; nickName: string | null }) {
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

  const projectManagerUser = computed(() => {
    if (!form.managerId) return null;
    return userList.value.find((u) => u.id === form.managerId) ?? null;
  });

  function openProjectManagerPicker() {
    managerPickerTempId.value = form.managerId;
    managerPickerVisible.value = true;
  }

  function onManagerCardClick(id: number) {
    managerPickerTempId.value = id;
  }

  function clearProjectManager() {
    form.managerId = undefined;
  }

  function confirmProjectManagerPicker() {
    if (!managerPickerTempId.value) {
      ElMessage.warning('请选择项目负责人');
      return;
    }
    form.managerId = managerPickerTempId.value;
    managerPickerVisible.value = false;
  }

  async function loadUsers() {
    const res = await fetchProjectOrgMembers();
    if (Array.isArray(res)) userList.value = res;
  }

  function parseProjectDate(d: string | null | undefined): Date | null {
    if (d == null || String(d).trim() === '') return null;
    const t = new Date(d);
    return Number.isNaN(t.getTime()) ? null : t;
  }

  /** 与列表卡片一致：有起止则区间；仅一端有值时仍尽量回显到日期选择器 */
  function projectDatesToRange(proj: ProjectItem): [Date, Date] | null {
    const start = parseProjectDate(proj.startDate);
    const end = parseProjectDate(proj.endDate);
    if (start && end) return [start, end];
    if (start) return [start, start];
    if (end) return [end, end];
    return null;
  }

  function toApiIsoDate(v: Date | null | undefined): string | null {
    if (!v) return null;
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString();
  }

  function resetDefaults() {
    Object.assign(form, {
      name: '',
      description: '',
      managerId: undefined,
      status: 'ACTIVE',
      dateRange: null
    });
    Object.assign(taskRulesForm, {
      requireEstimateHours: false,
      requireDueDate: false,
      requireTestEvidenceForDev: true,
      allowCoAssigneeSubmitQa: false,
      allowQaRejectWithoutHours: true
    });
  }

  async function syncFromProps() {
    if (props.mode === 'create') {
      resetDefaults();
      return;
    }
    const proj = props.initialProject;
    if (!proj) return;
    Object.assign(form, {
      name: proj.name,
      description: proj.description ?? '',
      managerId: proj.managerId,
      status: proj.status,
      dateRange: projectDatesToRange(proj)
    });
    try {
      const rule = await fetchProjectTaskRules(proj.id);
      if (rule) Object.assign(taskRulesForm, rule);
    } catch {
      /* 拦截器处理 */
    }
  }

  watch(
    () => props.modelValue,
    (visible) => {
      if (visible) {
        void syncFromProps();
        if (props.mode === 'create') createWizardStep.value = 0;
      }
    }
  );

  async function handleSubmit() {
    await formRef.value?.validate();
    submitting.value = true;
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        managerId: form.managerId!,
        status: form.status,
        startDate: toApiIsoDate(form.dateRange?.[0]),
        endDate: toApiIsoDate(form.dateRange?.[1])
      };
      if (props.mode === 'edit' && props.initialProject) {
        await fetchProjectUpdate(props.initialProject.id, {
          ...payload,
          version: props.initialProject.version
        });
        await updateProjectTaskRules(props.initialProject.id, { ...taskRulesForm });
        ElMessage.success('更新成功');
      } else {
        const created = await fetchProjectCreate(payload);
        await updateProjectTaskRules(created.id, { ...taskRulesForm });
        ElMessage.success('创建成功');
      }
      innerVisible.value = false;
      emit('success');
    } catch {
      /* 拦截器处理 */
    } finally {
      submitting.value = false;
    }
  }

  onMounted(() => {
    loadUsers();
  });
</script>

<style scoped lang="scss">
  /* 与 TaskFormDialog 一致的左右布局与右侧「人员分配」样式 */
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
    background: transparent;
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    padding: 20px 16px;
    box-sizing: border-box;
  }

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
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      width: auto !important;
      justify-content: flex-start;
      line-height: 1.4;
      padding: 0 0 10px;
      color: var(--el-text-color-primary);
      font-weight: 500;
    }

    :deep(.el-form-item__content) {
      margin-left: 0 !important;
    }
  }

  .task-form-member-field {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 12px;
  }

  .task-form-member-tags {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .task-form-member-placeholder {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-extra-light);
    text-align: left;
  }

  .task-form-member-placeholder__main {
    font-size: 13px;
    color: var(--el-text-color-regular);
    font-weight: 500;
    line-height: 1.4;
  }

  .task-form-member-placeholder__sub {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    font-weight: normal;
    line-height: 1.45;
  }

  .task-form-user-tag {
    min-height: 32px;
    padding: 4px 10px 4px 4px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    border: 1px solid transparent;

    :deep(.el-tag__content) {
      display: inline-flex;
      align-items: center;
    }

    :deep(.el-tag__close) {
      margin-left: 4px;
      border-radius: 50%;
    }

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
  }

  .task-form-user-tag-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
  }

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

  /* 选人子弹窗（与 TaskFormDialog 一致） */
  .task-member-picker {
    margin: -4px 0 0;
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
    grid-template-columns: auto 48px minmax(0, 1fr);
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
  }

  .member-pick-card__meta-icon {
    font-size: 15px;
    opacity: 0.88;
    color: var(--el-color-primary);
  }

  .task-rule-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
  }

  .task-rule-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: var(--el-text-color-primary);
    line-height: 1.4;
    flex-wrap: nowrap;
  }

  /* 编辑：高级规则折叠 */
  .project-edit-advanced-collapse {
    margin-top: 4px;
    border: none;
    --el-collapse-border-color: transparent;
  }

  .project-edit-advanced-collapse :deep(.el-collapse-item__header) {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 6px;
    line-height: 1.45;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .project-edit-advanced-collapse :deep(.el-collapse-item__header:hover) {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 14px rgb(0 0 0 / 6%);
  }

  .project-edit-advanced-collapse :deep(.el-collapse-item__wrap) {
    border-bottom: none;
  }

  .project-edit-advanced-collapse :deep(.el-collapse-item__content) {
    padding: 16px 4px 8px;
  }

  .advanced-rules-collapse-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
  }

  .advanced-rules-collapse-title__main {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .advanced-rules-collapse-title__sub {
    font-size: 12px;
    font-weight: normal;
    color: var(--el-text-color-secondary);
  }

  /* 新建：分步向导 */
  .project-create-wizard {
    margin: -4px 0 4px;
  }

  /* B 端简洁步骤条：横向紧凑 + 箭头分隔 */
  .wizard-steps--compact {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 4px;
    padding: 8px 0 14px;
    margin-bottom: 4px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    width: 100%;
    box-sizing: border-box;
  }

  .wizard-step-crumb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    padding: 4px 2px;
    border-radius: 4px;
    transition: color 0.15s ease;
  }

  .wizard-step-crumb__n {
    flex-shrink: 0;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    line-height: 18px;
    text-align: center;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
    font-variant-numeric: tabular-nums;
  }

  .wizard-step-crumb__t {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    line-height: 1.3;
    white-space: nowrap;
  }

  .wizard-step-crumb--done .wizard-step-crumb__n {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .wizard-step-crumb--done .wizard-step-crumb__t {
    color: var(--el-text-color-regular);
  }

  .wizard-step-crumb--active .wizard-step-crumb__n {
    color: #fff;
    background: var(--el-color-primary);
  }

  .wizard-step-crumb--active .wizard-step-crumb__t {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }

  .wizard-step-crumb__arrow {
    flex-shrink: 0;
    font-size: 13px;
    color: var(--el-text-color-placeholder);
    margin: 0 2px;
  }

  .wizard-body {
    min-height: 280px;
    padding: 8px 4px 12px;
  }

  .wizard-pane {
    margin: 0 auto;
    animation: wizard-pane-in 0.28s ease;
  }

  .wizard-pane--basic .task-form-layout {
    width: 100%;
  }

  .wizard-pane--rules,
  .wizard-pane--review {
    max-width: 560px;
  }

  @keyframes wizard-pane-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .wizard-rules-intro {
    margin: 0 0 16px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--el-text-color-secondary);
  }

  .wizard-review-card {
    padding: 20px 22px;
    border-radius: 14px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-blank);
    box-shadow: 0 4px 20px rgb(0 0 0 / 4%);
  }

  .wizard-review-row {
    display: flex;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    font-size: 13px;
    align-items: baseline;

    &:last-child {
      border-bottom: none;
      padding-bottom: 4px;
    }

    &:first-child {
      padding-top: 4px;
    }
  }

  .wizard-review-row--top {
    align-items: flex-start;
  }

  .wizard-review-k {
    flex: 0 0 104px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  .wizard-review-v {
    flex: 1;
    min-width: 0;
    color: var(--el-text-color-primary);
    font-weight: 600;
    word-break: break-word;
  }

  .wizard-review-rules {
    flex: 1;
    margin: 0;
    padding-left: 18px;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.65;
  }

  @media (max-width: 720px) {
    .wizard-steps--compact {
      gap: 6px 8px;
    }

    .wizard-step-crumb__t {
      white-space: normal;
    }
  }
</style>
