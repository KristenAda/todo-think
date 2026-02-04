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
      >
        <template #rating>
          <el-rate v-model="searchQuery.rating" text-color="#ff9900" />
          <span style="font-size: 12px; color: #999"></span>
        </template>
      </c-search-panel>
      <!-- <searchForm
        v-model="formInline"
        @search="startSearch"
        @start="startSearch"
        @reset="onReset"
        @confirm="onSubmit"
      ></searchForm> -->
    </template>
    <template #operate>
      <el-button type="primary" plain icon="plus" @click="handleEditPop"
        >新增</el-button
      >
    </template>
    <!-- <searchForm2 v-model:filter="formInline" @reset="resetSearch" @search="handleSearch"></searchForm2> -->
    <c-table
      :headers="tableHeader"
      :loading="loading"
      :table-options="{ data: tableData }"
      border
      :page-data="pageData"
      :show-index="true"
      show-excel
      @download-file="handleDownloadFile"
      @page-change="handlePage"
    >
      <template #caozuo="scope">
        <el-space>
          <el-link type="primary" @click="handleDetail(scope.data)"
            >详情</el-link
          >
        </el-space>
      </template>
    </c-table>
    <EditPop
      v-if="state.edit.visible"
      v-model="state.edit.visible"
      :title="state.edit.title"
      width="900px"
    ></EditPop>
  </dh-fixed-header-table-frame>
</template>

<script setup lang="ts">
import { useAuthorityStore } from '@/stores/authority';
// import searchForm from './components/searchForm.vue';
import { getEnumEntriesForElementUI } from '@/utils/common/enum-util';
import { IsOrNot } from '@/configs/enums/commons';
import {
  downloadExcelAsBase64Txt,
  downloadViaBase64ToBlob,
} from '@/utils/common/down-util';
import EditPop from './components/Dialog.vue';
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

const state = reactive({
  edit: {
    visible: false,
    data: {},
    title: '新增数据集',
  },
});

const statusList: any = getEnumEntriesForElementUI(IsOrNot);
console.log(statusList);
statusList.unshift({ label: '全部', value: '' });

const searchQuery = reactive({
  keyword: '',
  status: '',
  userId: '',
  unitId: '',
  company: '',
  rating: 0,
});

const searchConfig = [
  /** :is-radio="false"
            :form-prop="false" */
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
    label: '选择单位',
    prop: 'unitId',
    type: 'choose-unit', // 这里调用你的自定义组件
    props: {
      showCurrentUnit: true,
      isRadio: false,
      isChild: false,
    },
    events: {
      getCode: (val) => {
        console.log('val :>> ', val);
        searchQuery.unitId = val;
      },
      start: () => {
        startSearch();
      },
    },
  },
  {
    label: '关键词',
    prop: 'keyword',
    type: 'input',
    props: { placeholder: '请输入单号/手机号' },
  },
  {
    label: '公司',
    prop: 'company',
    type: 'input',
    props: { placeholder: '请输入公司名称' },
  },
  {
    label: '订单状态',
    prop: 'status',
    type: 'select',
    options: [
      { label: '待支付', value: 1 },
      { label: '已完成', value: 2 },
    ],
  },
  /** :show-current-unit="true"
            :is-radio="false"
            :is-child="false"
            @get-code="getCode"
            @start="startSearch" */

  {
    label: '评分',
    prop: 'rating',
    type: 'slot', // 标记使用插槽
  },
];

