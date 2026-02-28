<template>
  <div class="menu-container">
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="菜单名称">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入菜单名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查 询</el-button>
          <el-button @click="resetSearch">重 置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div class="mb-4">
        <el-button type="primary" @click="handleAdd()">新增菜单</el-button>
        <el-button @click="toggleExpandAll">展开/折叠</el-button>
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
        <el-table-column
          prop="title"
          label="菜单名称"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <i v-if="row.icon" :class="row.icon"></i>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1" type="primary">目录</el-tag>
            <el-tag v-else-if="row.type === 2" type="success">菜单</el-tag>
            <el-tag v-else-if="row.type === 3" type="info">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column
          prop="path"
          label="路由地址"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="component"
          label="组件路径"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="perms"
          label="权限标识"
          min-width="150"
          show-overflow-tooltip
        />

        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.type === 1 || row.type === 2"
              type="primary"
              link
              @click="handleAdd(row)"
              >新增</el-button
            >
            <el-button type="primary" link @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button type="danger" link @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMenuListApi, deleteMenuApi } from '@/apis/modules/system/menu';
import Edit from './components/Edit.vue';

const searchForm = reactive({ title: '' });
const tableData = ref([]);
const loading = ref(false);
const refreshTable = ref(true);
const isExpandAll = ref(false);

const editVisible = ref(false);
const editTitle = ref('新增菜单');
const currentData = ref(null);

const getList = async () => {
  loading.value = true;
  try {
    const res = await getMenuListApi(searchForm);
    tableData.value = res.list || res.data || [];
  } catch (error) {
    console.error('获取菜单失败:', error);
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

const handleAdd = (row) => {
  editTitle.value = row ? `新增 [${row.title}] 的下级菜单` : '新增顶级菜单';
  currentData.value = row ? { parentId: row.id, type: row.type + 1 } : null;
  editVisible.value = true;
};

const handleEdit = (row) => {
  editTitle.value = '编辑菜单';
  currentData.value = row;
  editVisible.value = true;
};

const handleDelete = (row) => {
  if (row.children && row.children.length > 0) {
    ElMessage.warning('包含下级节点，无法直接删除');
    return;
  }
  ElMessageBox.confirm(`确认删除菜单 [${row.title}] 吗？`, '警告', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  })
    .then(async () => {
      await deleteMenuApi({ id: row.id });
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

onMounted(() => getList());
</script>
<style scoped>
.menu-container {
  padding: 20px;
}
.mb-4 {
  margin-bottom: 16px;
}
</style>
