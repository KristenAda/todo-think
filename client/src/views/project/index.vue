<template>
  <div class="project-page">
    <div class="project-page__toolbar">
      <div class="toolbar__filters">
        <el-input
          v-model="query.name"
          placeholder="搜索项目名称..."
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix><art-svg-icon icon="mdi:magnify" /></template>
        </el-input>
        <el-select
          v-model="query.status"
          placeholder="全部状态"
          clearable
          style="width: 160px"
          @change="handleSearch"
        >
          <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value">
            <span class="status-option"
              ><art-svg-icon :icon="s.icon" :style="{ color: s.color }" />{{ s.label }}</span
            >
          </el-option>
        </el-select>
      </div>
      <el-button type="primary" class="toolbar__create-btn" @click="openCreateDialog">
        <art-svg-icon icon="mdi:plus-circle" style="margin-right: 6px" />新建项目
      </el-button>
    </div>

    <div class="project-page__content">
      <div v-if="loading" class="project-grid">
        <div v-for="n in 8" :key="n" class="project-card project-card--skeleton"
          ><el-skeleton :rows="4" animated
        /></div>
      </div>

      <div v-else-if="!projectList.length" class="empty-state">
        <art-svg-icon icon="mdi:folder-open-outline" class="empty-state__icon" />
        <p>暂无项目，点击「新建项目」开始</p>
      </div>

      <transition-group v-else name="card-list" tag="div" class="project-grid">
        <div
          v-for="proj in projectList"
          :key="proj.id"
          class="project-card"
          @mouseenter="hoveredId = proj.id"
          @mouseleave="hoveredId = null"
        >
          <div class="project-card__header">
            <div class="project-card__name">{{ proj.name }}</div>
            <div class="project-card__status">
              <el-tag
                :color="getStatus(proj.status).bg"
                :style="{ color: getStatus(proj.status).color, border: 'none' }"
                size="small"
              >
                <art-svg-icon
                  :icon="getStatus(proj.status).icon"
                  style="margin-right: 3px; vertical-align: -2px"
                />
                {{ getStatus(proj.status).label }}
              </el-tag>
            </div>
          </div>
          <div class="project-card__progress-bar">
            <div
              class="project-card__progress-fill"
              :style="{
                background: getStatus(proj.status).color,
                width: getStatus(proj.status).progress
              }"
            />
          </div>
          <div class="project-card__desc">{{ proj.description || '暂无描述' }}</div>
          <div class="project-card__meta">
            <div class="meta-item">
              <art-svg-icon icon="mdi:account-tie" class="meta-item__icon" />
              <el-avatar :size="22" :src="proj.manager.avatar ?? undefined">{{
                (proj.manager.nickName || proj.manager.userName)?.[0]?.toUpperCase()
              }}</el-avatar>
              <span>{{ proj.manager.nickName || proj.manager.userName }}</span>
            </div>
            <div class="meta-item">
              <art-svg-icon icon="mdi:clipboard-list-outline" class="meta-item__icon" />
              <span>{{ proj._count.tasks }} 个任务</span>
            </div>
          </div>
          <div class="project-card__date" v-if="proj.startDate || proj.endDate">
            <art-svg-icon icon="mdi:calendar-clock" class="meta-item__icon" />
            <span>{{ formatDate(proj.startDate) }} ~ {{ formatDate(proj.endDate) }}</span>
          </div>
          <div
            class="project-card__actions"
            :class="{ 'project-card__actions--visible': hoveredId === proj.id }"
          >
            <el-button link type="primary" @click.stop="openEditDialog(proj)">
              <art-svg-icon icon="mdi:pencil" style="margin-right: 3px" /> 编辑
            </el-button>
            <el-popconfirm title="确认删除该项目？" @confirm="handleDelete(proj.id)">
              <template #reference>
                <el-button link type="danger"
                  ><art-svg-icon icon="mdi:trash-can" style="margin-right: 3px" /> 删除</el-button
                >
              </template>
            </el-popconfirm>
          </div>
        </div>
      </transition-group>
    </div>

    <div class="project-page__pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[12, 24, 48]"
        layout="total,sizes,prev,pager,next"
        background
        @size-change="loadProjects"
        @current-change="loadProjects"
      />
    </div>

    <ArtDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑项目' : '新建项目'"
      icon="solar:folder-bold-duotone"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
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
            value-format="YYYY-MM-DDTHH:mm:ss.000Z"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </ArtDialog>

    <!-- 项目负责人：公共 ArtDialog + 卡片单选（必选） -->
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
        <el-button @click="managerPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmProjectManagerPicker">确定</el-button>
      </template>
    </ArtDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed, nextTick } from 'vue';
  import { ElMessage } from 'element-plus';
  import type { FormInstance, FormRules } from 'element-plus';
  import {
    fetchProjectPage,
    fetchProjectCreate,
    fetchProjectUpdate,
    fetchProjectDelete,
    fetchProjectOrgMembers,
    type ProjectItem,
    type ProjectStatus
  } from '@/api/project';

  const STATUS_OPTIONS = [
    {
      value: 'PLANNING',
      label: '计划中',
      icon: 'mdi:clock-outline',
      color: '#909399',
      bg: '#f4f4f5',
      progress: '20%'
    },
    {
      value: 'ACTIVE',
      label: '进行中',
      icon: 'mdi:play-circle-outline',
      color: '#67c23a',
      bg: '#f0f9eb',
      progress: '60%'
    },
    {
      value: 'COMPLETED',
      label: '已完成',
      icon: 'mdi:check-circle-outline',
      color: '#409eff',
      bg: '#ecf5ff',
      progress: '100%'
    },
    {
      value: 'SUSPENDED',
      label: '已搁置',
      icon: 'mdi:pause-circle-outline',
      color: '#e6a23c',
      bg: '#fdf6ec',
      progress: '40%'
    }
  ] as const;

  function getStatus(s: string) {
    return STATUS_OPTIONS.find((o) => o.value === s) ?? STATUS_OPTIONS[0];
  }
  function formatDate(d: string | null) {
    return d ? new Date(d).toLocaleDateString('zh-CN') : '未设置';
  }

  const loading = ref(false);
  const submitting = ref(false);
  const dialogVisible = ref(false);
  const editingId = ref<number | null>(null);
  const hoveredId = ref<number | null>(null);
  const projectList = ref<ProjectItem[]>([]);
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
  const total = ref(0);
  const formRef = ref<FormInstance>();

  const query = reactive({
    page: 1,
    pageSize: 12,
    name: '',
    status: undefined as ProjectStatus | undefined
  });
  const form = reactive({
    name: '',
    description: '',
    managerId: undefined as number | undefined,
    status: 'ACTIVE' as ProjectStatus,
    dateRange: null as [string, string] | null
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

  async function loadProjects() {
    loading.value = true;
    try {
      const res = await fetchProjectPage({ ...query, name: query.name || undefined });
      if (res) {
        projectList.value = res.list;
        total.value = res.total;
      }
    } finally {
      loading.value = false;
    }
  }

  async function loadUsers() {
    const res = await fetchProjectOrgMembers();
    if (Array.isArray(res)) userList.value = res;
  }

  function handleSearch() {
    query.page = 1;
    loadProjects();
  }

  function openCreateDialog() {
    editingId.value = null;
    Object.assign(form, {
      name: '',
      description: '',
      managerId: undefined,
      status: 'ACTIVE',
      dateRange: null
    });
    dialogVisible.value = false;
    nextTick(() => {
      dialogVisible.value = true;
    });
  }

  function openEditDialog(proj: ProjectItem) {
    editingId.value = proj.id;
    Object.assign(form, {
      name: proj.name,
      description: proj.description ?? '',
      managerId: proj.managerId,
      status: proj.status,
      dateRange: proj.startDate && proj.endDate ? [proj.startDate, proj.endDate] : null
    });
    dialogVisible.value = false;
    nextTick(() => {
      dialogVisible.value = true;
    });
  }

  async function handleSubmit() {
    await formRef.value?.validate();
    submitting.value = true;
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        managerId: form.managerId!,
        status: form.status,
        startDate: form.dateRange?.[0] ?? null,
        endDate: form.dateRange?.[1] ?? null
      };
      if (editingId.value) {
        await fetchProjectUpdate(editingId.value, payload);
        ElMessage.success('更新成功');
      } else {
        await fetchProjectCreate(payload);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      loadProjects();
    } catch {
      /* 拦截器处理 */
    } finally {
      submitting.value = false;
    }
  }

  async function handleDelete(id: number) {
    await fetchProjectDelete(id);
    ElMessage.success('已删除');
    loadProjects();
  }

  onMounted(() => {
    loadProjects();
    loadUsers();
  });
</script>

<style scoped lang="scss">
  $card-radius: 12px;
  $card-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  $card-shadow-hover: 0 8px 28px rgba(0, 0, 0, 0.14);
  $transition: 0.3s ease;

  /* 主容器：固定高度，flex列布局 */
  .project-page {
    padding: 20px;
    height: 100%; /* 关键：固定满高 */
    box-sizing: border-box;
    background: var(--art-main-bg-color);
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow: hidden; /* 防止页面整体滚动 */
  }

  /* 顶部工具栏：禁止压缩 */
  .project-page__toolbar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    background: var(--default-box-color);
    padding: 14px 20px;
    border-radius: $card-radius;
    box-shadow: $card-shadow;
    .toolbar__filters {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .toolbar__create-btn {
      display: flex;
      align-items: center;
      padding: 0 20px;
      height: 38px;
      font-size: 14px;
      border-radius: 8px;
    }
  }

  .status-option {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* 中间内容区：占满剩余空间，独立滚动 */
  .project-page__content {
    flex: 1;
    overflow-y: auto;
    min-height: 0; /* 兼容部分浏览器flex嵌套滚动失效的问题 */
    padding: 2px; /* 给卡片悬浮阴影留点空间，防裁剪 */
    margin: -2px; /* 抵消 padding 带来的偏差 */

    /* 美化滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  .project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .project-card {
    background: var(--default-box-color);
    border-radius: $card-radius;
    box-shadow: $card-shadow;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    cursor: default;
    transition:
      transform $transition,
      box-shadow $transition;
    position: relative;
    overflow: hidden;
    &:hover {
      transform: translateY(-5px);
      box-shadow: $card-shadow-hover;
    }
    &--skeleton {
      min-height: 200px;
    }
    &__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    &__name {
      font-size: 16px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      flex: 1;
      word-break: break-all;
    }
    &__status {
      flex-shrink: 0;
    }
    &__progress-bar {
      height: 3px;
      background: var(--el-fill-color-light);
      border-radius: 2px;
      overflow: hidden;
    }
    &__progress-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.6s ease;
    }
    &__desc {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 42px;
    }
    &__meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    &__date {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
    &__actions {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
      opacity: 0;
      transition: opacity $transition;
      padding-top: 4px;
      border-top: 1px solid var(--art-card-border);
      &--visible {
        opacity: 1;
      }
    }
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    &__icon {
      color: var(--el-color-primary);
      font-size: 15px;
      flex-shrink: 0;
    }
    &__avatar {
      flex-shrink: 0;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    color: var(--el-text-color-placeholder);
    height: 100%;
    &__icon {
      font-size: 72px;
      margin-bottom: 16px;
    }
    p {
      font-size: 15px;
    }
  }

  /* 底部固定分页：禁止压缩 */
  .project-page__pagination {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    background: var(--default-box-color);
    padding: 14px 20px;
    border-radius: $card-radius;
    box-shadow: $card-shadow;
  }

  /* Vue 动画组 */
  .card-list-enter-active {
    transition: all 0.4s ease;
  }
  .card-list-leave-active {
    transition: all 0.3s ease;
    position: absolute;
  }
  .card-list-enter-from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  .card-list-leave-to {
    opacity: 0;
    transform: scale(0.9);
  }
  .card-list-move {
    transition: transform 0.4s ease;
  }
</style>

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

  /* 复用 task 页的卡片样式命名，避免再造一套 */
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
</style>
