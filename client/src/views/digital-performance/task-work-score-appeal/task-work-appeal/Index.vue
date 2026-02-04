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

    <template #operate-bottom>
      <el-button type="primary" @click="handleAppeal">申诉</el-button>
    </template>
    <c-table
      export-file-name="资质信息"
      export-url="test/test"
      :search-query="searchQuery"
      :headers="tableHeader"
      :loading="loading"
      :table-options="{ data: tableData }"
      :border="true"
      :page-data="pageData"
      :show-index="true"
      :hide-excel="true"
      @page-change="handlePage"
    >
      <template #workOrderNo="scope">
        <el-link type="primary" @click="handleWorkOrderNo(scope.data.row)">
          {{ scope.data.row.workOrderNo }}</el-link
        >
      </template>
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
          <el-link type="primary" @click="handleDelete(scope.data.row)"
            >撤回</el-link
          >
        </el-space>
      </template>
    </c-table>

    <DetailViewDialog
      v-if="state.detail.visible"
      v-model="state.detail.visible"
      :data="state.detail.data"
      :title="state.detail.title"
      :group-config="state.detail.groupConfig"
      width="80%"
    ></DetailViewDialog>
    <AppealDialog
      v-if="state.appeal.visible"
      v-model="state.appeal.visible"
      :edit="state.appeal.edit"
      :title="state.appeal.title"
      :data="state.appeal.data"
      width="80%"
    ></AppealDialog>
    <WorkOrderNoDialog
      v-if="state.workOrderNo.visible"
      v-model="state.workOrderNo.visible"
      :title="state.workOrderNo.title"
      width="80%"
    ></WorkOrderNoDialog>
  </dh-fixed-header-table-frame>
</template>

<script setup lang="ts">
import { useAuthorityStore } from '@/stores/authority';
import { ElMessageBox } from 'element-plus';
import { ref, reactive, onMounted } from 'vue';
import { ValidityPeriod } from '@/configs/enums/qualification-info-management';
import AppealDialog from './components/appealDialog.vue';
import WorkOrderNoDialog from './components/workOrderNoDialog.vue';
import {
  tableHeader,
  getSearchConfig,
  type SearchQueryType,
  type TableRowData,
} from './index';

//= ========== 补充缺失类型定义 ===========
interface PageProp {
  pageNum?: number;
  pageSize?: number;
}

//= ========== 状态管理与权限获取 ===========
// 权限相关：获取当前组织信息
const useAuthority = useAuthorityStore();
const currentOrg = useAuthority.orgDto;

//= ========== 查询相关配置 ===========
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

//= ========== 表格与分页配置 ===========
// 表格加载状态
const loading = ref(false);

// 表格初始化数据（匹配修改后的TableRowData字段）
const tableData = ref<TableRowData[]>([
  {
    // 表格列对应字段（新小驼峰命名）
    workOrderNo: 'W20231010001',
    taskName: '设备巡检任务',
    appellant: '张三',
    appealDescription: '山高路远',
    relatedScene: '设备维护',
    workScore: '30',
    appealTime: '2023-10-09 18:00:00',
    auditStatus: '待审核',
    mgtOrgCode: '',
    validityPeriod: '3年',
    reviewReminderCycle: '6个月',
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

//= ========== 弹窗状态配置 ===========
const state = reactive({
  appeal: {
    visible: false,
    edit: false,
    data: {
      workOrderNo: '',
      taskName: '',
      appellant: '',
      appealDescription: '',
      relatedScene: '',
      workScore: '',
      appealTime: '',
      auditStatus: '',
      mgtOrgCode: '',
      validityPeriod: '',
      reviewReminderCycle: '',
      validityPeriodUnit: ValidityPeriod.年,
    },
    title: '申诉',
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
          // 匹配修改后的TableRowData字段，修正label与field对应关系
          { field: 'workOrderNo', label: '工单编号' },
          { field: 'taskName', label: '任务名称' },
          { field: 'appellant', label: '申诉人' },
          { field: 'appealDescription', label: '申诉说明' },
          { field: 'relatedScene', label: '关联场景' },
          { field: 'workScore', label: '工分' },
          { field: 'appealTime', label: '申诉时间' },
          { field: 'auditStatus', label: '审核状态' },
          { field: 'createTime', label: '创建时间' },
        ],
      },
    ],
  },
  workOrderNo: {
    visible: false,
    data: {},
    title: '工单详情',
  },
  selection: [],
});

//= ========== 业务逻辑函数 ===========
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

// 重置：恢复查询条件默认值并重新获取数据
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

// 编辑：赋值选中行数据并打开编辑弹窗
function handleEdit(editRowData: TableRowData) {
  state.appeal.visible = true;
  state.appeal.data = editRowData;
  state.appeal.edit = true;
}

// 删除：弹出确认框，确认后执行删除逻辑
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

// 查看：赋值选中行数据并打开查看弹窗
function openViewDialog(rowData: TableRowData) {
  state.detail.data = rowData;
  state.detail.visible = true;
}

// 申诉：打开申诉弹窗
function handleAppeal() {
  state.appeal.visible = true;
  state.appeal.edit = false;
}
// 查看工单详情
function handleWorkOrderNo(rowData: TableRowData) {
  state.workOrderNo.visible = true;
}

//= ========== 生命周期钩子 ===========
// 组件挂载后初始化表格数据
onMounted(() => {
  getTableData();
});
</script>

<style scoped lang="scss"></style>
