<template>
  <ArtDialog
    v-model="visible"
    :title="dialogTitle"
    icon="solar:checklist-bold-duotone"
    width="70%"
    :max-height="'calc(90vh - 140px)'"
  >
    <div v-if="loadingDetail" class="loading-wrap"><el-skeleton :rows="8" animated /></div>
    <div v-else-if="task" class="task-detail-body">
      <div class="task-detail-layout">
        <div class="task-detail-layout__left">
          <div class="section section--basic task-pane task-pane--top">
            <div class="section-title">
              <art-svg-icon icon="mdi:information-outline" />
              <span>任务基本信息</span>
            </div>
            <div class="task-basic-grid">
              <div class="task-basic-item">
                <span class="task-basic-item__label">任务状态</span>
                <span class="task-basic-item__value">
                  <el-tag :type="statusTagType(task.status)" size="small">
                    {{ statusLabel(task.status) }}
                  </el-tag>
                </span>
              </div>
              <div class="task-basic-item">
                <span class="task-basic-item__label">任务领域</span>
                <span class="task-basic-item__value">{{ workDomainLabel(task.workDomain) }}</span>
              </div>
              <div class="task-basic-item">
                <span class="task-basic-item__label">事项类型</span>
                <span class="task-basic-item__value">{{ typeLabel(task.type) }}</span>
              </div>
              <div class="task-basic-item">
                <span class="task-basic-item__label">所属项目</span>
                <span class="task-basic-item__value">{{ task.project?.name || '—' }}</span>
              </div>
              <div class="task-basic-item">
                <span class="task-basic-item__label">预估工时</span>
                <span class="task-basic-item__value">{{
                  task.estimatedHours != null ? task.estimatedHours + 'h' : '—'
                }}</span>
              </div>
              <div class="task-basic-item">
                <span class="task-basic-item__label">实际工时</span>
                <span class="task-basic-item__value">{{
                  displayActualHours != null ? displayActualHours + 'h' : '—'
                }}</span>
              </div>
            </div>

            <div class="task-basic-members">
              <div class="task-basic-members__label">负责人</div>
              <div v-if="mergedMemberTags.length" class="task-mgr-assignees">
                <div
                  v-for="member in mergedMemberTags"
                  :key="member.key"
                  class="task-mgr-assignee"
                  :class="member.className"
                >
                  <el-avatar :size="22" :src="member.user.avatar ?? undefined">{{
                    initials(member.user)
                  }}</el-avatar>
                  <span class="task-mgr-assignee__name">{{ userDisplayName(member.user) }}</span>
                  <span class="task-mgr-assignee__role">{{ member.roleLabel }}</span>
                </div>
              </div>
              <span v-else class="task-basic-members__empty">未分配</span>
            </div>

            <div class="task-basic-desc">
              <div class="task-basic-desc__label">任务描述</div>
              <div class="task-basic-desc__value">{{ displayText(task.description) }}</div>
            </div>
            <div v-if="task.qaRejectReason" class="task-basic-reject">
              <div class="task-basic-reject__label">
                <art-svg-icon icon="mdi:alert-circle-outline" />
                最近打回原因
              </div>
              <div class="task-basic-reject__value">{{ task.qaRejectReason }}</div>
            </div>
            <div v-if="task.attachments?.length" class="section">
              <div class="section-title">
                <art-svg-icon icon="mdi:paperclip" />
                <span>任务附件</span>
              </div>
              <div class="attach-row">
                <div
                  v-for="row in task.attachments"
                  :key="row.id"
                  class="attach-line"
                  :class="
                    getFileCategoryClass(row.attachment.originalName, row.attachment.mimeType)
                  "
                  :style="attachTintStyle(row.attachment)"
                >
                  <div class="attach-line__icon" aria-hidden="true">
                    <ArtSvgIcon
                      :icon="getFileIcon(row.attachment.originalName, row.attachment.mimeType)"
                    />
                  </div>
                  <div class="attach-line__main">
                    <span class="fname" :title="row.attachment.originalName">{{
                      row.attachment.originalName
                    }}</span>
                    <div class="attach-line__meta">
                      <span
                        v-if="getFileExtLabel(row.attachment.originalName)"
                        class="attach-line__ext"
                        >{{ getFileExtLabel(row.attachment.originalName) }}</span
                      >
                      <span class="fsize">{{ formatFileSize(row.attachment.size) }}</span>
                    </div>
                  </div>
                  <div class="attach-line__actions">
                    <el-button
                      link
                      type="primary"
                      size="small"
                      @click="openServerPreview(row.attachment)"
                    >
                      预览
                    </el-button>
                    <el-button
                      link
                      type="primary"
                      size="small"
                      @click="downloadAtt(row.attachment)"
                    >
                      下载
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="taskSupportsTestCases" class="section section--test-cases">
              <div class="section-title section-title--with-meta">
                <span class="section-title__left">
                  <art-svg-icon icon="mdi:clipboard-check-outline" />
                  <span>测试用例</span>
                </span>
                <span v-if="sortedTestCases.length" class="section-title__count"
                  >共 {{ sortedTestCases.length }} 条</span
                >
              </div>
              <el-empty
                v-if="!sortedTestCases.length"
                description="暂无测试用例"
                :image-size="56"
              />
              <div v-else class="test-case-list">
                <div v-for="(tc, idx) in sortedTestCases" :key="tc.id" class="tc-card">
                  <div class="tc-card__toolbar">
                    <span class="tc-card__index">#{{ idx + 1 }}</span>
                    <div class="tc-card__status-chips">
                      <div class="tc-chip">
                        <span class="tc-chip__label">自测</span>
                        <el-tag
                          :type="testTagType(tc.selfTestStatus)"
                          size="small"
                          effect="light"
                          >{{ testLabel(tc.selfTestStatus) }}</el-tag
                        >
                      </div>
                      <div class="tc-chip">
                        <span class="tc-chip__label">QA</span>
                        <el-tag :type="testTagType(tc.qaStatus)" size="small" effect="light">{{
                          testLabel(tc.qaStatus)
                        }}</el-tag>
                      </div>
                      <el-tag
                        v-if="Number(tc.bugCount) > 0"
                        type="danger"
                        size="small"
                        effect="plain"
                        class="tc-bug-tag"
                      >
                        Bug ×{{ tc.bugCount }}
                      </el-tag>
                    </div>
                  </div>

                  <div class="tc-card__body">
                    <div class="tc-field">
                      <div class="tc-field__label">
                        <art-svg-icon icon="mdi:text-box-outline" class="tc-field__icon" />
                        描述 / 操作步骤
                      </div>
                      <div class="tc-field__value">{{ displayText(tc.description) }}</div>
                    </div>
                    <div class="tc-field tc-field--expected">
                      <div class="tc-field__label">
                        <art-svg-icon icon="mdi:check-circle-outline" class="tc-field__icon" />
                        预期结果
                      </div>
                      <div class="tc-field__value">{{ displayText(tc.expectedResult) }}</div>
                    </div>
                    <div v-if="trimText(tc.selfTestRemark)" class="tc-remark tc-remark--self">
                      <span class="tc-remark__label">自测备注</span>
                      <span class="tc-remark__text">{{ tc.selfTestRemark }}</span>
                    </div>
                    <div v-if="trimText(tc.qaRemark)" class="tc-remark tc-remark--qa">
                      <span class="tc-remark__label">QA 备注</span>
                      <span class="tc-remark__text">{{ tc.qaRemark }}</span>
                    </div>
                  </div>

                  <div
                    v-if="(isMainAssignee || isCoAssignee) && task?.status !== 'COMPLETED'"
                    class="tc-card__actions"
                  >
                    <el-select
                      v-model="selfTestMap[tc.id]"
                      size="small"
                      class="tc-card__select"
                      placeholder="自测结果"
                    >
                      <el-option label="通过" value="PASSED" />
                      <el-option label="失败" value="FAILED" />
                    </el-select>
                    <el-input
                      v-model="selfTestRemarkMap[tc.id]"
                      size="small"
                      placeholder="自测备注（可选）"
                      class="tc-card__remark-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="task-pane task-pane--bottom">
            <div class="section section--worklog">
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
                    <div v-if="log.attachments?.length" class="log-attach">
                      <span class="log-attach-label">附件</span>
                      <div
                        v-for="ar in log.attachments"
                        :key="ar.id"
                        class="log-attach-chip"
                        :class="
                          getFileCategoryClass(ar.attachment.originalName, ar.attachment.mimeType)
                        "
                        :style="attachTintStyle(ar.attachment)"
                      >
                        <span class="log-attach-chip__icon" aria-hidden="true">
                          <ArtSvgIcon
                            :icon="getFileIcon(ar.attachment.originalName, ar.attachment.mimeType)"
                          />
                        </span>
                        <span class="log-attach-chip__name" :title="ar.attachment.originalName">{{
                          ar.attachment.originalName
                        }}</span>
                        <el-button
                          link
                          type="primary"
                          size="small"
                          @click="openServerPreview(ar.attachment)"
                        >
                          预览
                        </el-button>
                        <el-button
                          link
                          type="primary"
                          size="small"
                          @click="downloadAtt(ar.attachment)"
                        >
                          下载
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="section section--comment">
              <div class="section-title">
                <art-svg-icon icon="mdi:comment-text-multiple-outline" />
                <span>评论记录</span>
              </div>
              <div class="comment-editor">
                <el-input
                  v-model="commentForm.content"
                  type="textarea"
                  :rows="3"
                  maxlength="2000"
                  show-word-limit
                  placeholder="输入评论内容（支持附件）"
                />
                <TaskAttachmentField
                  ref="commentAttachRef"
                  hint="评论可选附件，先上传后随评论提交"
                />
                <div class="comment-editor__actions">
                  <el-button type="primary" :loading="actionLoading" @click="handleAddComment">
                    发表评论
                  </el-button>
                </div>
              </div>

              <el-empty
                v-if="!task.comments?.length"
                description="暂无评论记录"
                :image-size="46"
                class="comment-empty"
              />
              <div v-else class="comment-list">
                <div v-for="c in task.comments" :key="c.id" class="comment-item">
                  <el-avatar :size="30" :src="c.user.avatar ?? undefined">{{
                    initials(c.user)
                  }}</el-avatar>
                  <div class="comment-item__main">
                    <div class="comment-item__meta">
                      <span class="comment-item__author">{{ userDisplayName(c.user) }}</span>
                      <span class="comment-item__time">{{ formatDate(c.createdAt) }}</span>
                    </div>
                    <div class="comment-item__text">{{ c.content }}</div>
                    <div v-if="c.attachments?.length" class="comment-item__attachments">
                      <div v-for="a in c.attachments" :key="a.id" class="comment-attach-chip">
                        <span class="comment-attach-chip__name">{{
                          a.attachment.originalName
                        }}</span>
                        <el-button
                          link
                          type="primary"
                          size="small"
                          @click="openServerPreview(a.attachment)"
                        >
                          预览
                        </el-button>
                        <el-button
                          link
                          type="primary"
                          size="small"
                          @click="downloadAtt(a.attachment)"
                        >
                          下载
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="task-detail-layout__right task-pane">
          <div class="section section--timeline">
            <div class="section-title">
              <art-svg-icon icon="mdi:timeline-clock-outline" />
              <span>任务时间线</span>
            </div>
            <el-empty
              v-if="!task.timelines?.length"
              description="暂无时间线记录"
              :image-size="54"
            />
            <div v-else class="timeline-list">
              <div
                v-for="line in task.timelines"
                :key="line.id"
                class="timeline-item"
                :class="timelineClass(line.eventType)"
              >
                <div class="timeline-item__dot" />
                <div class="timeline-item__content">
                  <div class="timeline-item__head">
                    <span class="timeline-item__title">{{ line.title }}</span>
                    <span class="timeline-item__time">{{ formatDate(line.createdAt) }}</span>
                  </div>
                  <div class="timeline-item__desc">
                    {{
                      line.content ||
                      `${statusLabel(line.fromStatus || '')} → ${statusLabel(line.toStatus || '')}`
                    }}
                  </div>
                  <div v-if="line.operator" class="timeline-item__operator">
                    操作人：{{ userDisplayName(line.operator) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="task-detail-footer">
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
          v-if="isMainAssignee && ['IN_PROGRESS'].includes(task?.status ?? '')"
          type="warning"
          @click="handleSubmitTest"
          :loading="actionLoading"
        >
          <art-svg-icon icon="mdi:send-check-outline" style="margin-right: 4px" /> 提交验收
        </el-button>

        <template v-if="isQA && task?.status === 'QA_REVIEW'">
          <el-button type="danger" @click="openQaRejectDialog" :loading="actionLoading">
            <art-svg-icon icon="mdi:close-circle-outline" style="margin-right: 4px" /> 打回修改
          </el-button>
          <el-button type="success" @click="openQaPassDialog" :loading="actionLoading">
            <art-svg-icon icon="mdi:check-circle-outline" style="margin-right: 4px" /> 验收通过
          </el-button>
        </template>

        <el-button
          v-if="(isMainAssignee || isCoAssignee || isTaskManager) && task?.status === 'IN_PROGRESS'"
          type="info"
          @click="handlePause"
          :loading="actionLoading"
        >
          <art-svg-icon icon="mdi:pause-circle-outline" style="margin-right: 4px" /> 暂停
        </el-button>

        <el-button
          v-if="(isMainAssignee || isCoAssignee) && task?.status === 'PAUSED'"
          type="primary"
          @click="handleResume"
          :loading="actionLoading"
        >
          <art-svg-icon icon="mdi:play-circle-outline" style="margin-right: 4px" /> 恢复开发
        </el-button>
      </div>
    </template>
  </ArtDialog>

  <ArtDialog
    v-model="workLogDialogVisible"
    title="登记工时"
    icon="mdi:clock-plus-outline"
    width="560px"
  >
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
      <el-form-item label="附件">
        <TaskAttachmentField
          ref="workLogAttachRef"
          hint="可选，多文件依次上传；与本次工时一并提交"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="workLogDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="actionLoading" @click="handleAddWorkLog">提交</el-button>
    </template>
  </ArtDialog>

  <ArtDialog
    v-model="qaPassDialogVisible"
    title="确认验收通过"
    icon="mdi:check-circle-outline"
    width="420px"
  >
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
  </ArtDialog>

  <ArtDialog
    v-model="qaRejectDialogVisible"
    title="填写打回原因"
    icon="mdi:close-circle-outline"
    width="520px"
  >
    <el-form label-width="88px">
      <el-form-item label="打回原因" required>
        <el-input
          v-model="qaRejectReason"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请填写本次打回修改原因"
        />
      </el-form-item>

      <el-form-item v-if="!allowQaRejectWithoutHours" label="实际工时(h)" required>
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
      <el-button @click="qaRejectDialogVisible = false">取消</el-button>
      <el-button type="danger" :loading="actionLoading" @click="confirmQaReject"
        >确认打回</el-button
      >
    </template>
  </ArtDialog>

  <AttachmentPreviewDialog
    v-model="previewOpen"
    :attachment-id="previewDoc?.id"
    :file-name="previewDoc?.originalName ?? ''"
    :mime-type="previewDoc?.mimeType ?? null"
  />
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watch, nextTick } from 'vue';
  import { ElMessage } from 'element-plus';
  import type { FormInstance, FormRules } from 'element-plus';
  import {
    fetchTaskInfo,
    fetchStartWork,
    fetchAddWorkLog,
    fetchAddTaskComment,
    fetchSubmitTest,
    fetchQaAudit,
    fetchPauseTask,
    fetchResumeTask
  } from '@/api/task';
  import { downloadAttachmentBlob } from '@/api/attachment';
  import {
    getFileIcon,
    getFileCategoryClass,
    getFileTintRgb,
    getFileExtLabel
  } from '@/utils/fileTypeIcon';
  import { useUserStore } from '@/store/modules/user';
  import TaskAttachmentField from '../components/TaskAttachmentField.vue';
  import AttachmentPreviewDialog from '../components/AttachmentPreviewDialog.vue';

  const props = defineProps<{ taskId: number }>();
  const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'refresh'): void }>();
  const visible = defineModel<boolean>({ default: false });

  const userStore = useUserStore();
  const currentUserId = computed(() => userStore.info?.userId);

  const task = ref<Api.Task.Task | null>(null);
  const loadingDetail = ref(false);

  const dialogTitle = computed(() => {
    if (loadingDetail.value) return '任务详情';
    return task.value?.title?.trim() || '任务详情';
  });
  const actionLoading = ref(false);
  const workLogDialogVisible = ref(false);
  const qaPassDialogVisible = ref(false);
  const qaRejectDialogVisible = ref(false);
  const qaRejectReason = ref('');
  const actualHoursInput = ref<number>(1);
  const workLogFormRef = ref<FormInstance>();
  const workLogAttachRef = ref<InstanceType<typeof TaskAttachmentField> | null>(null);
  const commentAttachRef = ref<InstanceType<typeof TaskAttachmentField> | null>(null);

  const previewOpen = ref(false);
  const previewDoc = ref<Api.Task.TaskAttachmentMeta | null>(null);

  // 自测状态 map: tcId -> status
  const selfTestMap = reactive<Record<number, Api.Task.TestStatus>>({});
  const selfTestRemarkMap = reactive<Record<number, string>>({});

  const workLogForm = reactive({ hours: 1, content: '' });
  const commentForm = reactive({ content: '' });
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

  // 项目规则（主线B）：决定 QA 是否允许协助人发起、打回是否需要工时
  const allowCoAssigneeSubmitQa = computed(
    () => task.value?.project?.taskRule?.allowCoAssigneeSubmitQa ?? false
  );
  const allowQaRejectWithoutHours = computed(
    () => task.value?.project?.taskRule?.allowQaRejectWithoutHours ?? true
  );

  const isQA = computed(
    () =>
      !!currentUserId.value &&
      (task.value?.testerId === currentUserId.value ||
        (allowCoAssigneeSubmitQa.value && isCoAssignee.value))
  );
  /** 任务“管理者”上升到项目层面：项目负责人可管理项目下任务 */
  const isTaskManager = computed(
    () => !!currentUserId.value && task.value?.project?.managerId === currentUserId.value
  );

  const taskSupportsTestCases = computed(
    () => (task.value?.workDomain ?? 'GENERAL') === 'SOFTWARE_DEVELOPMENT'
  );
  type RoleMemberTag = {
    key: string;
    user: Api.Task.SimpleUser;
    roleLabel: string;
    className: string;
  };
  const mergedMemberTags = computed<RoleMemberTag[]>(() => {
    const cur = task.value;
    if (!cur) return [];
    const out: RoleMemberTag[] = [];
    if (cur.mainAssignee) {
      out.push({
        key: `main-${cur.mainAssignee.id}`,
        user: cur.mainAssignee,
        roleLabel: '主要',
        className: 'task-mgr-assignee--main'
      });
    }
    for (const ca of cur.coAssignees ?? []) {
      out.push({
        key: `co-${ca.user.id}`,
        user: ca.user,
        roleLabel: '协助',
        className: 'task-mgr-assignee--co'
      });
    }
    if (cur.tester) {
      out.push({
        key: `qa-${cur.tester.id}`,
        user: cur.tester,
        roleLabel: '验收',
        className: 'task-mgr-assignee--qa'
      });
    }
    return out;
  });

  const WORK_DOMAIN_LABEL: Record<Api.Task.TaskWorkDomain, string> = {
    SOFTWARE_DEVELOPMENT: '软件开发',
    PRODUCT_DESIGN: '产品与设计',
    OPERATIONS_SUPPORT: '运维与实施',
    DATA_ANALYTICS: '数据分析',
    GENERAL: '综合与其他'
  };

  function workDomainLabel(w?: Api.Task.TaskWorkDomain) {
    if (!w) return '—';
    return WORK_DOMAIN_LABEL[w] ?? w;
  }

  function typeLabel(t?: Api.Task.TaskType) {
    const m: Record<Api.Task.TaskType, string> = {
      FEATURE: '需求',
      BUG: '缺陷',
      CHORE: '技术债/杂项',
      ENHANCEMENT: '优化'
    };
    if (!t) return '—';
    return m[t] ?? t;
  }

  /** 详情接口可能无序返回，按 id 排序，避免列表顺序抖动 */
  const sortedTestCases = computed(() => {
    const list = task.value?.testCases;
    if (!list?.length) return [];
    return [...list].sort((a, b) => a.id - b.id);
  });

  /** 工时登记表合计（小时） */
  const workLogsHoursSum = computed(() =>
    (task.value?.workLogs ?? []).reduce((sum, log) => sum + Number(log.hours ?? 0), 0)
  );

  /**
   * 展示用「实际工时」：
   * - 库里的 actualHours 仅在 QA 验收通过时写入；登记工时只写 WorkLog，不会更新该字段。
   * - 未完成或未验收前：显示工时记录合计；已 COMPLETED 且库里有 actualHours：以验收确认值为准。
   */
  const displayActualHours = computed(() => {
    const t = task.value;
    if (!t) return null;
    if (t.status === 'COMPLETED' && t.actualHours != null) return Number(t.actualHours);
    const sum = workLogsHoursSum.value;
    if (sum > 0) return sum;
    return t.actualHours != null ? Number(t.actualHours) : null;
  });

  // ==================== 枚举工具 ====================
  const STATUS_OPTIONS: { label: string; value: string }[] = [
    { label: '待分配', value: 'PENDING' },
    { label: '开发中', value: 'IN_PROGRESS' },
    { label: '待提测', value: 'SELF_TESTING' },
    { label: '验收中', value: 'QA_REVIEW' },
    { label: '打回修改', value: 'REJECTED' },
    { label: '已完成', value: 'COMPLETED' },
    { label: '已暂停', value: 'PAUSED' },
    { label: '已取消', value: 'CANCELLED' }
  ];
  type ElTagType = 'primary' | 'success' | 'warning' | 'info' | 'danger';
  const STATUS_TAG: Record<string, ElTagType> = {
    PENDING: 'info',
    IN_PROGRESS: 'primary',
    SELF_TESTING: 'warning',
    QA_REVIEW: 'warning',
    REJECTED: 'danger',
    COMPLETED: 'success',
    PAUSED: 'warning',
    CANCELLED: 'info'
  };
  function statusLabel(s?: string) {
    return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s ?? '';
  }
  function statusTagType(s?: string): ElTagType {
    return STATUS_TAG[s ?? ''] ?? 'info';
  }
  function testLabel(s: Api.Task.TestStatus) {
    return { UNTESTED: '未测试', PASSED: '通过', FAILED: '失败' }[s] ?? s;
  }
  function testTagType(s: Api.Task.TestStatus): 'success' | 'warning' | 'info' | 'danger' {
    const m: Record<Api.Task.TestStatus, 'success' | 'info' | 'danger'> = {
      UNTESTED: 'info',
      PASSED: 'success',
      FAILED: 'danger'
    };
    return m[s] ?? 'info';
  }

  function displayText(s: string | null | undefined) {
    const t = s?.trim();
    return t ? t : '—';
  }

  function trimText(s: string | null | undefined) {
    return (s ?? '').trim();
  }
  function initials(u: Api.Task.SimpleUser) {
    return (u.nickName || u.userName)?.[0]?.toUpperCase() ?? '?';
  }
  function userDisplayName(u: Api.Task.SimpleUser) {
    return u.nickName || u.userName;
  }
  function formatDate(d: string) {
    return d ? new Date(d).toLocaleString('zh-CN', { hour12: false }).slice(0, 16) : '';
  }
  function timelineClass(eventType: string) {
    if (eventType === 'QA_PASSED') return 'timeline-item--success';
    if (eventType === 'QA_REJECTED') return 'timeline-item--danger';
    if (eventType === 'WORKLOG_ADDED') return 'timeline-item--primary';
    if (eventType === 'COMMENT_ADDED') return 'timeline-item--info';
    if (eventType === 'STATUS_CHANGED') return 'timeline-item--warning';
    return 'timeline-item--default';
  }

  function formatFileSize(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  function openServerPreview(a: Api.Task.TaskAttachmentMeta) {
    previewDoc.value = a;
    previewOpen.value = true;
  }

  function attachTintStyle(a: Api.Task.TaskAttachmentMeta) {
    return { '--ft-tint': getFileTintRgb(a.originalName, a.mimeType) } as Record<string, string>;
  }

  async function downloadAtt(a: Api.Task.TaskAttachmentMeta) {
    try {
      const { blob, name } = await downloadAttachmentBlob(a.id);
      const url = URL.createObjectURL(blob);
      const el = document.createElement('a');
      el.href = url;
      el.download = name || a.originalName;
      el.click();
      URL.revokeObjectURL(url);
    } catch {
      ElMessage.error('下载失败');
    }
  }

  // ==================== 数据加载 ====================
  async function loadDetail() {
    loadingDetail.value = true;
    try {
      const res = await fetchTaskInfo(props.taskId);
      task.value = res;
      Object.keys(selfTestMap).forEach((k) => delete selfTestMap[Number(k)]);
      Object.keys(selfTestRemarkMap).forEach((k) => delete selfTestRemarkMap[Number(k)]);
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

  // 当任务抽屉已打开但 taskId 发生变化时，确保重新拉取详情
  watch(
    () => props.taskId,
    () => {
      if (visible.value) loadDetail();
    }
  );

  watch(workLogDialogVisible, (v) => {
    if (v) nextTick(() => workLogAttachRef.value?.reset());
  });

  async function handleAddComment() {
    if (!commentForm.content.trim()) {
      ElMessage.warning('请填写评论内容');
      return;
    }
    actionLoading.value = true;
    try {
      try {
        await commentAttachRef.value?.uploadAll();
      } catch {
        return;
      }
      const attachmentIds = commentAttachRef.value?.getAttachmentIds() ?? [];
      await fetchAddTaskComment(props.taskId, {
        content: commentForm.content.trim(),
        attachmentIds: attachmentIds.length ? attachmentIds : undefined
      });
      ElMessage.success('评论发布成功');
      commentForm.content = '';
      commentAttachRef.value?.reset();
      loadDetail();
    } finally {
      actionLoading.value = false;
    }
  }

  // ==================== 开始开发 ====================
  async function handleStartWork() {
    actionLoading.value = true;
    try {
      await fetchStartWork(props.taskId);
      ElMessage.success('已开始开发');
      emit('refresh');
      loadDetail();
    } catch {
      // 失败提示由 request 统一处理，这里避免重复弹窗
    } finally {
      actionLoading.value = false;
    }
  }

  // ==================== 登记工时 ====================
  async function handleAddWorkLog() {
    await workLogFormRef.value?.validate();
    actionLoading.value = true;
    try {
      try {
        await workLogAttachRef.value?.uploadAll();
      } catch {
        return;
      }
      const attachmentIds = workLogAttachRef.value?.getAttachmentIds() ?? [];
      await fetchAddWorkLog(props.taskId, {
        hours: workLogForm.hours,
        content: workLogForm.content,
        attachmentIds: attachmentIds.length ? attachmentIds : undefined
      });
      ElMessage.success('工时登记成功');
      workLogDialogVisible.value = false;
      workLogForm.hours = 1;
      workLogForm.content = '';
      workLogAttachRef.value?.reset();
      loadDetail();
    } catch {
      // 失败提示由 request 统一处理，这里避免重复弹窗
    } finally {
      actionLoading.value = false;
    }
  }

  // ==================== 提交验收 ====================
  async function handleSubmitTest() {
    if (taskSupportsTestCases.value && !task.value?.testCases?.length) {
      ElMessage.warning('请先添加测试用例');
      return;
    }
    const testCaseResults = taskSupportsTestCases.value
      ? (task.value?.testCases ?? []).map((tc) => ({
          id: tc.id,
          selfTestStatus: selfTestMap[tc.id] ?? 'UNTESTED',
          selfTestRemark: selfTestRemarkMap[tc.id] ?? ''
        }))
      : [];
    actionLoading.value = true;
    try {
      await fetchSubmitTest(props.taskId, { testCaseResults });
      ElMessage.success('已提交验收');
      emit('refresh');
      loadDetail();
    } catch {
      // 失败提示由 request 统一处理，这里避免重复弹窗
    } finally {
      actionLoading.value = false;
    }
  }

  // ==================== QA 验收 ====================
  function openQaPassDialog() {
    const sum = workLogsHoursSum.value;
    actualHoursInput.value = sum > 0 ? Number(sum.toFixed(1)) : (task.value?.estimatedHours ?? 1);
    qaPassDialogVisible.value = true;
  }
  function openQaRejectDialog() {
    qaRejectReason.value = '';
    const sum = workLogsHoursSum.value;
    actualHoursInput.value = sum > 0 ? Number(sum.toFixed(1)) : (task.value?.estimatedHours ?? 1);
    qaRejectDialogVisible.value = true;
  }
  async function confirmQaReject() {
    if (!qaRejectReason.value.trim()) {
      ElMessage.warning('请填写打回原因');
      return;
    }
    qaRejectDialogVisible.value = false;
    await handleQaAudit('reject', qaRejectReason.value.trim());
  }

  async function handleQaAudit(action: 'pass' | 'reject', rejectReason?: string) {
    if (taskSupportsTestCases.value && !task.value?.testCases?.length) {
      ElMessage.warning('暂无用例可验收');
      return;
    }
    const testCaseResults = taskSupportsTestCases.value
      ? (task.value?.testCases ?? []).map((tc) => ({
          id: tc.id,
          qaStatus: action === 'reject' ? ('FAILED' as const) : ('PASSED' as const),
          qaRemark: action === 'reject' ? (rejectReason ?? '') : ''
        }))
      : [];
    const payload: Api.Task.QaAuditParams = {
      testCaseResults,
      decision: action,
      qaRejectReason: action === 'reject' ? rejectReason : undefined
    };
    if (action === 'pass') {
      payload.actualHours = actualHoursInput.value;
      qaPassDialogVisible.value = false;
    }
    if (action === 'reject' && !allowQaRejectWithoutHours.value) {
      payload.actualHours = actualHoursInput.value;
    }
    actionLoading.value = true;
    try {
      await fetchQaAudit(props.taskId, payload);
      ElMessage.success(action === 'pass' ? '验收通过' : '已打回');
      emit('refresh');
      loadDetail();
    } catch {
      // 失败提示由 request 统一处理，这里避免重复弹窗
    } finally {
      actionLoading.value = false;
    }
  }

  // ==================== 暂停任务 ====================
  async function handlePause() {
    actionLoading.value = true;
    try {
      await fetchPauseTask(props.taskId);
      ElMessage.success('任务已暂停');
      emit('refresh');
      loadDetail();
    } catch {
      // 失败提示由 request 统一处理，这里避免重复弹窗
    } finally {
      actionLoading.value = false;
    }
  }

  // ==================== 恢复开发 ====================
  async function handleResume() {
    actionLoading.value = true;
    try {
      await fetchResumeTask(props.taskId);
      ElMessage.success('任务已恢复开发');
      emit('refresh');
      loadDetail();
    } catch {
      // 失败提示由 request 统一处理，这里避免重复弹窗
    } finally {
      actionLoading.value = false;
    }
  }
</script>

<style scoped lang="scss">
  .loading-wrap {
    padding: 24px;
  }
  .task-detail-body {
    padding: 0 4px 8px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 0;
  }
  .task-detail-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 14px;
    min-height: 0;
  }
  .task-detail-layout__left {
    display: grid;
    grid-template-rows: minmax(280px, auto) minmax(0, 1fr);
    gap: 14px;
    min-height: 0;
  }
  .task-detail-layout__right {
    min-height: 0;
  }
  .task-pane {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 14px;
    background: var(--el-bg-color);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }
  .task-pane--top,
  .task-pane--bottom,
  .task-detail-layout__right {
    overflow-y: auto;
    padding: 12px 14px;
  }
  .task-pane--top {
    background: linear-gradient(
      140deg,
      color-mix(in srgb, var(--el-color-primary) 4%, var(--el-bg-color)) 0%,
      var(--el-bg-color) 48%
    );
  }
  .task-pane--bottom {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: color-mix(in srgb, var(--el-fill-color-light) 45%, var(--el-bg-color));
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

    .section-title--with-meta {
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    .section-title__left {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .section-title__count {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
      padding: 2px 10px;
      border-radius: 999px;
      background: var(--el-fill-color-light);
    }
  }

  .section--basic {
    border: none;
    border-radius: 0;
    padding: 0;
    background: transparent;
    box-shadow: none;
  }

  .task-basic-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px 12px;
  }

  .task-basic-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 62px;
    padding: 12px 12px;
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 10px;
    background: color-mix(in srgb, var(--el-fill-color-blank) 90%, var(--el-bg-color));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  }

  .task-basic-item__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.2;
  }

  .task-basic-item__value {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.35;
    word-break: break-word;
  }

  .task-basic-members {
    margin-top: 14px;
    padding: 12px 13px;
    border-radius: 10px;
    border: 1px dashed var(--el-border-color);
    background: color-mix(in srgb, var(--el-fill-color-light) 70%, transparent);
  }

  .task-basic-members__label {
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.02em;
  }

  .task-basic-members__empty {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
    line-height: 1.4;
  }

  .task-basic-desc {
    margin-top: 14px;
    padding: 12px 13px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color-extra-light);
    background: var(--el-fill-color-blank);
  }

  .task-basic-desc__label {
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }

  .task-basic-desc__value {
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 24px;
  }

  .task-basic-reject {
    margin-top: 14px;
    padding: 12px 13px;
    border-radius: 10px;
    border: 1px solid var(--el-color-danger-light-7);
    background: var(--el-color-danger-light-9);
  }

  .task-basic-reject__label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-danger);
  }

  .task-basic-reject__value {
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .task-mgr-assignees {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 10px;
    align-items: center;
    line-height: 1.2;
  }

  .task-mgr-assignee {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 3px 8px 3px 3px;
    border-radius: 999px;
    border: 1px solid var(--el-border-color-extra-light);
    background: var(--el-fill-color-blank);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .task-mgr-assignee--main {
    border-color: var(--el-color-primary-light-7);
    background: var(--el-color-primary-light-9);
  }

  .task-mgr-assignee--co {
    border-color: var(--el-color-success-light-7);
    background: var(--el-color-success-light-9);
  }

  .task-mgr-assignee--qa {
    border-color: var(--el-color-warning-light-7);
    background: var(--el-color-warning-light-9);
  }

  .task-mgr-assignee__name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1;
  }

  .task-mgr-assignee__role {
    padding: 2px 6px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    border: 1px solid transparent;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
  }

  .task-mgr-assignee--main .task-mgr-assignee__role {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-8);
  }

  .task-mgr-assignee--co .task-mgr-assignee__role {
    color: var(--el-color-success);
    border-color: var(--el-color-success-light-5);
    background: var(--el-color-success-light-8);
  }

  .task-mgr-assignee--qa .task-mgr-assignee__role {
    color: var(--el-color-warning-dark-2);
    border-color: var(--el-color-warning-light-5);
    background: var(--el-color-warning-light-8);
  }

  .section--test-cases {
    margin-top: 4px;
  }
  .test-case-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .tc-card {
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(
      145deg,
      color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color)) 0%,
      var(--el-bg-color) 48%
    );
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }

  .tc-card__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 14px;
    background: color-mix(in srgb, var(--el-fill-color-light) 88%, transparent);
    border-bottom: 1px solid var(--el-border-color-extra-light);
  }

  .tc-card__index {
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--el-color-primary);
    letter-spacing: 0.02em;
  }

  .tc-card__status-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
  }

  .tc-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .tc-chip__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  .tc-bug-tag {
    font-variant-numeric: tabular-nums;
  }

  .tc-card__body {
    padding: 14px 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tc-field {
    border-radius: 10px;
    padding: 10px 12px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-extra-light);
  }

  .tc-field--expected {
    border-color: color-mix(in srgb, var(--el-color-success) 22%, var(--el-border-color-lighter));
    background: color-mix(in srgb, var(--el-color-success) 5%, var(--el-fill-color-blank));
  }

  .tc-field__label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
    letter-spacing: 0.02em;
  }

  .tc-field__icon {
    font-size: 15px;
    opacity: 0.9;
  }

  .tc-field__value {
    font-size: 13px;
    line-height: 1.65;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .tc-remark {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.5;
  }

  .tc-remark--self {
    background: color-mix(in srgb, var(--el-color-info) 8%, var(--el-fill-color-blank));
    border: 1px dashed color-mix(in srgb, var(--el-color-info) 28%, var(--el-border-color-lighter));
  }

  .tc-remark--qa {
    background: color-mix(in srgb, var(--el-color-warning) 8%, var(--el-fill-color-blank));
    border: 1px dashed
      color-mix(in srgb, var(--el-color-warning) 28%, var(--el-border-color-lighter));
  }

  .tc-remark__label {
    font-weight: 600;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .tc-remark__text {
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .tc-card__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-top: 1px dashed var(--el-border-color-lighter);
    background: color-mix(in srgb, var(--el-fill-color) 96%, transparent);
  }

  .tc-card__select {
    width: 120px;
    flex-shrink: 0;
  }

  .tc-card__remark-input {
    flex: 1;
    min-width: 160px;
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
      .log-attach {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 12px;

        .log-attach-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--el-text-color-secondary);
          text-transform: uppercase;
        }
      }

      .log-attach-chip {
        --ft-tint: 120, 144, 156;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 8px;
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(var(--ft-tint), 0.06);
        border: 1px solid rgba(var(--ft-tint), 0.16);

        &__icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          font-size: 18px;
          color: rgb(var(--ft-tint));
          background: rgba(var(--ft-tint), 0.12);
        }

        &__name {
          flex: 1;
          min-width: 0;
          font-size: 12px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--el-text-color-regular);
        }
      }
    }
  }
  .attach-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .attach-line {
    --ft-tint: 120, 144, 156;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 13px;
    background: linear-gradient(
      120deg,
      rgba(var(--ft-tint), 0.08) 0%,
      var(--el-fill-color-blank) 48%
    );
    border: 1px solid rgba(var(--ft-tint), 0.18);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:hover {
      border-color: rgba(var(--ft-tint), 0.35);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    }

    &__icon {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(var(--ft-tint), 0.12);
      border: 1px solid rgba(var(--ft-tint), 0.22);
      font-size: 26px;
      color: rgb(var(--ft-tint));
    }

    &__main {
      flex: 1;
      min-width: 0;
    }

    .fname {
      display: block;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--el-text-color-primary);
    }

    &__meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    &__ext {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 1px 6px;
      border-radius: 999px;
      color: rgb(var(--ft-tint));
      background: rgba(var(--ft-tint), 0.12);
      border: 1px solid rgba(var(--ft-tint), 0.2);
    }

    .fsize {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    &__actions {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
  .task-detail-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  .section--worklog,
  .section--comment {
    margin: 0;
    padding: 12px 12px 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-bg-color);
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.03);
  }
  .section--worklog .section-title,
  .section--comment .section-title {
    margin-bottom: 10px;
  }
  .comment-editor {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color-extra-light);
    background: var(--el-fill-color-blank);
  }
  .comment-editor__actions {
    display: flex;
    justify-content: flex-end;
  }
  .comment-list {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .comment-item {
    display: flex;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color-extra-light);
    background: var(--el-fill-color-blank);
  }
  .comment-item__main {
    flex: 1;
    min-width: 0;
  }
  .comment-item__meta {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 12px;
    margin-bottom: 6px;
  }
  .comment-item__author {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .comment-item__time {
    color: var(--el-text-color-secondary);
  }
  .comment-item__text {
    white-space: pre-wrap;
    line-height: 1.65;
    font-size: 13px;
  }
  .comment-item__attachments {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .comment-attach-chip {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 6px 8px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
  }
  .comment-attach-chip__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }
  .timeline-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .timeline-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .timeline-item__dot {
    margin-top: 7px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--el-color-primary);
    box-shadow: 0 0 0 4px var(--el-color-primary-light-8);
    flex-shrink: 0;
  }
  .timeline-item__content {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 10px;
    background: var(--el-fill-color-blank);
  }
  .timeline-item__head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }
  .timeline-item__title {
    font-weight: 600;
    font-size: 13px;
  }
  .timeline-item__time {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  .timeline-item__desc {
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
  }
  .timeline-item__operator {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .timeline-item--success .timeline-item__dot {
    background: var(--el-color-success);
    box-shadow: 0 0 0 4px var(--el-color-success-light-8);
  }
  .timeline-item--success .timeline-item__content {
    border-color: var(--el-color-success-light-7);
    background: var(--el-color-success-light-9);
  }
  .timeline-item--success .timeline-item__title {
    color: var(--el-color-success-dark-2);
  }
  .timeline-item--danger .timeline-item__dot {
    background: var(--el-color-danger);
    box-shadow: 0 0 0 4px var(--el-color-danger-light-8);
  }
  .timeline-item--danger .timeline-item__content {
    border-color: var(--el-color-danger-light-7);
    background: var(--el-color-danger-light-9);
  }
  .timeline-item--danger .timeline-item__title {
    color: var(--el-color-danger-dark-2);
  }
  .timeline-item--primary .timeline-item__dot {
    background: var(--el-color-primary);
    box-shadow: 0 0 0 4px var(--el-color-primary-light-8);
  }
  .timeline-item--primary .timeline-item__content {
    border-color: var(--el-color-primary-light-7);
    background: var(--el-color-primary-light-9);
  }
  .timeline-item--primary .timeline-item__title {
    color: var(--el-color-primary-dark-2);
  }
  .timeline-item--info .timeline-item__dot {
    background: var(--el-color-info);
    box-shadow: 0 0 0 4px var(--el-color-info-light-8);
  }
  .timeline-item--info .timeline-item__content {
    border-color: var(--el-color-info-light-7);
    background: var(--el-color-info-light-9);
  }
  .timeline-item--info .timeline-item__title {
    color: var(--el-color-info-dark-2);
  }
  .timeline-item--warning .timeline-item__dot {
    background: var(--el-color-warning);
    box-shadow: 0 0 0 4px var(--el-color-warning-light-8);
  }
  .timeline-item--warning .timeline-item__content {
    border-color: var(--el-color-warning-light-7);
    background: var(--el-color-warning-light-9);
  }
  .timeline-item--warning .timeline-item__title {
    color: var(--el-color-warning-dark-2);
  }
  @media (max-width: 1200px) {
    .task-detail-layout {
      grid-template-columns: 1fr;
    }
    .task-detail-layout__left {
      grid-template-rows: auto auto;
    }
  }
</style>
