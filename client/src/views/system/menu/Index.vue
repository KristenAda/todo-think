<template>
  <div class="menu-container">
    <!-- 搜索区 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="菜单名称">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入菜单名称"
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
        <el-button type="primary" :icon="Plus" @click="handleAdd()">新增菜单</el-button>
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
        <el-table-column prop="title" label="菜单名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="图标" width="70" align="center">
          <template #default="{ row }">
            <i v-if="row.icon" :class="row.icon" />
            <span v-else class="text-placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1" type="primary" size="small">目录</el-tag>
            <el-tag v-else-if="row.type === 2" type="success" size="small">菜单</el-tag>
            <el-tag v-else-if="row.type === 3" type="info" size="small">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column prop="path" label="路由地址" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.path || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="component" label="组件路径" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.component || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="perms" label="权限标识" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.perms || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-link
              v-if="row.type === 1 || row.type === 2"
              type="primary"
              @click="handleAdd(row)"
            >新增</el-link>
            <el-divider v-if="row.type === 1 || row.type === 2" direction="vertical" />
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
      :menu-tree="tableData"
      @success="getList"
    />
  </div>
</template>

<script setup>
import { Search, Refresh, Plus } from '@element-plus/icons-vue';
import { getMenuListApi, deleteMenuApi } from '@/apis/modules/system/menu';
import Edit from './components/Edit.vue';

// ==================== 搜索 & 列表 ====================
const searchForm = reactive({ title: '' });
const tableData = ref([]);
const loading = ref(false);
const refreshTable = ref(true);
const isExpandAll = ref(false);

const getList = async () => {
  loading.value = true;
  try {
    const res = await getMenuListApi(searchForm);
    // axios 拦截器已解包 data.data，res 本身就是树数组
    tableData.value = Array.isArray(res) ? res : [];
  } catch (e) {
    console.error('获取菜单失败:', e);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => getList();
const resetSearch = () => {
  searchForm.title = '';
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
const editTitle = ref('新增菜单');
const currentData = ref(null);

const handleAdd = (row) => {
  editTitle.value = row ? `新增「${row.title}」的子菜单` : '新增顶级菜单';
  currentData.value = row ? { parentId: row.id, type: Math.min(row.type + 1, 3) } : null;
  editVisible.value = true;
};

const handleEdit = (row) => {
  editTitle.value = '编辑菜单';
  currentData.value = row;
  editVisible.value = true;
};

// ==================== 删除 ====================
const handleDelete = (row) => {
  if (row.children && row.children.length > 0) {
    ElMessage.warning('存在子菜单，请先删除子菜单');
    return;
  }
  ElMessageBox.confirm(`确认删除菜单「${row.title}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
  })
    .then(async () => {
      await deleteMenuApi({ id: row.id });
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

// ==================== 生命周期 ====================
onMounted(() => getList());
</script>

<style scoped>
.menu-container {
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

.text-placeholder {
  color: #c0c4cc;
  font-size: 12px;
}
</style>
