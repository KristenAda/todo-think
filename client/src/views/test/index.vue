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
        <!-- <template #rating>
          <el-rate v-model="searchQuery.rating" text-color="#ff9900" />
          <span style="font-size: 12px; color: #999"></span>
        </template> -->
      </c-search-panel>
    </template>
    <template #operate>
      <el-button type="primary" @click="handleEditPop">新增</el-button>
      <el-button type="danger" @click="handleDelete">删除</el-button>
    </template>
    <!-- <searchForm2 v-model:filter="formInline" @reset="resetSearch" @search="handleSearch"></searchForm2> -->
    <div style="height: 300px">
      <c-table
        :headers="tableHeader"
        :loading="loading"
        :table-options="{ data: tableData }"
        :border="false"
        :page-data="pageData"
        :show-index="true"
        :hide-excel="true"
        :is-select="true"
        @page-change="handlePage"
      >
      </c-table>
    </div>
    <EditPop
      v-if="state.edit.visible"
      v-model="state.edit.visible"
      :title="state.edit.title"
      width="900px"
    >
    </EditPop>

  </dh-fixed-header-table-frame>
</template>

<script setup lang="ts">
import { useAuthorityStore } from '@/stores/authority';
// import searchForm from './components/searchForm.vue';

// import searchForm2 from './components/searchForm2.vue';

const useAuthority = useAuthorityStore();
const userInfo = useAuthority.loginInfo;
const currentOrg = useAuthority.orgDto;

const formInline = reactive({
  mgtOrgCode: currentOrg.mgtOrgCode,
  mgtOrgCodes: [currentOrg.mgtOrgCode],
  user: '',
  moduleType: '02',
  createBy: userInfo.systemUserId,
  reportTimeType: '00',
});
const editRowData = ref({})
const state = reactive({
  edit: {
    visible: false,
    data: {},
    title: '新增数据集',
  },
    
});

const searchQuery = reactive({
  mgtOrgCode: currentOrg.mgtOrgCode,
  userId: '',
  userName: '',
  type: '',
  startTime: '',
  endTime: '',
  time: [],
});

const searchConfig = [
  /** :is-radio="false"
              :form-prop="false" */
  {
    label: '供电单位',
    prop: 'mgtOrgCode',
    type: 'choose-unit', // 这里调用你的自定义组件
    props: {
      isRadio: true,
    
      formProp: false,
    },
    events: {
      getCode: (val) => {
        console.log('val :>> ', val);
        searchQuery.mgtOrgCode = val;
      },
    },
  },
  {
    label: '选择用户',
    prop: 'userId',
    type: 'choose-user', // 这里调用你的自定义组件
    props: {
      isRadio: false,
      formProp: false,
    },
    events: {
      getInfo: (val) => {
        console.log('val2 :>> ', val);
        searchQuery.userId = val;
      },
    },
  },
  {
    label: '用户名',
    prop: 'userName',
    type: 'input',
    props: { placeholder: '请输入单号/手机号' },
  },
  {
    label: '类型',
    prop: 'type',
    type: 'select',
    options: [
      { label: '待支付', value: 1 },
      { label: '已完成', value: 2 },
    ],
  },
  {
    label: '时间',
    prop: 'time',
    type: 'date',
    props: {
      type: 'daterange',
      startPlaceholder: '开始时间',
      endPlaceholder: '结束时间',
    },
    events: {
      change: (val) => {
        if (val) {
          searchQuery.startTime = val[0] || '';
          searchQuery.endTime = val[1] || '';
        } else {
          searchQuery.startTime = '';
          searchQuery.endTime = '';
        }
      },
    },
  },
];

const tableHeader = [
  {
    prop: 'createTime',
    label: '创建时间',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'moduleType',
    label: '报告类别',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'reportTimeType',
    label: '报告时间类型',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'reportStatus',
    label: '报告状态',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'caozuo',
    label: '操作',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];
const loading = ref(false);
const tableData: any = ref([
  {
    createTime: '2023-10-10 10:10:10',
    moduleType: '月报',
    reportTimeType: '月报',
    reportStatus: '已完成',
    caozuo: '查看',
  },
]);
const getTableData = async () => {
  const { time, ...rest } = searchQuery;
  const data = {
    ...rest,
    pageNo: pageData.pageNo,
    pageSize: pageData.pageSize,
  };
  console.log('data :>> ', data);
};

// 分页数据
const pageData = reactive({ pageSize: 10, pageNo: 1, total: 0 });

const handleSearch = (val) => {
  console.log('searchQuery :>> ', searchQuery, 'val :>> ', val);
  getTableData();
};
const handleReset = () => {
  pageData.pageNo = 1;
  pageData.pageSize = 10;
  console.log('searchQuery :>> ', searchQuery);
};
const handleEditPop = () => {
    editRowData.value={}
  state.edit.visible = true;
};
const handleEdit=(val)=>{
    editRowData.value=val
    state.edit.visible = true;
}
interface pageProp {
  pageSize: number;
  pageNum: number;
}
// 分页器数据变化
const handlePage = (val: pageProp) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};

onMounted(() => {
  getTableData();
});
const handleDelete = () => {};
</script>

<style scoped lang="scss">
.echart-container {
  width: 100%;
  height: 300px;

  .echart-box {
    width: 100%;
    height: 100%;

    .echart {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
