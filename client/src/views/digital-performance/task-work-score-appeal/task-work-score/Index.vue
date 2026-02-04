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
          <el-link type="primary" @click="handleScore(scope.data.row)"
            >审核</el-link
          >
          <el-link type="primary" @click="openViewDialog(scope.data.row)"
            >查看</el-link
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
    <ScoreDialog
      v-if="state.score.visible"
      v-model="state.score.visible"
      :title="state.score.title"
      :data="state.score.data"
      width="80%"
    ></ScoreDialog>
  </dh-fixed-header-table-frame>
</template>

<script setup lang="ts">
import { useAuthorityStore } from '@/stores/authority';
import { ref, reactive, onMounted } from 'vue';
import { ValidityPeriod } from '@/configs/enums/qualification-info-management';
import ScoreDialog from './components/scoreDialog.vue';
import {
  tableHeader,
  getSearchConfig,
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
    workOrderNo: 'W20231010001',
    taskName: '设备巡检任务',
    appellant: '张三',
    teamType: '技术班组',
    teamName: '2班',
    position: '电工',
    jobPost: '设备维护岗',
    workScore: '30',
    appealTime: '2023-10-09 18:00:00',
    auditStatus: '待审核',
    operation: '',
  },
]);

// 分页数据
const pageData = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
});

const state = reactive({
  score: {
    visible: false,
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
    title: '审核',
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
          { field: 'workOrderNo', label: '工单编号' },
          { field: 'taskName', label: '任务名称' },
          { field: 'appellant', label: '申诉人' },
          { field: 'teamType', label: '班组类型' },
          { field: 'teamName', label: '班组名称' },
          { field: 'position', label: '职务' },
          { field: 'jobPost', label: '岗位' },
          { field: 'workScore', label: '工分' },
          { field: 'auditStatus', label: '审核状态' },
          { field: 'appealTime', label: '申诉时间' },
          { field: 'createTime', label: '创建时间' },
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
const handleSearch = (val: SearchQueryType) => {
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
// eslint-disable-next-line no-undef
const handlePage = (val: PageProp) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};

// 查看
function openViewDialog(rowData: TableRowData) {
  state.detail.data = rowData;
  state.detail.visible = true;
}

// 查看
function handleScore(rowData: TableRowData) {
  state.score.visible = true;
}

// 生命周期：组件挂载后初始化表格数据
onMounted(() => {
  getTableData();
});
</script>

<style scoped lang="scss"></style>
