<template>
  <dh-fixed-header-table-frame>
    <template #search>
      <div class="common-title">
        <c-title name="查询条件"></c-title>
      </div>
      <c-search-panel
        v-model="searchQuery"
        :columns="searchConfig"
        @search="handleSearch"
        @reset="handleReset"
      >
      </c-search-panel>
    </template>
    <template #operate>
      <el-button
        icon="Upload"
        type="primary"
        link
        @click="state.import.visible = true"
        >导入资质信息</el-button
      >
    </template>
    <template #operate-bottom>
      <el-button type="primary" @click="handleAdd">新增</el-button>
      <el-button type="danger" :disabled="delDisabled">删除</el-button>
    </template>
    <c-table
      exportFileName="资质信息"
      exportUrl="test/test"
      :searchQuery="searchQuery"
      :headers="tableHeader"
      :loading="loading"
      :table-options="{ data: tableData }"
      :border="true"
      :page-data="pageData"
      :show-index="true"
      :hide-excel="true"
      :is-select="true"
      @page-change="handlePage"
      @select="handleSelectionChange"
    >
      <template #operation="scope">
        <el-space size="large">
          <el-link type="primary" @click="openViewDialog(scope.data.row)"
            >查看</el-link
          >
          <el-link type="primary" @click="handleEdit(scope.data.row)"
            >编辑</el-link
          >
          <el-link type="primary" @click="handleDelete(scope.data.row)"
            >删除</el-link
          >
        </el-space>
      </template>
    </c-table>
    <AddEditDialog
      v-if="state.addEdit.visible"
      v-model="state.addEdit.visible"
      :title="state.addEdit.title"
      :data="state.addEdit.data"
      width="80%"
    ></AddEditDialog>
    <DetailViewDialog
      v-if="state.detail.visible"
      v-model="state.detail.visible"
      :data="state.detail.data"
      :title="state.detail.title"
      :group-config="state.detail.groupConfig"
      width="80%"
    ></DetailViewDialog>
    <BatchImportDialog
      ref="batchImportDialogDialogRef"
      v-if="state.import.visible"
      @confirm="batchImportConfirm"
      :tableHeader="batchImportDialogTableHeader"
      v-model="state.import.visible"
      :title="state.import.title"
      width="80%"
    ></BatchImportDialog>
  </dh-fixed-header-table-frame>
</template>

<script setup lang="ts">
import { useAuthorityStore } from '@/stores/authority';
import { ElMessageBox } from 'element-plus';
import { ref, reactive, onMounted } from 'vue';
import { ValidityPeriod } from '@/configs/enums/qualification-info-management';
import AddEditDialog from './components/addEditDialog.vue';
import BatchImportDialog from '@/components/basic/BatchImportDialog.vue';
import {
  tableHeader,
  getSearchConfig,
  batchImportDialogTableHeader,
  type SearchQueryType,
  type TableRowData,
} from './index';

// 状态管理
// 权限相关：获取当前组织信息
const useAuthority = useAuthorityStore();
const currentOrg = useAuthority.orgDto;

// 查询条件
const searchQuery = reactive<SearchQueryType>({
  mgtOrgCode: currentOrg.mgtOrgCode,
  userId: '',
  userName: '',
  type: '',
  startTime: '',
  endTime: '',
  time: [],
});
// 搜索面板配置
const searchConfig = getSearchConfig(searchQuery);

// 表格加载状态
const loading = ref(false);
// 表格初始化数据
const tableData = ref<TableRowData[]>([
  {
    mgtOrgCode: '',
    qualificationName: '高压电工证',
    applicablePost: '变电运维岗',
    qualificationLevel: '高级',
    issuingAuthority: '国家能源局电力安全监管司',
    validityPeriod: '90',
    reviewReminderCycle: '30天',
    status: '启用',
    createTime: '2023-10-10 10:10:10',
    validityPeriodUnit: ValidityPeriod.年,
  },
]);

// 分页数据
const pageData = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
});

const state = reactive({
  addEdit: {
    visible: false,
    data: {
      mgtOrgCode: '',
      qualificationName: '',
      applicablePost: '',
      qualificationLevel: '',
      issuingAuthority: '',
      validityPeriod: '',
      reviewReminderCycle: '',
      status: '',
      validityPeriodUnit: ValidityPeriod.年,
    },
    title: '新增',
  },
  detail: {
    visible: false,
    data: {},
    title: '查看',
    groupConfig: [
      {
        title: '资质信息',
        column: 3,
        fields: [
          { field: 'qualificationName', label: '资质名称' },
          { field: 'applicablePost', label: '适用岗位' },
          { field: 'qualificationLevel', label: '资质等级' },
          { field: 'issuingAuthority', label: '颁发机构' },
          { field: 'validityPeriod', label: '有效期' },
          { field: 'reviewReminderCycle', label: '复审提醒周期' },
          { field: 'status', label: '状态' },
          { field: 'createTime', label: '资质等级' },
          { field: 'qualificationLevel', label: '创建时间' },
        ],
      },
    ],
  },
  import: {
    visible: false,
    title: '导入资质信息',
  },
  selection: [],
});

// 业务函数
// 获取表格数据：后续可补充接口请求逻辑
const getTableData = async () => {
  // 开启加载状态
  loading.value = true;
  try {
    // 补充接口请求逻辑
    // const res = await getQualificationList({
    //   ...searchQuery,
    //   pageSize: pageData.pageSize,
    //   pageNo: pageData.pageNo
    // });
    // tableData.value = res.data.list;
    // pageData.total = res.data.total;
  } catch (error) {
    console.error('获取数据失败：', error);
  } finally {
    // 关闭加载状态
    loading.value = false;
  }
};

// 搜索按钮触发：重新获取表格数据
const handleSearch = (val) => {
  pageData.pageNo = 1;
  getTableData();
};

// 重置
const handleReset = () => {
  pageData.pageNo = 1;
  pageData.pageSize = 10;
  Object.assign(searchQuery, {
    userId: '',
    userName: '',
    type: '',
    startTime: '',
    endTime: '',
    time: [],
  });
};

// 分页切换触发：更新分页参数并重新获取数据
const handlePage = (val: PageProp) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};

// 编辑

function handleEdit(editRowData: TableRowData) {
  state.addEdit.data = editRowData;
  state.addEdit.visible = true;
  state.addEdit.title = '编辑';
}
// 新增
function handleAdd() {
  state.addEdit.visible = true;
  state.addEdit.title = '新增';
}

// 删除
function handleDelete(delRowData: TableRowData) {
  ElMessageBox.confirm('是否删除?', '删除', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      // 确认删除：补充接口请求逻辑
      // await api.deleteQualification(delRowData.id);
      // getTableData(); // 重新获取数据
    })
    .catch(() => {
      // 取消删除：可补充提示逻辑
      // ElMessage.info('已取消删除');
    });
}

// 查看
function openViewDialog(rowData: TableRowData) {
  state.detail.data = rowData;
  state.detail.visible = true;
}

// 表格多选
const delDisabled = computed(() => {
  if (state.selection.length === 0) {
    return true;
  }
  return false;
});

function handleSelectionChange(selection: TableRowData[]) {
  state.selection = selection;
}

// 批量导入
let batchImportDialogDialogRef = ref();
function batchImportConfirm(value: any) {
  batchImportDialogDialogRef.value.close();
  console.log('确认批量添加', value);
}

// 生命周期：组件挂载后初始化表格数据
onMounted(() => {
  getTableData();
});
</script>

<style scoped lang="scss"></style>
