<template>
  <dh-fixed-header-table-frame>
    <template #search>
      <div class="common-title">
        <c-title name="查询条件" />
      </div>
      <c-search-panel
        v-model="searchQuery"
        :columns="state.searchConfig"
        @search="handleSearch"
      />
    </template>

    <template #operate-bottom>
      <el-button
        type="primary"
        icon="Setting"
        @click="handleCalculateTimeSet($event, null)"
      >
        执行时间配置
      </el-button>
    </template>

    <c-table
      :headers="tableHeader"
      :loading="loading"
      :table-options="{ data: tableData }"
      is-select
      border
      :page-data="pageData"
      :show-index="true"
      show-excel
      @download-file="handleDownloadFile"
      @page-change="handlePage"
      @select="handleSelectionChange"
    >
      <template #successEmpNum="scope">
        <el-space size="large">
          <span style="color: #67c23a">
            {{ scope.data.row.successEmpNum }}
          </span>
        </el-space>
      </template>
      <template #failEmpNum="scope">
        <el-space size="large">
          <el-link type="danger" @click="handleDetail(scope.data.row)">
            {{ scope.data.row.failEmpNum }}
          </el-link>
        </el-space>
      </template>
      <template #operation="scope">
        <el-space size="large">
          <!-- <el-link type="primary" @click="handleReCalculation(scope.data.row)">
            重新计算
          </el-link> -->
          <el-button
            type="primary"
            plain
            icon="Refresh"
            @click="handleReCalculation(scope.data.row)"
          >
            重新计算
          </el-button>
        </el-space>
      </template>
    </c-table>

    <detail
      v-if="state.detail.visible"
      v-model="state.detail.visible"
      :title="state.detail.title"
      :mgt-org-code="state.detail.mgtOrgCode"
      :date="searchQuery.checkYmd"
      width="800px"
    />
    <re-calculation
      v-if="state.recalculate.visible"
      v-model="state.recalculate.visible"
      :title="state.recalculate.title"
      :date="searchQuery.date"
      width="500px"
    >
    </re-calculation>
    <calculation-time-set
      v-if="state.timeSet.visible"
      v-model="state.timeSet.visible"
      :title="state.timeSet.title"
      width="500px"
    ></calculation-time-set>
  </dh-fixed-header-table-frame>
</template>

<script setup>
/**
 * 日工分核算
 * @description 日工分明细页面
 */
import { useAuthorityStore } from '@/stores/authority';
import dayjs from 'dayjs';
import { orderPersonScoreQueryDayWorkScore } from '@/apis/modules/digital-performance/daily-work-point-management/daily-work-point-calculation';
import { SUCCESS_CODE } from '@/configs/const/basic';
import calculationTimeSet from './components/calculationTimeSet.vue';
import reCalculation from './components/reCalculation.vue';
import detail from './components/detail.vue';

