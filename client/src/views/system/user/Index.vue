<template>
  <div class="user-container">
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="部门ID">
          <el-input
            v-model="searchForm.deptId"
            placeholder="请输入部门ID"
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
        <el-button type="primary" @click="handleAdd">新增用户</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="deptId" label="部门ID" min-width="120" />

        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button type="success" link @click="handleAssignRoles(row)"
              >分配角色</el-button
            >
            <el-button
              type="danger"
              link
              :disabled="row.id === 1"
              @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <Edit
      v-model="editVisible"
      :title="editTitle"
      :detail-data="currentData"
      @success="getList"
    />
  </div>
</template>

<script setup>
// 【重点修改】不使用统一导出，直接从特定的 api 文件中引入需要的接口函数
import { getUserListApi, deleteUserApi } from '@/apis/modules/system/user';
import Edit from './components/Edit.vue';

// #region 变量/常量
const searchForm = reactive({
  username: '',
  deptId: '',
});

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 编辑弹窗相关
const editVisible = ref(false);
const editTitle = ref('新增用户');
const currentData = ref(null);
// #endregion

// #region 业务方法
/** 获取用户列表 */
const getList = async () => {
  loading.value = true;
  try {
    // 【重点修改】使用引入的 API 函数
    const res = await getUserListApi({
      page: page.value,
      pageSize: pageSize.value,
      username: searchForm.username || undefined,
      deptId: searchForm.deptId ? Number(searchForm.deptId) : undefined,
    });
    // 请根据项目实际的拦截器返回结构调整 res.data 或 res
    tableData.value = res.data?.list || res.list || [];
    total.value = res.data?.total || res.total || 0;
  } catch (error) {
    console.error('获取列表失败:', error);
  } finally {
    loading.value = false;
  }
};

/** 搜索 */
const handleSearch = () => {
  page.value = 1;
  getList();
};

/** 重置 */
const resetSearch = () => {
  searchForm.username = '';
  searchForm.deptId = '';
  handleSearch();
};

/** 新增用户 */
const handleAdd = () => {
  editTitle.value = '新增用户';
  currentData.value = null;
  editVisible.value = true;
};

/** 编辑用户 */
const handleEdit = (row) => {
  editTitle.value = '编辑用户';
  currentData.value = row;
  editVisible.value = true;
};

/** 分配角色 */
const handleAssignRoles = (row) => {
  ElMessage.info(`开发中: 分配角色给 [${row.username}] (ID: ${row.id})`);
};

/** 删除用户 */
const handleDelete = (row) => {
  if (row.id === 1) {
    ElMessage.warning('超级管理员无法删除');
    return;
  }
  ElMessageBox.confirm(`确认删除用户 [${row.username}] 吗？`, '警告', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  })
    .then(async () => {
      try {
        // 【重点修改】使用引入的 API 函数
        await deleteUserApi({ id: row.id });
        ElMessage.success('删除成功');
        getList();
      } catch (error) {
        console.error('删除失败:', error);
      }
    })
    .catch(() => {});
};
// #endregion

// #region 生命周期
onMounted(() => {
  getList();
});
// #endregion
</script>

<style scoped>
.user-container {
  padding: 20px;
}
.mb-4 {
  margin-bottom: 16px;
}
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
