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
      <el-button type="primary" @click="handleWorkScoreAdjustment"
        >调整工分</el-button
      >
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
      <template #operation="scope">
        <el-space size="large">
          <el-link
            type="primary"
            @click="handleAdjustmentRecord(scope.data.row)"
            >调整记录</el-link
          >
          <el-link type="primary" @click="handleEdit(scope.data.row)"
            >编辑</el-link
          >
        </el-space>
      </template>
    </c-table>

    <WorkScoreAdjustmentDialog
      v-if="state.adjustWorkPoints.visible"
      v-model="state.adjustWorkPoints.visible"
      :title="state.adjustWorkPoints.title"
      :data="state.adjustWorkPoints.data"
      :show-basic-form="state.adjustWorkPoints.showBasicForm"
      :basic-form-disabled="state.adjustWorkPoints.basicFormDisabled"
      :show-extra-form="state.adjustWorkPoints.showExtraForm"
      :extra-form-disabled="state.adjustWorkPoints.extraFormDisabled"
      :show-adjust-table="state.adjustWorkPoints.showAdjustTable"
      :show-adjust-history="state.adjustWorkPoints.showAdjustHistory"
      width="80%"
    ></WorkScoreAdjustmentDialog>
    <DetailViewDialog
      v-if="state.detail.visible"
      v-model="state.detail.visible"
      :data="state.detail.data"
      :title="state.detail.title"
      :group-config="state.detail.groupConfig"
      width="80%"
    ></DetailViewDialog>
  </dh-fixed-header-table-frame>
</template>

<script setup lang="ts">
import { useAuthorityStore } from '@/stores/authority';
import { ref, reactive, onMounted } from 'vue';
import WorkScoreAdjustmentDialog from './components/workScoreAdjustmentDialog.vue';
import {
  tableHeader,
  getSearchConfig,
  type SearchQueryType,
  type TableRowData,
} from './index';

// 补充分页类型定义
interface PageProp {
  pageNum?: number;
  pageSize?: number;
}

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
const searchConfig = getSearchConfig();

// 表格加载状态
const loading = ref(false);
// 表格初始化数据
const tableData = ref<TableRowData[]>([
  {
    mgtOrgCode: '',
    yearMonth: '2023-10',
    teamType: '技术部',
    teamName: '2班',
    userName: '张三',
    position: '山高路远',
    post: '其他',
    currentMonthTotalScore: '30',
    totalExtraBonus: '0',
    totalExtraDeduction: '0',
    actualCurrentMonthTotalScore: '30',
    latestAdjustment: '2023-10-10 10:10:10',
  },
]);

// 分页数据
const pageData = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
});

const state = reactive({
  // 统一管理 WorkScoreAdjustmentDialog 弹窗状态（替换原 addEdit）
  adjustWorkPoints: {
    visible: false,
    title: '',
    data: {} as TableRowData,
    // 表单/表格控制属性
    showBasicForm: true,
    basicFormDisabled: true,
    showExtraForm: false,
    extraFormDisabled: false,
    showAdjustTable: false,
    showAdjustHistory: false,
    nameInput: true,
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
          { field: 'yearMonth', label: '年月' },
          { field: 'teamType', label: '班组类型' },
          { field: 'teamName', label: '班组名称' },
          { field: 'userName', label: '姓名' },
          { field: 'position', label: '职务' },
          { field: 'post', label: '岗位' },
          { field: 'currentMonthTotalScore', label: '当月总分' },
          { field: 'totalExtraBonus', label: '额外加分（总）' },
          { field: 'totalExtraDeduction', label: '额外减分（总）' },
          { field: 'actualCurrentMonthTotalScore', label: '实际当月总分' },
          { field: 'latestAdjustment', label: '最新调整' },
        ],
      },
    ],
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

// 调整记录：显示 基本信息（禁用） + 当月调整历史（表格+标题）
function handleAdjustmentRecord(rowData: TableRowData) {
  Object.assign(state.adjustWorkPoints, {
    visible: true,
    title: '调整记录',
    data: rowData,
    showBasicForm: true,
    basicFormDisabled: true,
    showExtraForm: false,
    showAdjustTable: true,
    showAdjustHistory: true,
  });
}

// 编辑：显示 基本信息（禁用） + 额外加减分 + 当月调整历史（表格+标题）
function handleEdit(rowData: TableRowData) {
  Object.assign(state.adjustWorkPoints, {
    visible: true,
    title: '编辑',
    data: rowData,
    showBasicForm: true,
    basicFormDisabled: true,
    showExtraForm: true,
    showAdjustTable: true,
    showAdjustHistory: true,
  });
}

// 调整工分：显示 基本信息（禁用） + 额外加减分，隐藏调整历史
function handleWorkScoreAdjustment() {
  // 若需要传递默认空数据，可替换为 {} 或默认初始化数据
  const defaultData = {} as TableRowData;
  Object.assign(state.adjustWorkPoints, {
    visible: true,
    title: '调整工分',
    data: defaultData,
    showBasicForm: true,
    basicFormDisabled: true,
    showExtraForm: true,
    showAdjustTable: false,
    showAdjustHistory: false,
    nameInput: false,
  });
}

// 生命周期：组件挂载后初始化表格数据
onMounted(() => {
  getTableData();
});
</script>

<style scoped lang="scss"></style>