const useAuthority = useAuthorityStore();
const currentOrg = useAuthority.orgDto;
/* ------------------  页面状态  ------------------ */
const state = reactive({
  /** 编辑弹窗状态 */
  timeSet: {
    visible: false,
    data: {},
    title: '执行时间配置',
  },

  /** 详情弹窗状态 */
  detail: {
    visible: false,
    mgtOrgCode: '',
    title: '',
    groupConfig: [
      {
        title: '基础信息',
      },
    ],
  },
  //   重新计算弹窗
  recalculate: {
    visible: false,
    title: '重新计算',
  },
  /** 查询配置 */
  searchConfig: [
    {
      label: '供电单位',
      prop: 'mgtOrgCode',
      type: 'choose-unit', // 这里调用你的自定义组件
      props: {
        isRadio: true,
      },
      events: {
        getCode: (val) => {
          console.log('选择的供电单位编码：', val);
        },
      },
    },
    {
      label: '核算日期',
      prop: 'checkYmd',
      type: 'date',
      props: {
        formdata: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
      events: {},
    },
  ],

  /** 表格选中数据 */
  selection: [],
});

/** 查询参数 */
const searchQuery = reactive({
  mgtOrgCode: currentOrg.mgtOrgCode,
  checkYmd: '',
});

/** 表格列配置 */
const tableHeader = [
  {
    prop: 'mgtOrgName',
    label: '供电单位',
    'show-overflow-tooltip': true,
    'min-width': 160,
  },
  {
    prop: 'checkYmd',
    label: '核算日期',
    'show-overflow-tooltip': true,
    'min-width': 120,
  },
  {
    prop: 'totalEmpNum',
    label: '员工总人数',
    width: 150,
  },
  {
    prop: 'successEmpNum',
    label: '核算成功人数',
    width: 120,
  },
  {
    prop: 'failEmpNum',
    label: '核算失败人数',
    width: 120,
  },

  {
    prop: 'checkDate',
    label: '执行时间',
    'show-overflow-tooltip': true,
    'min-width': 150,
    formatter: (row) => {
      return dayjs(row.accountingTime).format('YYYY-MM-DD HH:mm:ss') || '-';
    },
  },
  {
    prop: 'operation',
    label: '操作',
    'show-overflow-tooltip': true,
    'min-width': 120,
    align: 'center',
  },
];

/** 加载状态 */
const loading = ref(false);

/** 删除按钮禁用状态 */

/** 表格数据 */
const tableData = ref([]);

/** 分页数据 */
const pageData = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
});

/* ------------------  方法定义  ------------------ */

/** 获取列表数据 */
const getTableData = async () => {
  const params = {
    ...searchQuery,
    pageSize: pageData.pageSize,
    pageNum: pageData.pageNo,
  };
  loading.value = true;
  try {
    const res = await orderPersonScoreQueryDayWorkScore(params);
    if (res.code === SUCCESS_CODE) {
      tableData.value = res.data.records || [];
      pageData.total = res.data.total || 0;
    }
  } catch (error) {
    console.error('获取列表数据失败：', error);
    // 异常时展示示例数据
    tableData.value = [
      //   {
      //     id: 1,
      //     mgtOrgName: '测试供电单位',
      //     date: '2025-12-01',
      //     totalEmployees: 100,
      //     successfulCount: 90,
      //     failedCount: 10,
      //     accountingTime: '2025-12-01 12:00:00',
      //   },
      //   {
      //     id: 2,
      //     mgtOrgName: '测试供电单位1',
      //     date: '2025-12-01',
      //     totalEmployees: 150,
      //     successfulCount: 140,
      //     failedCount: 10,
      //     accountingTime: '2025-12-01 12:00:00',
      //   },
    ];
    pageData.total = 0;
  } finally {
    loading.value = false;
  }
};

/** 查询 */
const startSearch = () => {
  console.log('searchQuery :>> ', searchQuery);
  pageData.pageNo = 1;
  getTableData();
};

/** 查看详情 */
const handleDetail = (row) => {
  state.detail.data = row;
  state.detail.title = '核算失败明细';
  state.detail.visible = true;
  state.detail.mgtOrgCode = row.mgtOrgCode;
};

/** 查询按钮回调 */
const handleSearch = () => {
  startSearch();
};

/** 分页变化 */
const handlePage = (val) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};

/** 表格选中变化 */
const handleSelectionChange = (selection) => {
  state.selection = selection;
};

/** 导出/下载 */
const handleDownloadFile = () => {
  ElMessage.success('导出成功');
};
// 重新计算确认弹窗
const handleReCalculation = (row) => {
  ElMessageBox.alert('重新计算会覆盖当前日期的工分数据，是否继续？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      // state.recalculate.visible = true;
      // state.recalculate.title = '重新计算';
    })
    .catch(() => {
      // 取消操作
    });
};
const handleCalculateTimeSet = () => {
  state.timeSet.visible = true;
  state.timeSet.title = '执行时间配置';
};
/* ------------------  生命周期  ------------------ */
onBeforeMount(() => {
  // 获取当前日期的前一天
  searchQuery.checkYmd = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  getTableData();
});
</script>

<style scoped lang="scss">
/* 保持原有样式结构 */
</style>
