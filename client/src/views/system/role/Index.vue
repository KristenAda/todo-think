<template>
  <div class="role-container">
    <!-- 搜索区 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="角色名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入角色名称"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查 询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重 置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="roleName" label="角色名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="roleKey" label="角色标识" min-width="160" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-link type="primary" @click="handleEdit(row)">编辑</el-link>
            <el-divider direction="vertical" />
            <el-link type="success" @click="handleAssignPerms(row)">分配权限</el-link>
            <el-divider direction="vertical" />
            <el-link type="warning" @click="handleAssignDataScope(row)">数据权限</el-link>
            <el-divider direction="vertical" />
            <el-link type="danger" @click="handleDelete(row)">删除</el-link>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <Edit
      v-model="editVisible"
      :title="editTitle"
      :detail-data="currentRow"
      @success="getList"
    />

    <!-- 分配菜单权限弹窗 -->
    <el-dialog
      v-model="permsDialogVisible"
      :title="`分配菜单权限 — ${currentRow?.roleName || ''}`"
      width="600px"
      :close-on-click-modal="false"
      @closed="onPermsDialogClosed"
    >
      <div v-loading="permsLoading" class="perms-dialog-body">
        <el-tree
          ref="menuTreeRef"
          :data="menuTree"
          :props="{ label: 'title', children: 'children' }"
          show-checkbox
          node-key="id"
          :default-checked-keys="selectedMenuIds"
          @check="handleMenuCheck"
        />
      </div>
      <template #footer>
        <el-button @click="permsDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="permsSubmitting" @click="confirmAssignPerms">
          确 定
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配数据权限弹窗 -->
    <el-dialog
      v-model="dataScopeDialogVisible"
      :title="`分配数据权限 — ${currentRow?.roleName || ''}`"
      width="500px"
      :close-on-click-modal="false"
      @closed="onDataScopeDialogClosed"
    >
      <el-form :model="dataScopeForm" label-width="100px">
        <el-form-item label="权限范围">
          <el-radio-group v-model="dataScopeForm.dataScope" @change="handleDataScopeChange">
            <el-radio :label="1">全部数据</el-radio>
            <el-radio :label="3">本部门</el-radio>
            <el-radio :label="4">本部门及下级</el-radio>
            <el-radio :label="5">仅本人</el-radio>
            <el-radio :label="2">自定数据</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 自定数据权限：选择部门 -->
        <el-form-item v-if="dataScopeForm.dataScope === 2" label="选择部门">
          <el-tree
            ref="deptTreeRef"
            :data="deptTree"
            :props="{ label: 'name', children: 'children' }"
            show-checkbox
            node-key="id"
            :default-checked-keys="dataScopeForm.deptIds"
            @check="handleDeptCheck"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dataScopeDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="dataScopeSubmitting" @click="confirmAssignDataScope">
          确 定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Search, Refresh, Plus } from '@element-plus/icons-vue';
import { getMenuListApi } from '@/apis/modules/system/menu';
import { getDeptTreeApi } from '@/apis/modules/system/dept';
import {
  getRoleListApi,
  deleteRoleApi,
  assignRolePermsApi,
  getRolePermsApi,
  updateDataScopeApi,
} from '@/apis/modules/system/role';
import Edit from './components/Edit.vue';

