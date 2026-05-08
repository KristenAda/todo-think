<template>
  <div class="org-wrapper">
    <div class="panel left-panel">
      <div class="panel-header">
        <div class="header-title">
          <div class="title-mark"></div>
          <art-svg-icon
            icon="mdi:sitemap"
            style="margin-right: 8px; color: var(--el-color-primary)"
          />
          <span>组织架构</span>
        </div>
      </div>

      <div class="tree-search-box">
        <el-input
          v-model="treeFilterText"
          placeholder="搜索部门..."
          prefix-icon="Search"
          clearable
          :disabled="deptTree.length === 0"
        />
      </div>

      <div class="tree-container" v-loading="treeLoading">
        <el-empty
          v-if="deptTree.length === 0 && !treeLoading"
          description="暂无组织架构"
          :image-size="60"
        />
        <el-tree
          v-else
          ref="treeRef"
          :data="deptTree"
          :props="treeProps"
          :filter-node-method="filterNode"
          node-key="id"
          highlight-current
          default-expand-all
          class="custom-tree"
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <art-svg-icon
                :icon="
                  node.level === 1
                    ? 'mdi:office-building'
                    : node.isLeaf
                      ? 'mdi:account-group'
                      : node.expanded
                        ? 'mdi:folder-open'
                        : 'mdi:folder'
                "
                :class="[
                  'node-icon',
                  node.level === 1 ? 'text-blue' : node.isLeaf ? 'text-green' : 'text-yellow'
                ]"
              />
              <span class="node-label" :title="data.name">{{ data.name }}</span>
              <el-tag v-if="data.status === 0" size="small" type="danger" class="node-tag"
                >停用</el-tag
              >
            </div>
          </template>
        </el-tree>
      </div>
    </div>

    <div class="panel right-panel">
      <div v-if="deptTree.length === 0 && !treeLoading" class="global-empty">
        <el-empty description="系统暂无组织架构数据，请先创建部门" :image-size="120" />
      </div>
      <div v-else-if="!selectedDeptId" class="global-empty placeholder-view">
        <art-svg-icon icon="mdi:sitemap" class="placeholder-icon" />
        <p>请从左侧组织树中选择一个部门查看详情</p>
      </div>

      <div v-else class="content-layout">
        <div class="dept-title-bar">
          <art-svg-icon icon="mdi:office-building" class="title-icon" />
          <span class="title-text">{{ selectedDeptName }}</span>
        </div>

        <div class="data-card manager-card">
          <div class="card-header">
            <div class="card-title">
              <art-svg-icon icon="mdi:crown" class="text-warning" />
              <span>部门管理者</span>
              <span class="count-badge">{{ managers.length }}</span>
            </div>
            <el-button
              v-if="isSuperAdmin"
              type="primary"
              class="action-btn"
              @click="openAddManagerDialog"
            >
              <art-svg-icon icon="mdi:plus" /> 添加管理者
            </el-button>
          </div>
          <div class="card-body">
            <el-table
              :data="managers"
              v-loading="managersLoading"
              height="100%"
              style="width: 100%"
            >
              <el-table-column label="头像" width="80" align="center">
                <template #default="{ row }">
                  <UserAvatar
                    :size="32"
                    :src="row.avatar"
                    :name="row.nickName || row.userName || '?'"
                    :gender="row.userGender || ''"
                    fit="cover"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="userName" label="用户名" min-width="120" />
              <el-table-column prop="nickName" label="昵称" min-width="120">
                <template #default="{ row }">{{ row.nickName || '-' }}</template>
              </el-table-column>
              <el-table-column prop="userPhone" label="手机号" min-width="130">
                <template #default="{ row }">{{ row.userPhone || '-' }}</template>
              </el-table-column>
              <el-table-column prop="userEmail" label="邮箱" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">{{ row.userEmail || '-' }}</template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status === '1' ? 'success' : 'danger'" effect="light">
                    {{ row.status === '1' ? '正常' : '异常' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                v-if="isSuperAdmin"
                label="操作"
                width="120"
                align="center"
                fixed="right"
              >
                <template #default="{ row }">
                  <el-button type="danger" link @click="handleRemoveManager(row)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="data-card member-card">
          <div class="card-header">
            <div class="card-title">
              <art-svg-icon icon="mdi:account-group" class="text-primary" />
              <span>部门成员</span>
              <span class="count-badge blue">{{ members.length }}</span>
            </div>
            <el-button
              v-if="canManage"
              type="success"
              class="action-btn"
              @click="openAddMemberDialog"
            >
              <art-svg-icon icon="mdi:account-plus" /> 添加成员
            </el-button>
          </div>
          <div class="card-body">
            <el-table :data="members" v-loading="membersLoading" height="100%" style="width: 100%">
              <el-table-column label="头像" width="80" align="center">
                <template #default="{ row }">
                  <UserAvatar
                    :size="32"
                    :src="row.avatar"
                    :name="row.nickName || row.userName || '?'"
                    :gender="row.userGender || ''"
                    fit="cover"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="userName" label="用户名" min-width="120" />
              <el-table-column prop="nickName" label="昵称" min-width="120">
                <template #default="{ row }">{{ row.nickName || '-' }}</template>
              </el-table-column>
              <el-table-column label="性别" width="90" align="center">
                <template #default="{ row }">
                  <span
                    v-if="row.userGender"
                    :class="row.userGender === '男' ? 'text-primary' : 'text-danger'"
                  >
                    <art-svg-icon
                      :icon="row.userGender === '男' ? 'mdi:gender-male' : 'mdi:gender-female'"
                    />
                    {{ row.userGender }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column prop="userPhone" label="手机号" min-width="130">
                <template #default="{ row }">{{ row.userPhone || '-' }}</template>
              </el-table-column>
              <el-table-column prop="userEmail" label="邮箱" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">{{ row.userEmail || '-' }}</template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status === '1' ? 'success' : 'danger'" effect="light">
                    {{ row.status === '1' ? '正常' : '异常' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link @click="openProfileDialog(row)">详情</el-button>
                  <el-button v-if="canManage" type="danger" link @click="handleRemoveMember(row)"
                    >移除</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <OrgUserMultiPickDialog
      v-model="addManagerVisible"
      title="添加部门管理者"
      icon="mdi:crown"
      :candidates="nonManagerCandidates"
      :loading="submitLoading"
      @confirm="submitAddManagers"
    />

    <OrgUserMultiPickDialog
      v-model="addMemberVisible"
      title="添加部门成员"
      icon="mdi:account-plus"
      :candidates="nonMemberCandidates"
      :loading="submitLoading"
      @confirm="submitAddMembers"
    />

    <OrgMemberProfileDialog v-model="profileVisible" :user="profileUser" />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, nextTick } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import {
    fetchDeptTree,
    fetchDeptManagers,
    fetchAddManagers,
    fetchRemoveManager,
    fetchDeptMembers,
    fetchAllUsers,
    fetchAddMembers,
    fetchRemoveMember
  } from '@/api/organization';
  import { useUserStore } from '@/store/modules/user';
  import OrgUserMultiPickDialog from './components/OrgUserMultiPickDialog.vue';
  import OrgMemberProfileDialog from './components/OrgMemberProfileDialog.vue';

  const userStore = useUserStore();
  const currentUserId = computed(() => userStore.info?.userId ?? 0);
  /** 与登录接口 roles（Role.roleCode，如 admin）及模板标识 R_SUPER 对齐 */
  const isSuperAdmin = computed(() => {
    const roles = userStore.info?.roles ?? [];
    return roles.includes('admin') || roles.includes('R_SUPER') || roles.includes('R_ADMIN');
  });

  // --- 左侧树逻辑 ---
  const treeRef = ref<any>();
  const deptTree = ref<any[]>([]);
  const treeFilterText = ref('');
  const treeProps = { label: 'name', children: 'children' };
  const selectedDeptId = ref<number | null>(null);
  const selectedDeptName = ref('');
  const treeLoading = ref(false);

  const filterNode = (value: string, data: any) => {
    if (!value) return true;
    return data.name.includes(value);
  };
  watch(treeFilterText, (val) => treeRef.value?.filter(val));

  const handleNodeClick = (data: any) => {
    if (selectedDeptId.value === data.id) return;
    selectedDeptId.value = data.id;
    selectedDeptName.value = data.name;
    loadDeptData();
  };

  // --- 右侧表格逻辑 ---
  const managers = ref<any[]>([]);
  const managersLoading = ref(false);
  const members = ref<any[]>([]);
  const membersLoading = ref(false);

  const loadManagers = async () => {
    if (!selectedDeptId.value) return;
    managersLoading.value = true;
    try {
      const res = await fetchDeptManagers(selectedDeptId.value);
      managers.value = res ?? [];
    } finally {
      managersLoading.value = false;
    }
  };

  const loadMembers = async () => {
    if (!selectedDeptId.value) return;
    membersLoading.value = true;
    try {
      const res = await fetchDeptMembers(selectedDeptId.value);
      members.value = res ?? [];
    } finally {
      membersLoading.value = false;
    }
  };

  const loadDeptData = () => {
    managers.value = [];
    members.value = [];
    loadManagers();
    loadMembers();
  };

  const isManager = computed(() => managers.value.some((m) => m.id === currentUserId.value));
  const canManage = computed(() => isSuperAdmin.value || isManager.value);

  // --- 弹窗共用逻辑 ---
  const allUsers = ref<any[]>([]);
  const submitLoading = ref(false);

  const loadAllUsers = async () => {
    const res = await fetchAllUsers();
    allUsers.value = res ?? [];
  };

  const nonManagerCandidates = computed(() => {
    const existing = new Set(managers.value.map((m) => m.id));
    return allUsers.value.filter((u) => !existing.has(u.id));
  });

  const nonMemberCandidates = computed(() => {
    const existing = new Set(members.value.map((m) => m.id));
    return allUsers.value.filter((u) => !existing.has(u.id));
  });

  // --- 管理者操作 ---
  const addManagerVisible = ref(false);
  const openAddManagerDialog = async () => {
    await loadAllUsers();
    addManagerVisible.value = false;
    nextTick(() => {
      addManagerVisible.value = true;
    });
  };
  const submitAddManagers = async (ids: number[]) => {
    if (!ids.length) return ElMessage.warning('请至少选择一个用户');
    submitLoading.value = true;
    try {
      await fetchAddManagers(selectedDeptId.value!, ids);
      ElMessage.success('添加管理者成功');
      addManagerVisible.value = false;
      await loadManagers();
    } finally {
      submitLoading.value = false;
    }
  };
  const handleRemoveManager = async (row: any) => {
    await ElMessageBox.confirm(
      `确定要将 "${row.nickName || row.userName}" 移除管理者身份吗？`,
      '安全警告',
      { type: 'warning' }
    );
    await fetchRemoveManager(selectedDeptId.value!, row.id);
    ElMessage.success('已移除');
    await loadManagers();
  };

  // --- 成员操作 ---
  const addMemberVisible = ref(false);
  const openAddMemberDialog = async () => {
    await loadAllUsers();
    addMemberVisible.value = false;
    nextTick(() => {
      addMemberVisible.value = true;
    });
  };
  const submitAddMembers = async (ids: number[]) => {
    if (!ids.length) return ElMessage.warning('请至少选择一个用户');
    submitLoading.value = true;
    try {
      await fetchAddMembers(selectedDeptId.value!, ids);
      ElMessage.success('添加成员成功');
      addMemberVisible.value = false;
      await loadMembers();
    } finally {
      submitLoading.value = false;
    }
  };
  const handleRemoveMember = async (row: any) => {
    await ElMessageBox.confirm(
      `确定要将 "${row.nickName || row.userName}" 移出该部门吗？`,
      '安全警告',
      { type: 'warning' }
    );
    await fetchRemoveMember(selectedDeptId.value!, row.id);
    ElMessage.success('已移除');
    await loadMembers();
  };

  // --- 详情弹窗 ---
  const profileVisible = ref(false);
  const profileUser = ref<any>(null);
  const openProfileDialog = (row: any) => {
    profileUser.value = row;
    profileVisible.value = true;
  };

  onMounted(async () => {
    treeLoading.value = true;
    try {
      const res = await fetchDeptTree();
      deptTree.value = res ?? [];
      if (deptTree.value.length > 0) {
        nextTick(() => {
          const firstNode = deptTree.value[0];
          treeRef.value?.setCurrentKey(firstNode.id);
          handleNodeClick(firstNode);
        });
      }
    } finally {
      treeLoading.value = false;
    }
  });
</script>

<style scoped lang="scss">
  /* 基础变量与颜色重置 - 使用框架 CSS 变量适配亮/暗模式 */
  $primary-color: var(--el-color-primary);

  .org-wrapper {
    display: flex;
    height: 100%;
    width: 100%;
    background-color: var(--art-main-bg-color);
    padding: 16px;
    gap: 16px;
    box-sizing: border-box;

    /* 通用面板样式 */
    .panel {
      background: var(--default-box-color);
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  }

  /* ================= 左侧树区域 ================= */
  .left-panel {
    width: 340px;
    flex-shrink: 0;

    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--art-card-border);

      .header-title {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .title-mark {
          width: 4px;
          height: 16px;
          background-color: $primary-color;
          border-radius: 2px;
          margin-right: 8px;
        }
      }
    }

    .tree-search-box {
      padding: 12px 16px;
    }

    .tree-container {
      flex: 1;
      overflow-y: auto;
      padding: 0 12px 16px;

      /* 树组件深度美化 */
      .custom-tree {
        background: transparent;

        :deep(.el-tree-node__content) {
          height: 42px;
          border-radius: 6px;
          margin-bottom: 4px;
          transition: all 0.2s ease;

          &:hover {
            background-color: var(--el-fill-color-light);
          }
        }

        :deep(.el-tree-node.is-current > .el-tree-node__content) {
          background-color: var(--el-color-primary-light-9);
          color: $primary-color;
          font-weight: 500;
        }
      }

      .custom-tree-node {
        display: flex;
        align-items: center;
        width: 100%;
        font-size: 14px;
        color: var(--el-text-color-regular);
        padding-right: 8px;

        .node-icon {
          margin-right: 10px;
          font-size: 18px;

          &.text-blue {
            color: $primary-color;
          }
          &.text-yellow {
            color: #f2c94c;
          }
          &.text-green {
            color: #27ae60;
          }
        }

        .node-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .node-tag {
          transform: scale(0.9);
        }
      }
    }
  }

  /* ================= 右侧主区域 ================= */
  .right-panel {
    flex: 1;
    min-width: 0;
    background: transparent;
    box-shadow: none;

    .global-empty {
      height: 100%;
      background: var(--default-box-color);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;

      &.placeholder-view {
        color: var(--el-text-color-secondary);
        gap: 16px;

        .placeholder-icon {
          font-size: 64px;
          opacity: 0.2;
        }
      }
    }

    .content-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 16px;

      .dept-title-bar {
        background: var(--default-box-color);
        padding: 16px 24px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);

        .title-icon {
          font-size: 20px;
          color: $primary-color;
        }
        .title-text {
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }

      /* 上下分块的数据卡片 */
      .data-card {
        flex: 1;
        background: var(--default-box-color);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          border-bottom: 1px solid var(--art-card-border);

          .card-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            display: flex;
            align-items: center;
            gap: 8px;

            .text-warning {
              color: var(--el-color-warning);
              font-size: 18px;
            }
            .text-primary {
              color: $primary-color;
              font-size: 18px;
            }

            .count-badge {
              background-color: var(--el-color-warning-light-9);
              color: var(--el-color-warning);
              padding: 0 8px;
              border-radius: 10px;
              font-size: 12px;
              font-weight: normal;

              &.blue {
                background-color: var(--el-color-primary-light-9);
                color: $primary-color;
              }
            }
          }

          .action-btn {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }

        /* 表格容器 */
        .card-body {
          flex: 1;
          height: 0;
          padding: 12px 24px 24px;

          :deep(.el-table) {
            border-radius: 4px;

            th.el-table__cell {
              background-color: var(--el-fill-color-light);
              color: var(--el-text-color-primary);
              font-weight: 600;
            }
          }
        }
      }
    }
  }

  /* ================= 辅助文字颜色 ================= */
  .text-primary {
    color: var(--el-color-primary);
  }
  .text-danger {
    color: var(--el-color-danger);
  }
  .text-muted {
    color: var(--el-text-color-secondary);
  }
</style>
