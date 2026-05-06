<template>
  <ArtDialog
    v-model="innerVisible"
    :title="mode === 'edit' ? '编辑项目' : '新建项目'"
    icon="solar:folder-bold-duotone"
    width="660px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
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
      <el-form-item label="负责人" prop="managerId">
        <div class="proj-member-field proj-member-field--block">
          <div class="proj-member-tags">
            <el-tag v-if="projectManagerUser" type="primary" class="proj-user-tag">
              <span class="proj-user-tag__inner">
                <el-avatar :size="20" :src="projectManagerUser.avatar ?? undefined">{{
                  initials(projectManagerUser)
                }}</el-avatar>
                <span>{{ userDisplayName(projectManagerUser) }}</span>
              </span>
            </el-tag>
            <span v-else class="proj-member-placeholder">未选择（必选）</span>
          </div>
          <el-button @click="openProjectManagerPicker">选择人员</el-button>
        </div>
      </el-form-item>
      <el-form-item label="项目状态" prop="status">
        <el-select v-model="form.status" style="width: 100%">
          <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
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

      <el-form-item label="任务流程规则">
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
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="innerVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </ArtDialog>

  <ArtDialog
    v-model="managerPickerVisible"
    title="选择项目负责人"
    subtitle="单选，必选"
    icon="mdi:account-tie-outline"
    width="600px"
    :z-index="9100"
    :show-minimize="false"
    :show-maximize="false"
  >
    <div class="proj-member-picker">
      <div class="proj-member-picker__scroll">
        <el-radio-group v-model="managerPickerTempId" class="proj-member-picker__radio-group">
          <div
            v-for="u in userList"
            :key="u.id"
            class="member-pick-card member-pick-card--tester"
            :class="{ 'member-pick-card--active': managerPickerTempId === u.id }"
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
      <el-button @click="managerPickerVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmProjectManagerPicker">确定</el-button>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted } from 'vue';
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

  const STATUS_OPTIONS = [
    { value: 'PLANNING', label: '计划中' },
    { value: 'ACTIVE', label: '进行中' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'SUSPENDED', label: '已搁置' }
  ] as const;

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
  function initials(u: { userName: string; nickName: string | null }) {
    return (u.nickName || u.userName)?.[0]?.toUpperCase() ?? '?';
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
      if (visible) void syncFromProps();
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
        await fetchProjectUpdate(props.initialProject.id, payload);
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
  .proj-member-field {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
    width: 100%;
  }

  .proj-member-field--block {
    flex-direction: column;
    align-items: stretch;
  }

  .proj-member-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    flex: 1;
    min-width: 0;
    min-height: 32px;
  }

  .proj-member-placeholder {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
    line-height: 32px;
  }

  .proj-user-tag :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
  }

  .proj-user-tag__inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .proj-member-picker__scroll {
    max-height: min(56vh, 480px);
    overflow-y: auto;
    padding: 2px 6px 8px 2px;
    margin-right: -4px;
  }

  .proj-member-picker__radio-group {
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
      box-shadow 0.2s ease;

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
</style>