// ==================== 搜索 & 列表 ====================
const searchForm = reactive({ name: '' });
const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const getList = async () => {
  loading.value = true;
  try {
    const res = await getRoleListApi({
      page: page.value,
      pageSize: pageSize.value,
      name: searchForm.name || undefined,
    });
    tableData.value = res.list ?? [];
    total.value = res.total ?? 0;
  } catch (e) {
    console.error('获取角色列表失败:', e);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  getList();
};

const resetSearch = () => {
  searchForm.name = '';
  handleSearch();
};

// ==================== 新增 / 编辑 ====================
const editVisible = ref(false);
const editTitle = ref('新增角色');
const currentRow = ref(null);

const handleAdd = () => {
  editTitle.value = '新增角色';
  currentRow.value = null;
  editVisible.value = true;
};

const handleEdit = (row) => {
  editTitle.value = '编辑角色';
  currentRow.value = row;
  editVisible.value = true;
};

// ==================== 删除 ====================
const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除角色「${row.roleName}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
  })
    .then(async () => {
      await deleteRoleApi({ id: row.id });
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

// ==================== 分配菜单权限 ====================
const permsDialogVisible = ref(false);
const permsLoading = ref(false);
const permsSubmitting = ref(false);
const menuTree = ref([]);
const selectedMenuIds = ref([]);
const menuTreeRef = ref(null);

const handleAssignPerms = async (row) => {
  currentRow.value = row;
  permsDialogVisible.value = true;
  permsLoading.value = true;
  try {
    const [menuRes, permsRes] = await Promise.all([
      getMenuListApi({}),
      getRolePermsApi({ roleId: row.id }),
    ]);
    menuTree.value = Array.isArray(menuRes) ? menuRes : [];
    selectedMenuIds.value = permsRes ?? [];
  } catch (e) {
    console.error('加载权限数据失败:', e);
    ElMessage.error('加载权限数据失败');
  } finally {
    permsLoading.value = false;
  }
};

const handleMenuCheck = () => {
  // 树形组件自动更新
};

const confirmAssignPerms = async () => {
  if (!currentRow.value) return;
  permsSubmitting.value = true;
  try {
    const checkedKeys = menuTreeRef.value?.getCheckedKeys() || [];
    await assignRolePermsApi({
      roleId: currentRow.value.id,
      menuIds: checkedKeys,
    });
    ElMessage.success('权限分配成功');
    permsDialogVisible.value = false;
    getList();
  } catch (e) {
    console.error('分配权限失败:', e);
  } finally {
    permsSubmitting.value = false;
  }
};

const onPermsDialogClosed = () => {
  menuTree.value = [];
  selectedMenuIds.value = [];
};

// ==================== 分配数据权限 ====================
const dataScopeDialogVisible = ref(false);
const dataScopeSubmitting = ref(false);
const deptTree = ref([]);
const deptTreeRef = ref(null);
const dataScopeForm = reactive({
  dataScope: 1,
  deptIds: [],
});

const handleAssignDataScope = async (row) => {
  currentRow.value = row;
  dataScopeDialogVisible.value = true;
  dataScopeForm.dataScope = row.dataScope ?? 1;
  dataScopeForm.deptIds = [];

  try {
    const res = await getDeptTreeApi({});
    deptTree.value = Array.isArray(res) ? res : [];
  } catch (e) {
    console.error('加载部门树失败:', e);
  }
};

const handleDataScopeChange = () => {
  if (dataScopeForm.dataScope !== 2) {
    dataScopeForm.deptIds = [];
  }
};

const handleDeptCheck = () => {
  // 树形组件自动更新
};

const confirmAssignDataScope = async () => {
  if (!currentRow.value) return;
  dataScopeSubmitting.value = true;
  try {
    const deptIds =
      dataScopeForm.dataScope === 2 ? deptTreeRef.value?.getCheckedKeys() || [] : [];
    await updateDataScopeApi({
      roleId: currentRow.value.id,
      dataScope: dataScopeForm.dataScope,
      deptIds,
    });
    ElMessage.success('数据权限分配成功');
    dataScopeDialogVisible.value = false;
    getList();
  } catch (e) {
    console.error('分配数据权限失败:', e);
  } finally {
    dataScopeSubmitting.value = false;
  }
};

const onDataScopeDialogClosed = () => {
  deptTree.value = [];
  dataScopeForm.dataScope = 1;
  dataScopeForm.deptIds = [];
};

// ==================== 生命周期 ====================
onMounted(() => getList());
</script>

<style scoped>
.role-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card :deep(.el-card__body) {
  padding: 16px 16px 0;
}

.toolbar {
  margin-bottom: 12px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.perms-dialog-body {
  min-height: 200px;
  padding: 8px 0;
  max-height: 400px;
  overflow-y: auto;
}
</style>
