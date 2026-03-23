<template>
  <DhFixedHeaderTableFrame>
    <template #search>
      <div class="search-container">
        <div class="search-header">
          <span class="search-title">筛选条件</span>
        </div>
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="用户名" class="search-item">
            <el-input
              v-model="searchForm.username"
              placeholder="请输入用户名"
              clearable
              class="search-input"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="所属部门" class="search-item">
            <el-tree-select
              v-model="searchForm.deptId"
              :data="deptTree"
              :props="{ label: 'name', value: 'id', children: 'children' }"
              value-key="id"
              placeholder="请选择部门"
              clearable
              check-strictly
              class="search-input"
            />
          </el-form-item>
          <el-form-item class="search-buttons">
            <el-button type="primary" :icon="Search" @click="handleSearch"
              >查 询</el-button
            >
            <el-button :icon="Refresh" @click="resetSearch">重 置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </template>

    <template #operate>
      <el-button type="primary" :icon="Plus" @click="handleAdd"
        >新增用户</el-button
      >
    </template>

    <CTable
      :loading="loading"
      :table-options="{ data: tableData, stripe: true }"
      :headers="tableHeaders"
      :page-data="{ pageNo: page, pageSize: pageSize, total: total }"
      :show-excel="false"
      @page-change="handlePageChange"
    >
      <template #avatar="{ data: { row } }">
        <el-avatar :size="40" :src="row.avatar" icon="UserFilled" fit="cover" />
      </template>

      <template #nickname="{ data: { row } }">
        {{ row.nickname || '-' }}
      </template>

      <template #dept="{ data: { row } }">
        {{ row.dept?.name || '-' }}
      </template>

      <template #roles="{ data: { row } }">
        <template v-if="row.roles && row.roles.length">
          <el-tag
            v-for="role in row.roles"
            :key="role.id"
            type="primary"
            size="small"
            style="margin: 2px"
          >
            {{ role.roleName }}
          </el-tag>
        </template>
        <span v-else class="text-placeholder">暂无角色</span>
      </template>

      <template #status="{ data: { row } }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
          {{ row.status === 1 ? '正常' : '停用' }}
        </el-tag>
      </template>

      <template #createdAt="{ data: { row } }">
        {{ formatDate(row.createdAt) }}
      </template>

      <template #operate="{ data: { row } }">
        <el-space>
          <el-link type="primary" @click="handleEdit(row)">编辑</el-link>
          <el-link type="success" @click="handleAssignRoles(row)"
            >分配角色</el-link
          >
          <el-link
            type="danger"
            :disabled="row.id === 1"
            @click="handleDelete(row)"
            >删除</el-link
          >
        </el-space>
      </template>
    </CTable>
  </DhFixedHeaderTableFrame>

  <Edit
    v-model="editVisible"
    :title="editTitle"
    :detail-data="currentRow"
    @success="getList"
  />

  <el-dialog
    v-model="roleDialogVisible"
    :title="`分配角色 — ${currentRow?.username || ''}`"
    width="500px"
    :close-on-click-modal="false"
    @closed="onRoleDialogClosed"
  >
    <div v-loading="roleLoading" class="role-dialog-body">
      <el-checkbox-group v-model="selectedRoleIds" class="role-checkbox-group">
        <el-checkbox
          v-for="role in allRoles"
          :key="role.id"
          :label="role.id"
          border
          class="role-checkbox-item"
        >
          <div class="role-item-content">
            <span class="role-name">{{ role.roleName }}</span>
            <span class="role-key">{{ role.roleKey }}</span>
          </div>
        </el-checkbox>
      </el-checkbox-group>
      <el-empty
        v-if="!roleLoading && !allRoles.length"
        description="暂无可分配角色"
        :image-size="80"
      />
    </div>
    <template #footer>
      <el-button @click="roleDialogVisible = false">取 消</el-button>
      <el-button
        type="primary"
        :loading="roleSubmitting"
        @click="confirmAssignRoles"
      >
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { Search, Refresh, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import DhFixedHeaderTableFrame from '@/components/container/DhFixedHeaderTableFrame.vue';
import CTable from '@/components/ct-comp/CTable.vue'; // 引入 CTable
import { getDeptTreeApi } from '@/apis/modules/system/dept';
import { getRoleListApi } from '@/apis/modules/system/role';
import {
  getUserListApi,
  deleteUserApi,
  getUserRolesApi,
  assignUserRolesApi,
} from '@/apis/modules/system/user';
import Edit from './components/Edit.vue';

// ==================== 表头配置 ====================
const tableHeaders = ref([
  { prop: 'id', label: 'ID', width: '70', align: 'center' },
  { prop: 'avatar', label: '头像', width: '80', align: 'center' },
  {
    prop: 'username',
    label: '用户名',
    minWidth: '120',
    showOverflowTooltip: true,
  },
  {
    prop: 'nickname',
    label: '昵称',
    minWidth: '120',
    showOverflowTooltip: true,
  },
  {
    prop: 'dept',
    label: '所属部门',
    minWidth: '130',
    showOverflowTooltip: true,
  },
  { prop: 'roles', label: '拥有角色', minWidth: '180' },
  { prop: 'status', label: '状态', width: '90', align: 'center' },
  { prop: 'createdAt', label: '创建时间', minWidth: '170', align: 'center' },
  {
    prop: 'operate',
    label: '操作',
    width: '200',
    align: 'center',
    fixed: 'right',
  },
]);

// ==================== 工具函数 ====================
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==================== 搜索 & 列表 ====================
const searchForm = reactive({ username: '', deptId: null });
const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const getList = async () => {
  loading.value = true;
  try {
    const res = await getUserListApi({
      page: page.value,
      pageSize: pageSize.value,
      username: searchForm.username || undefined,
      deptId: searchForm.deptId || undefined,
    });
    tableData.value = res.list ?? [];
    total.value = res.total ?? 0;
  } catch (e) {
    console.error('获取用户列表失败:', e);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  getList();
};

const resetSearch = () => {
  searchForm.username = '';
  searchForm.deptId = null;
  handleSearch();
};

// ==================== 分页事件处理 ====================
const handlePageChange = (val) => {
  if (val.pageSize) {
    pageSize.value = val.pageSize;
  }
  if (val.pageNum) {
    page.value = val.pageNum;
  }
  getList();
};

// ==================== 部门树（搜索筛选用） ====================
const deptTree = ref([]);
const loadDeptTree = async () => {
  try {
    const res = await getDeptTreeApi();
    deptTree.value = res ?? [];
  } catch (e) {
    console.error('获取部门树失败:', e);
  }
};

// ==================== 新增 / 编辑 ====================
const editVisible = ref(false);
const editTitle = ref('新增用户');
const currentRow = ref(null);

const handleAdd = () => {
  editTitle.value = '新增用户';
  currentRow.value = null;
  editVisible.value = true;
};

const handleEdit = (row) => {
  editTitle.value = '编辑用户';
  currentRow.value = row;
  editVisible.value = true;
};

// ==================== 删除 ====================
const handleDelete = (row) => {
  if (row.id === 1) {
    ElMessage.warning('超级管理员无法删除');
    return;
  }
  ElMessageBox.confirm(
    `确认删除用户「${row.username}」吗？此操作不可恢复。`,
    '删除确认',
    {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    },
  )
    .then(async () => {
      await deleteUserApi({ id: row.id });
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

// ==================== 分配角色 ====================
const roleDialogVisible = ref(false);
const roleLoading = ref(false);
const roleSubmitting = ref(false);
const allRoles = ref([]);
const selectedRoleIds = ref([]);

const handleAssignRoles = async (row) => {
  currentRow.value = row;
  roleDialogVisible.value = true;
  roleLoading.value = true;
  try {
    const [rolesRes, userRoleIds] = await Promise.all([
      getRoleListApi({ page: 1, pageSize: 999 }),
      getUserRolesApi({ userId: row.id }),
    ]);
    allRoles.value = rolesRes.list ?? [];
    selectedRoleIds.value = userRoleIds ?? [];
  } catch (e) {
    console.error('加载角色数据失败:', e);
    ElMessage.error('加载角色数据失败');
  } finally {
    roleLoading.value = false;
  }
};

const confirmAssignRoles = async () => {
  if (!currentRow.value) return;
  roleSubmitting.value = true;
  try {
    await assignUserRolesApi({
      userId: currentRow.value.id,
      roleIds: selectedRoleIds.value,
    });
    ElMessage.success('角色分配成功');
    roleDialogVisible.value = false;
    getList();
  } catch (e) {
    console.error('分配角色失败:', e);
  } finally {
    roleSubmitting.value = false;
  }
};

const onRoleDialogClosed = () => {
  allRoles.value = [];
  selectedRoleIds.value = [];
};

// ==================== 生命周期 ====================
onMounted(() => {
  loadDeptTree();
  getList();
});
</script>

<style scoped lang="scss">
/* 搜索容器样式 */
.search-container {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .search-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .search-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color-primary);
      padding-left: 8px;
      border-left: 3px solid var(--color-primary);
    }
  }

  .search-form {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    :deep(.el-form-item) {
      margin-bottom: 0;
      gap: 8px;

      .el-form-item__label {
        font-weight: 500;
        color: var(--text-color-primary);
        font-size: 14px;
      }
    }

    .search-item {
      flex: 0 1 auto;
      min-width: 220px;
    }

    .search-input {
      width: 100%;
    }

    .search-buttons {
      display: flex;
      gap: 8px;
      margin-left: auto;

      :deep(.el-button) {
        min-width: 80px;
      }
    }
  }
}

.text-placeholder {
  color: #c0c4cc;
  font-size: 12px;
}

/* 分配角色弹窗 */
.role-dialog-body {
  min-height: 120px;
  padding: 4px 0;
}

.role-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.role-checkbox-item {
  width: calc(50% - 5px);
  margin: 0 !important;
  height: auto !important;
  padding: 8px 12px;
}

.role-item-content {
  display: flex;
  flex-direction: column;
  line-height: 1.5;
}

.role-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.role-key {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
</style>
