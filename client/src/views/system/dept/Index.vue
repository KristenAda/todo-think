<template>
  <div class="dept-container">
    <!-- 搜索区 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="部门名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入部门名称"
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
        <el-button type="primary" :icon="Plus" @click="handleAdd()">新增部门</el-button>
        <el-button @click="toggleExpandAll">
          {{ isExpandAll ? '折叠全部' : '展开全部' }}
        </el-button>
      </div>

      <el-table
        v-if="refreshTable"
        v-loading="loading"
        :data="tableData"
        row-key="id"
        :default-expand-all="isExpandAll"
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="部门名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="负责人" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.user?.nickname || row.leader || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.phone || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.email || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="人数" width="70" align="center">
          <template #default="{ row }">
            {{ row._count?.users || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-link type="primary" @click="handleAdd(row)">新增子部门</el-link>
            <el-divider direction="vertical" />
            <el-link type="primary" @click="handleEdit(row)">编辑</el-link>
            <el-divider direction="vertical" />
            <el-link type="danger" @click="handleDelete(row)">删除</el-link>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <Edit
      v-model="editVisible"
      :title="editTitle"
      :detail-data="currentData"
      :dept-tree="tableData"
      @success="getList"
    />
  </div>
</template>

<script setup>
import { Search, Refresh, Plus } from '@element-plus/icons-vue';
import { getDeptTreeApi, deleteDeptApi } from '@/apis/modules/system/dept';
import Edit from './components/Edit.vue';

// ==================== 搜索 & 列表 ====================
const searchForm = reactive({ name: '' });
const tableData = ref([]);
const loading = ref(false);
const refreshTable = ref(true);
const isExpandAll = ref(false);

const getList = async () => {
  loading.value = true;
  try {
    const res = await getDeptTreeApi(searchForm);
    tableData.value = Array.isArray(res) ? res : [];
  } catch (e) {
    console.error('获取部门树失败:', e);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => getList();
const resetSearch = () => {
  searchForm.name = '';
  getList();
};

const toggleExpandAll = () => {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
};

// ==================== 新增 / 编辑 ====================
const editVisible = ref(false);
const editTitle = ref('新增部门');
const currentData = ref(null);

const handleAdd = (row) => {
  editTitle.value = row ? `新增「${row.name}」的子部门` : '新增顶级部门';
  currentData.value = row ? { parentId: row.id } : null;
  editVisible.value = true;
};

const handleEdit = (row) => {
  editTitle.value = '编辑部门';
  currentData.value = row;
  editVisible.value = true;
};

// ==================== 删除 ====================
const handleDelete = (row) => {
  if (row.children && row.children.length > 0) {
    ElMessage.warning('存在子部门，请先删除子部门');
    return;
  }
  if (row._count?.users > 0) {
    ElMessage.warning('部门下还有员工，请先调动或删除员工');
    return;
  }
  ElMessageBox.confirm(`确认删除部门「${row.name}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
  })
    .then(async () => {
      await deleteDeptApi({ id: row.id });
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

// ==================== 生命周期 ====================
onMounted(() => getList());
</script>

<style scoped>
.dept-container {
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
</style>
