<template>
  <el-drawer
    v-model="visible"
    size="780px"
    direction="rtl"
    destroy-on-close
    :before-close="handleClose"
  >
    <template #header>
      <div class="drawer-header">
        <div class="task-title">{{ task?.title }}</div>
        <el-tag :type="statusTagType(task?.status)" size="small">{{
          statusLabel(task?.status)
        }}</el-tag>
      </div>
    </template>

    <div v-if="loadingDetail" class="loading-wrap"><el-skeleton :rows="8" animated /></div>
    <div v-else-if="task" class="drawer-body">
      <el-descriptions :column="2" border size="small" class="section">
        <el-descriptions-item label="所属项目">{{ task.project?.name }}</el-descriptions-item>
        <el-descriptions-item label="预估工时">{{
          task.estimatedHours != null ? task.estimatedHours + 'h' : '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="实际工时">{{
          task.actualHours != null ? task.actualHours + 'h' : '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="测试验收人">
          <div v-if="task.tester" class="user-inline">
            <el-avatar :size="20" :src="task.tester.avatar ?? undefined">{{
              initials(task.tester)
            }}</el-avatar>
            {{ task.tester.nickName || task.tester.userName }}
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="主要负责人" :span="1">
          <div v-if="task.mainAssignee" class="user-inline">
            <el-avatar :size="20" :src="task.mainAssignee.avatar ?? undefined">{{
              initials(task.mainAssignee)
            }}</el-avatar>
            {{ task.mainAssignee.nickName || task.mainAssignee.userName }}
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="协助负责人">
          <div class="avatar-group" v-if="task.coAssignees?.length">
            <el-tooltip
              v-for="ca in task.coAssignees"
              :key="ca.id"
              :content="ca.user.nickName || ca.user.userName"
              placement="top"
            >
              <el-avatar :size="22" :src="ca.user.avatar ?? undefined" class="stacked-avatar">{{
                initials(ca.user)
              }}</el-avatar>
            </el-tooltip>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="任务描述" :span="2">{{
          task.description || '-'
        }}</el-descriptions-item>
      </el-descriptions>

      <div class="section">
        <div class="section-title">
          <art-svg-icon icon="mdi:clipboard-check-outline" />
          <span>测试用例</span>
        </div>
        <el-empty v-if="!task.testCases?.length" description="暂无测试用例" :image-size="50" />
        <div v-else class="test-case-grid">
          <div v-for="tc in task.testCases" :key="tc.id" class="tc-card">
            <div class="tc-desc">{{ tc.description }}</div>
            <div class="tc-expected">预期：{{ tc.expectedResult }}</div>
            <div class="tc-status-row">
              <div class="tc-badge">
                <span class="label">自测</span>
                <el-tag :type="testTagType(tc.selfTestStatus)" size="small">{{
                  testLabel(tc.selfTestStatus)
                }}</el-tag>
              </div>
              <div class="tc-badge">
                <span class="label">QA</span>
                <el-tag :type="testTagType(tc.qaStatus)" size="small">{{
                  testLabel(tc.qaStatus)
                }}</el-tag>
              </div>
              <el-tag v-if="tc.bugCount > 0" type="danger" size="small"
                >Bug x{{ tc.bugCount }}</el-tag
              >
            </div>
            <div
              v-if="(isMainAssignee || isCoAssignee) && task?.status !== 'COMPLETED'"
              class="tc-self-test"
            >
              <el-select
                v-model="selfTestMap[tc.id]"
                size="small"
                style="width: 110px"
                placeholder="自测结果"
              >
                <el-option label="通过" value="PASSED" />
                <el-option label="失败" value="FAILED" />
              </el-select>
              <el-input
                v-model="selfTestRemarkMap[tc.id]"
                size="small"
                placeholder="备注"
                style="flex: 1"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <art-svg-icon icon="mdi:clock-outline" />
          <span>工时记录</span>
        </div>
        <el-empty v-if="!task.workLogs?.length" description="暂无工时记录" :image-size="50" />
        <div v-else class="worklog-list">
          <div v-for="log in task.workLogs" :key="log.id" class="worklog-item">
            <el-avatar :size="28" :src="log.user.avatar ?? undefined" class="log-avatar">{{
              initials(log.user)
            }}</el-avatar>
            <div class="log-content">
              <div class="log-meta">
                <span class="log-user">{{ log.user.nickName || log.user.userName }}</span>
                <el-tag size="small" type="success">{{ log.hours }}h</el-tag>
                <span class="log-time">{{ formatDate(log.createdAt) }}</span>
              </div>
              <div class="log-text">{{ log.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button
          v-if="(isMainAssignee || isCoAssignee) && task?.status === 'PENDING'"
          type="primary"
          @click="handleStartWork"
          :loading="actionLoading"
        >
          <art-svg-icon icon="mdi:play-circle-outline" style="margin-right: 4px" /> 开始开发
        </el-button>

        <el-button v-if="isMainAssignee || isCoAssignee" @click="workLogDialogVisible = true">
          <art-svg-icon icon="mdi:clock-plus-outline" style="margin-right: 4px" /> 登记工时
        </el-button>

        <el-button
          v-if="
            isMainAssignee &&
            ['PENDING', 'IN_PROGRESS', 'SELF_TESTING', 'REJECTED'].includes(task?.status ?? '')
          "
          type="warning"
          @click="handleSubmitTest"
          :loading="actionLoading"
        >
          <art-svg-icon icon="mdi:send-check-outline" style="margin-right: 4px" /> 提交验收
        </el-button>

        <template v-if="isQA && task?.status === 'QA_REVIEW'">
          <el-button type="danger" @click="handleQaAudit('reject')" :loading="actionLoading">
            <art-svg-icon icon="mdi:close-circle-outline" style="margin-right: 4px" /> 打回修改
          </el-button>
          <el-button type="success" @click="openQaPassDialog" :loading="actionLoading">
            <art-svg-icon icon="mdi:check-circle-outline" style="margin-right: 4px" /> 验收通过
          </el-button>
        </template>
      </div>
    </template>
  </el-drawer>

  <el-dialog v-model="workLogDialogVisible" title="登记工时" width="440px" destroy-on-close>
    <el-form ref="workLogFormRef" :model="workLogForm" :rules="workLogRules" label-width="90px">
      <el-form-item label="工时(h)" prop="hours">
        <el-input-number
          v-model="workLogForm.hours"
          :min="0.5"
          :step="0.5"
          :precision="1"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="工作内容" prop="content">
        <el-input
          v-model="workLogForm.content"
          type="textarea"
          :rows="4"
          placeholder="请描述本次工作内容"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="workLogDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="actionLoading" @click="handleAddWorkLog">提交</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="qaPassDialogVisible" title="确认实际工时" width="380px" destroy-on-close>
    <el-form label-width="100px">
      <el-form-item label="实际工时(h)">
        <el-input-number
          v-model="actualHoursInput"
          :min="0.5"
          :step="0.5"
          :precision="1"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="qaPassDialogVisible = false">取消</el-button>
      <el-button type="success" :loading="actionLoading" @click="handleQaAudit('pass')"
        >确认通过</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watch } from 'vue';
  import { ElMessage } from 'element-plus';
  import type { FormInstance, FormRules } from 'element-plus';
  import {
    fetchTaskInfo,
    fetchAddWorkLog,
    fetchSubmitTest,
    fetchQaAudit,
    fetchStartWork
  } from '@/api/task';
  import { useUserStore } from '@/store/modules/user';

  const props = defineProps<{ taskId: number }>();
  const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'refresh'): void }>();
  const visible = defineModel<boolean>({ default: false });

  const userStore = useUserStore();
  const currentUserId = computed(() => userStore.info?.userId);

  const task = ref<Api.Task.Task | null>(null);
  const loadingDetail = ref(false);
  const actionLoading = ref(false);
  const workLogDialogVisible = ref(false);
  const qaPassDialogVisible = ref(false);
  const actualHoursInput = ref<number>(1);
  const workLogFormRef = ref<FormInstance>();

  // 自测状态 map: tcId -> status
  const selfTestMap = reactive<Record<number, Api.Task.TestStatus>>({});
  const selfTestRemarkMap = reactive<Record<number, string>>({});

  const workLogForm = reactive({ hours: 1, content: '' });
  const workLogRules: FormRules = {
    hours: [{ required: true, message: '请填写工时', trigger: 'blur' }],
    content: [{ required: true, message: '请填写工作内容', trigger: 'blur' }]
  };

  // ==================== 身份计算 ====================
  const isMainAssignee = computed(
    () => !!currentUserId.value && task.value?.mainAssigneeId === currentUserId.value
  );
  const isCoAssignee = computed(
    () =>
      !!currentUserId.value &&
      (task.value?.coAssignees ?? []).some((ca) => ca.userId === currentUserId.value)
  );
  const isQA = computed(
    () => !!currentUserId.value && task.value?.testerId === currentUserId.value
  );

  // ==================== 枚举工具 ====================
  const STATUS_OPTIONS: { label: string; value: string }[] = [
    { label: '待分配', value: 'PENDING' },
    { label: '开发中', value: 'IN_PROGRESS' },
    { label: '待提测', value: 'SELF_TESTING' },
    { label: '验收中', value: 'QA_REVIEW' },
    { label: '打回修改', value: 'REJECTED' },
    { label: '已完成', value: 'COMPLETED' }
  ];
  const STATUS_TAG: Record<string, string> = {
    PENDING: 'info',
    IN_PROGRESS: '',
    SELF_TESTING: 'warning',
    QA_REVIEW: 'warning',
    REJECTED: 'danger',
    COMPLETED: 'success'
  };
  function statusLabel(s?: string) {
    return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s ?? '';
  }
  function statusTagType(s?: string) {
    return STATUS_TAG[s ?? ''] ?? 'info';
  }
  function testLabel(s: Api.Task.TestStatus) {
    return { UNTESTED: '未测试', PASSED: '通过', FAILED: '失败' }[s] ?? s;
  }
  function testTagType(s: Api.Task.TestStatus) {
    return { UNTESTED: 'info', PASSED: 'success', FAILED: 'danger' }[s] ?? 'info';
  }
  function initials(u: Api.Task.SimpleUser) {
    return (u.nickName || u.userName)?.[0]?.toUpperCase() ?? '?';
  }
  function formatDate(d: string) {
    return d ? new Date(d).toLocaleString('zh-CN', { hour12: false }).slice(0, 16) : '';
  }

  // ==================== 数据加载 ====================
  async function loadDetail() {
    loadingDetail.value = true;
    try {
      const res = await fetchTaskInfo(props.taskId);
      console.log('res :>> ', res);
      task.value = res;
      // 初始化 selfTestMap
      (task.value?.testCases ?? []).forEach((tc) => {
        selfTestMap[tc.id] = tc.selfTestStatus;
        selfTestRemarkMap[tc.id] = tc.selfTestRemark ?? '';
      });
    } finally {
      loadingDetail.value = false;
    }
  }

  watch(
    () => visible.value,
    (v) => {
      if (v) loadDetail();
    },
    { immediate: true }
  );

  function handleClose() {
    visible.value = false;
  }

  // ==================== 开始开发 ====================
  async function handleStartWork() {
    actionLoading.value = true;
    try {
      await fetchStartWork(props.taskId);
      ElMessage.success('已开始开发');
      emit('refresh');
      loadDetail();
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message ?? '操作失败');
    } finally {
      actionLoading.value = false;
    }
  }

  // ==================== 登记工时 ====================
  async function handleAddWorkLog() {
    await workLogFormRef.value?.validate();
    actionLoading.value = true;
    try {
      await fetchAddWorkLog(props.taskId, {
        hours: workLogForm.hours,
        content: workLogForm.content
      });
      ElMessage.success('工时登记成功');
      workLogDialogVisible.value = false;
      workLogForm.hours = 1;
      workLogForm.content = '';
      loadDetail();
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message ?? '操作失败');
    } finally {
      actionLoading.value = false;
    }
  }

  // ==================== 提交验收 ====================
  async function handleSubmitTest() {
    if (!task.value?.testCases?.length) {
      ElMessage.warning('请先添加测试用例');
      return;
    }
    const testCaseResults = task.value.testCases.map((tc) => ({
      id: tc.id,
      selfTestStatus: selfTestMap[tc.id] ?? 'UNTESTED',
      selfTestRemark: selfTestRemarkMap[tc.id] ?? ''
    }));
    actionLoading.value = true;
    try {
      await fetchSubmitTest(props.taskId, { testCaseResults });
      ElMessage.success('已提交验收');
      emit('refresh');
      loadDetail();
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message ?? '提交失败');
    } finally {
      actionLoading.value = false;
    }
  }

  // ==================== QA 验收 ====================
  function openQaPassDialog() {
    actualHoursInput.value = task.value?.estimatedHours ?? 1;
    qaPassDialogVisible.value = true;
  }

  async function handleQaAudit(action: 'pass' | 'reject') {
    if (!task.value?.testCases?.length) {
      ElMessage.warning('暂无用例可验收');
      return;
    }
    const testCaseResults = task.value.testCases.map((tc) => ({
      id: tc.id,
      qaStatus: action === 'reject' ? ('FAILED' as const) : ('PASSED' as const),
      qaRemark: ''
    }));
    const payload: Api.Task.QaAuditParams = { testCaseResults };
    if (action === 'pass') {
      payload.actualHours = actualHoursInput.value;
      qaPassDialogVisible.value = false;
    }
    actionLoading.value = true;
    try {
      await fetchQaAudit(props.taskId, payload);
      ElMessage.success(action === 'pass' ? '验收通过' : '已打回');
      emit('refresh');
      loadDetail();
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message ?? '操作失败');
    } finally {
      actionLoading.value = false;
    }
  }
