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
          <el-select
            v-model="form.managerId"
            placeholder="请选择负责人（仅显示同组织成员）"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="u in userList"
              :key="u.id"
              :label="u.nickName || u.userName"
              :value="u.id"
            >
              <span style="display: flex; align-items: center; gap: 8px">
                <el-avatar :size="20" :src="u.avatar ?? undefined">{{
                  (u.nickName || u.userName)?.[0]
                }}</el-avatar>
                {{ u.nickName || u.userName }}
              </span>
            </el-option>
          </el-select>
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
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue';
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
    { id: number; userName: string; nickName: string | null; avatar: string | null }[]
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
    dialogVisible.value = true;
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
    dialogVisible.value = true;
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
  $bg-color: #f2f3f5;
  $card-radius: 12px;
  $card-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  $card-shadow-hover: 0 8px 28px rgba(0, 0, 0, 0.14);
  $transition: 0.3s ease;

  /* 主容器：固定高度，flex列布局 */
  .project-page {
    padding: 20px;
    height: 100%; /* 关键：固定满高 */
    box-sizing: border-box;
    background: $bg-color;
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
    background: #fff;
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
      background: #dcdfe6;
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
    background: #fff;
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
      color: #1a1a2e;
      flex: 1;
      word-break: break-all;
    }
    &__status {
      flex-shrink: 0;
    }
    &__progress-bar {
      height: 3px;
      background: #f0f0f0;
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
      color: #888;
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
      color: #aaa;
    }
    &__actions {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
      opacity: 0;
      transition: opacity $transition;
      padding-top: 4px;
      border-top: 1px solid #f5f5f5;
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
    color: #555;
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
    color: #ccc;
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
    background: #fff;
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