const tableHeader = [
  {
    prop: 'createTime',
    label: '创建时间',
    'show-overflow-tooltip': true,
    align: 'center',
    width: 180,
  },
  {
    prop: 'moduleType',
    label: '报告类别',
    'show-overflow-tooltip': true,
    align: 'center',
    width: 180,
  },
  {
    prop: 'moduleType',
    label: '报告类别',
    'show-overflow-tooltip': true,
    align: 'center',
    width: 180,
  },
  {
    prop: 'moduleType',
    label: '报告类别',
    'show-overflow-tooltip': true,
    width: 180,
    align: 'center',
  },
  {
    prop: 'moduleType',
    label: '报告类别',
    'show-overflow-tooltip': true,
    align: 'center',
    width: 380,
  },
  {
    prop: 'moduleType',
    label: '报告类别',
    'show-overflow-tooltip': true,
    align: 'center',
    width: 180,
  },
  {
    prop: 'reportTimeType',
    label: '报告时间类型',
    'show-overflow-tooltip': true,
    align: 'center',
    width: 180,
  },
  {
    prop: 'reportStatus',
    label: '报告状态',
    'show-overflow-tooltip': true,
    align: 'center',
    width: 180,
  },
  {
    prop: 'reportStatus',
    label: '报告状态',
    'show-overflow-tooltip': true,
    align: 'center',
    width: 180,
  },
  {
    prop: 'reportStatus',
    label: '报告状态',
    'show-overflow-tooltip': true,
    align: 'center',
    width: 180,
  },
  {
    prop: 'reportStatus',
    label: '报告状态',
    'show-overflow-tooltip': true,
    width: 180,
    align: 'center',
  },
  {
    prop: 'caozuo',
    label: '操作',
    'show-overflow-tooltip': true,
    align: 'center',
    fixed: 'right',
    'min-width': 120,
  },
];
const loading = ref(false);
const tableData: any = ref([]);
const getTableData = async () => {
  tableData.value = [
    {
      createTime: '2023-10-01 09:30:00',
      moduleType: '销售分析报告',
      reportTimeType: '日报',
      reportStatus: '已发布',
      caozuo: '',
    },
    {
      createTime: '2023-10-02 10:15:22',
      moduleType: '库存周转报告',
      reportTimeType: '周报',
      reportStatus: '草稿',
      caozuo: '',
    },
    {
      createTime: '2023-10-03 14:00:10',
      moduleType: '财务月结报告',
      reportTimeType: '月报',
      reportStatus: '审批中',
      caozuo: '',
    },
    {
      createTime: '2023-10-04 16:45:00',
      moduleType: '客户满意度调查',
      reportTimeType: '季报',
      reportStatus: '已发布',
      caozuo: '',
    },
    {
      createTime: '2023-10-05 08:20:15',
      moduleType: '人力资源盘点',
      reportTimeType: '年报',
      reportStatus: '已驳回',
      caozuo: '',
    },
    {
      createTime: '2023-10-06 11:30:00',
      moduleType: '销售分析报告',
      reportTimeType: '日报',
      reportStatus: '已发布',
      caozuo: '',
    },
    {
      createTime: '2023-10-07 09:10:45',
      moduleType: '市场竞品分析',
      reportTimeType: '周报',
      reportStatus: '草稿',
      caozuo: '',
    },
    {
      createTime: '2023-10-08 15:22:33',
      moduleType: '供应链风险评估',
      reportTimeType: '月报',
      reportStatus: '已发布',
      caozuo: '',
    },
    {
      createTime: '2023-10-09 10:00:00',
      moduleType: '技术研发进度',
      reportTimeType: '周报',
      reportStatus: '审批中',
      caozuo: '',
    },
    {
      createTime: '2023-10-10 17:05:12',
      moduleType: '销售分析报告',
      reportTimeType: '日报',
      reportStatus: '已发布',
      caozuo: '',
    },
    {
      createTime: '2023-10-11 08:55:00',
      moduleType: '用户行为分析',
      reportTimeType: '月报',
      reportStatus: '已发布',
      caozuo: '',
    },
    {
      createTime: '2023-10-12 14:30:20',
      moduleType: '品牌影响力报告',
      reportTimeType: '季报',
      reportStatus: '草稿',
      caozuo: '',
    },
    {
      createTime: '2023-10-13 13:15:00',
      moduleType: '销售分析报告',
      reportTimeType: '日报',
      reportStatus: '已发布',
      caozuo: '',
    },
    {
      createTime: '2023-10-14 11:20:40',
      moduleType: '仓储物流日报',
      reportTimeType: '日报',
      reportStatus: '审批中',
      caozuo: '',
    },
    {
      createTime: '2023-10-15 16:10:05',
      moduleType: '合规审计报告',
      reportTimeType: '年报',
      reportStatus: '已发布',
      caozuo: '',
    },
    {
      createTime: '2023-10-16 09:00:00',
      moduleType: '销售分析报告',
      reportTimeType: '日报',
      reportStatus: '已发布',
      caozuo: '',
    },
    {
      createTime: '2023-10-17 10:40:15',
      moduleType: '新媒体运营周报',
      reportTimeType: '周报',
      reportStatus: '草稿',
      caozuo: '',
    },
    {
      createTime: '2023-10-18 15:55:22',
      moduleType: '能耗统计分析',
      reportTimeType: '月报',
      reportStatus: '已发布',
      caozuo: '',
    },
    {
      createTime: '2023-10-19 12:00:00',
      moduleType: '销售分析报告',
      reportTimeType: '日报',
      reportStatus: '审批中',
      caozuo: '',
    },
    {
      createTime: '2023-10-20 14:25:30',
      moduleType: '项目成本预测',
      reportTimeType: '季报',
      reportStatus: '已发布',
      caozuo: '',
    },
  ];
};

// 分页数据
const pageData = reactive({ pageSize: 10, pageNo: 1, total: 0 });

const startSearch = () => {
  getTableData();
};

const handleDetail = (row) => {
  console.log('row :>> ', row);
};
const onReset = () => {
  pageData.pageNo = 1;
  pageData.pageSize = 10;
  // formInline.mgtOrgCodes=prop.unitData
  getTableData();
};
const onSubmit = () => {
  getTableData();
  // nextTick(()=>{
  //     getTableData()
  // })
  console.log('提交');
};

const handleSearch = (model) => {
  console.log('model :>> ', model);
};

const handleEditPop = () => {
  state.edit.visible = true;
};

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

const handleDownloadFile = async () => {
  // 注意：public 文件夹下的文件直接使用根路径 '/' 访问
  const filePath = '/负荷管理措施执行情况.xlsx';
  const exportName = '负荷管理措施执行情况_Base64版.xlsx';

  await downloadViaBase64ToBlob(filePath, exportName);
  ElMessage({
    message: '文件下载成功',
    type: 'success',
  });
};

onMounted(() => {
  getTableData();
});
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