</script>

<style scoped lang="scss">
  .drawer-header {
    display: flex;
    align-items: center;
    gap: 12px;
    .task-title {
      font-size: 16px;
      font-weight: 600;
    }
  }
  .loading-wrap {
    padding: 24px;
  }
  .drawer-body {
    padding: 0 4px 100px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .section {
    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }
  }
  .user-inline {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .avatar-group {
    display: flex;
    align-items: center;
  }
  .stacked-avatar {
    margin-left: -6px;
    border: 2px solid #fff;
  }
  .test-case-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tc-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 12px;
    .tc-desc {
      font-weight: 500;
      margin-bottom: 4px;
    }
    .tc-expected {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }
    .tc-status-row {
      display: flex;
      align-items: center;
      gap: 10px;
      .tc-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        .label {
          font-size: 12px;
          color: #999;
        }
      }
    }
    .tc-self-test {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed var(--el-border-color-lighter);
    }
  }
  .worklog-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .worklog-item {
    display: flex;
    gap: 10px;
    .log-avatar {
      flex-shrink: 0;
      margin-top: 2px;
    }
    .log-content {
      flex: 1;
      .log-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        .log-user {
          font-weight: 500;
          font-size: 13px;
        }
        .log-time {
          font-size: 12px;
          color: #999;
        }
      }
      .log-text {
        font-size: 13px;
        color: #555;
      }
    }
  }
  .drawer-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
</style>
