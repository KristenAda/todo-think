<template>
  <EchartsCard
    :title="state.title"
    :form-data="state.formData"
    :form-schema="state.formSchema"
  >
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
          <el-link type="primary" @click="handleDetail(scope.data.row)"
            >明细</el-link
          >
        </el-space>
      </template>
    </c-table>
    <StaffWorkScoreDetailDailog
      v-if="state.detail.visible"
      v-model="state.detail.visible"
      :title="state.detail.title"
      :data="state.detail.data"
    ></StaffWorkScoreDetailDailog>
  </EchartsCard>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import EchartsCard from './echartsCard.vue';
import StaffWorkScoreDetailDailog from './staffWorkScoreDetailDailog.vue';

interface PageProp {
  pageNum?: number;
  pageSize?: number;
}

interface TableRowData {
  ranking: string | number;
  userName: string;
  teamName: string;
  position: string;
  actualMonthlyScore: string;
  comparedWithLastMonth: string;
}

const state = reactive({
  title: '员工工分排行榜',
  formData: {
    teamType: '',
    name: '',
  },
  formSchema: [
    {
      prop: 'teamType',
      label: '班组类型',
      type: 'select',
      options: [{ label: '全部', value: 1 }],
    },
    {
      prop: 'name',
      label: '姓名',
      type: 'input',
    },
  ],
  detail: {
    visible: false,
    data: {},
    title: '明细',
  },
});

const searchQuery = reactive<{ teamType: string; name: string }>({
  teamType: '',
  name: '',
});

const loading = ref(false);

const pageData = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
});

const tableData = ref<TableRowData[]>([
  {
    ranking: 1,
    userName: '张三',
    teamName: '技术部 2班',
    position: '工程师',
    actualMonthlyScore: '30',
    comparedWithLastMonth: '+5',
  },
  {
    ranking: 1,
    userName: '张三',
    teamName: '技术部 2班',
    position: '工程师',
    actualMonthlyScore: '30',
    comparedWithLastMonth: '+5',
  },
]);

const tableHeader = [
  {
    prop: 'ranking',
    label: '名次',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'userName',
    label: '姓名',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'teamName',
    label: '班组',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'position',
    label: '职务',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'actualMonthlyScore',
    label: '实际月工分',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'comparedWithLastMonth',
    label: '较上月',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'operation',
    label: '操作',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];

const handlePage = (val: PageProp) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};

const handleDetail = (row: TableRowData) => {
  state.detail.visible = true;
  state.detail.data = row;
};

const getTableData = async () => {
  loading.value = true;

  try {
    console.log(1);
  } catch (error) {
    console.error('获取数据失败：', error);
  } finally {
    loading.value = false;
  }
};
</script>
<style lang="scss" scoped>
.ctable-wrapper {
  margin-top: 50px;
  height: calc(100% - 30px);
}
</style>
