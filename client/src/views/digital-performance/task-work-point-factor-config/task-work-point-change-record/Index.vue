<template>
  <dh-fixed-header-table-frame>
    <template #search>
      <div class="common-title">
        <c-title name="查询条件" />
      </div>
      <div class="custom-radio-wrapper">
        <el-form-item
          label="业务模块"
          label-width="100"
          label-position="right"
          prop="businessType"
        >
          <el-radio-group
            v-model="searchQuery.businessType"
            @change="handleTabChange"
          >
            <el-radio-button :label="HistoryBusinessType.因子管理">
              <el-icon class="mr-1"><List /></el-icon> 因子管理
            </el-radio-button>
            <el-radio-button :label="HistoryBusinessType.工分标准管理">
              <el-icon class="mr-1"><TrendCharts /></el-icon> 工分标准管理
            </el-radio-button>
            <el-radio-button :label="HistoryBusinessType.任务因子绑定">
              <el-icon class="mr-1"><Connection /></el-icon> 任务因子绑定
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </div>
      <c-search-panel
        v-model="searchQuery"
        :columns="state.searchConfig"
        @search="handleSearch"
      />
    </template>

    <c-table
      :headers="tableHeader"
      :loading="loading"
      :table-options="{ data: tableData }"
      :search-query="searchQuery"
      export-file-name="修改记录"
      export-url="/member/factorlog/export"
      border
      row-key="id"
      :default-sort="{ prop: 'createTime', order: 'descending' }"
      :page-data="pageData"
      :show-index="true"
      @page-change="handlePage"
      @sort-change="handleSortChange"
    >
      <template #changeBefore="scope">
        <div class="content-cell">{{ scope.data.row.changeBefore || '-' }}</div>
      </template>
      <template #changeAfter="scope">
        <div class="content-cell">{{ scope.data.row.changeAfter || '-' }}</div>
      </template>
    </c-table>
  </dh-fixed-header-table-frame>
</template>

<script setup lang="ts">
import { List, TrendCharts, Connection } from '@element-plus/icons-vue';
import {
  getHistoryLogList,
  type HistoryLogQueryParams,
  type HistoryLogVO,
} from '@/apis/modules/digital-performance/task-work-point-factor-config/task-work-point-change-record';
import { HistoryBusinessType } from '@/configs/enums/digital-performance';
import { SUCCESS_CODE } from '@/configs/const/basic';
import { formatDateTime } from '@/utils/common/date-util';

const loading = ref(false);
const tableData = ref<HistoryLogVO[]>([]);

const pageData = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
  sortType: 'descending',
  sortField: 'createTime',
});

const searchQuery = reactive({
  businessType: HistoryBusinessType.因子管理,
  keyword: '',
  updateTimeRange: [],
});

const state = reactive({
  searchConfig: [
    {
      label: '修改人',
      prop: 'keyword',
      type: 'input',
      props: { placeholder: '搜索修改人', clearable: true },
    },
    {
      label: '修改时间',
      prop: 'updateTimeRange',
      type: 'date',
      props: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
    },
  ],
});

/** 修正表格头配置：对接 changeBefore, changeAfter, createUserName, createTime */
const tableHeader = [
  {
    prop: 'changeBefore',
    label: '修改前',
    'min-width': 200,

    slot: 'changeBefore',
  },
  {
    prop: 'changeAfter',
    label: '修改后',
    'min-width': 200,
    slot: 'changeAfter',
  },
  { prop: 'createUserName', label: '修改人', width: 150, align: 'center' },
  {
    prop: 'createTime',
    label: '修改时间',
    sortable: true,
    width: 200,
    align: 'center',
    formatter: (row) => {
      return row.createTime ? formatDateTime(row.createTime) : '-';
    },
  },
];

const getTableData = async () => {
  loading.value = true;

  // 映射前端 state 到后端定义的字段名
  const params: HistoryLogQueryParams = {
    pageNum: pageData.pageNo,
    pageSize: pageData.pageSize,
    logType: searchQuery.businessType,
    createUserName: searchQuery.keyword,
    beginTime: searchQuery.updateTimeRange?.[0] || '',
    endTime: searchQuery.updateTimeRange?.[1] || '',
    sortType: pageData.sortType,
    sortField: pageData.sortField,
  };

  try {
    const res = await getHistoryLogList(params);
    if (res.code === SUCCESS_CODE) {
      tableData.value = res.records || res.data?.records || [];
      pageData.total = res.total || res.data?.total || 0;
    }
  } catch (error) {
    console.error('Fetch error:', error);
  } finally {
    loading.value = false;
  }
};

const handleSortChange = (data) => {
  pageData.sortField = data.prop;
  pageData.sortType = data.order;
  handleSearch();
};

const handleTabChange = () => {
  pageData.pageNo = 1;
  getTableData();
};

const handleSearch = () => {
  pageData.pageNo = 1;
  getTableData();
};

const handlePage = (val: any) => {
  if (val.pageNum) pageData.pageNo = val.pageNum;
  if (val.pageSize) pageData.pageSize = val.pageSize;
  getTableData();
};

onMounted(() => {
  getTableData();
});
</script>
<style lang="scss" scoped>
.custom-radio-wrapper {
  .el-form-item {
    margin-bottom: 8px;
  }
}

:deep(.content-cell) {
  white-space: pre-wrap;
}
</style>
