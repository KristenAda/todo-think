<template>
  <dh-fixed-header-table-frame class="scroll-layout">
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
    <div class="rank-container">
      <!-- 班组工分排行榜 -->
      <div class="rank-box">
        <div class="rank-box-head">
          <rank-table-card-title>
            <template #title>班组工分排行榜</template>
          </rank-table-card-title>
          <div class="filter">
            <el-form-item label="班组类型" required>
              <el-select
                v-model="searchQuery.teamtypeCode"
                placeholder="选择班组"
                :disabled="currentClassCode !== ''"
                clearable
              >
                <el-option
                  v-for="item in state.classList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
        </div>
        <rank-top-list :top-list-user="topList" />
        <div style="flex: 1; min-height: 0">
          <c-table
            :headers="tableHeader"
            :loading="loading"
            :table-options="{ data: tableData }"
            border
            :page-data="pageData"
            show-excel
            @download-file="handleDownloadFile"
            @page-change="handlePage"
            @select="handleSelectionChange"
          >
            <template #lastRankingNum="scope">
              <el-space v-if="scope.data.row.lastRankingNum != 0" size="large">
                <div
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: start;
                  "
                >
                  <el-icon
                    v-if="scope.data.row.lastRankingNum > 0"
                    color="#d9001b"
                    style="font-size: 18px"
                    class="no-inherit"
                  >
                    <CaretTop />
                  </el-icon>
                  <el-icon
                    v-if="scope.data.row.lastRankingNum < 0"
                    color="#70b603"
                    style="font-size: 18px"
                    class="no-inherit"
                  >
                    <CaretBottom />
                  </el-icon>
                  <span
                    :style="{
                      color:
                        scope.data.row.lastRankingNum > 0
                          ? '#d9001b'
                          : '#70b603',
                    }"
                    >{{ Math.abs(scope.data.row.lastRankingNum) }}名</span
                  >
                </div>
              </el-space>
              <el-space v-else size="large" style="font-weight: bold"
                >--</el-space
              >
            </template>
            <template #failedCount="scope">
              <el-space size="large">
                <el-link type="primary" @click="handleDetail(scope.data.row)">
                  {{ scope.data.row.failedCount }}
                </el-link>
              </el-space>
            </template>
          </c-table>
        </div>
      </div>
      <!-- 员工工分排行榜 -->
      <div class="rank-box">
        <div class="rank-box-head">
          <rank-table-card-title>
            <template #title>员工工分排行榜</template>
          </rank-table-card-title>
          <div class="filter">
            <el-form-item label="班组类型" label-width="80px" required>
              <el-select
                v-model="searchQuery.teamtypeCode"
                placeholder="选择班组"
                :disabled="currentClassCode !== ''"
                clearable
              >
                <el-option
                  v-for="item in state.classList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              label="姓名"
              label-width="80px"
              label-position="right"
            >
              <el-input
                v-model="searchQuery.empName"
                placeholder="请输入姓名"
              />
            </el-form-item>
          </div>
        </div>
        <rank-top-list :top-list-user="topListUser" />
        <div style="flex: 1; min-height: 0">
          <c-table
            :headers="tableHeaderUser"
            :loading="loadingUser"
            :table-options="{ data: tableDataUser }"
            border
            :page-data="pageDataUser"
            show-excel
            @download-file="handleDownloadFileUser"
            @page-change="handlePageUser"
            @select="handleSelectionChange"
          >
            <template #lastRankingNum="scope">
              <el-space v-if="scope.data.row.lastRankingNum != 0" size="large">
                <div
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: start;
                  "
                >
                  <el-icon
                    v-if="scope.data.row.lastRankingNum > 0"
                    color="#d9001b"
                    style="font-size: 18px"
                    class="no-inherit"
                  >
                    <CaretTop />
                  </el-icon>
                  <el-icon
                    v-else
                    color="#70b603"
                    style="font-size: 18px"
                    class="no-inherit"
                  >
                    <CaretBottom />
                  </el-icon>
                  <span
                    :style="{
                      color:
                        scope.data.row.lastRankingNum > 0
                          ? '#d9001b'
                          : '#70b603',
                    }"
                    >{{ Math.abs(scope.data.row.lastRankingNum) }}名</span
                  >
                </div>
              </el-space>
              <el-space v-else size="large" style="font-weight: bold"
                >--</el-space
              >
            </template>
            <template #failedCount="scope">
              <el-space size="large">
                <el-link type="primary" @click="handleDetail(scope.data.row)">
                  {{ scope.data.row.failedCount }}
                </el-link>
              </el-space>
            </template>
          </c-table>
        </div>
      </div>
    </div>
  </dh-fixed-header-table-frame>
</template>

<script setup>
/**
 * 日工分核算
 * @description 日工分明细页面
 */
import { useAuthorityStore } from '@/stores/authority';
import dayjs from 'dayjs';
import {
  queryDayWorkScoreTeamRanking,
  queryDayWorkScorePersonRanking,
} from '@/apis/modules/digital-performance/daily-work-point-management/daily-work-point-ranking';
import { SUCCESS_CODE } from '@/configs/const/basic';
import rankTableCardTitle from './components/rank-table-card-title.vue';
import rankTopList from './components/rank-top-List.vue';
import { getFirstGdsMgt } from '../utils';

const useAuthority = useAuthorityStore();
const currentOrg = useAuthority.orgDto;
const currentClassCode = useAuthority.classType;
/* ------------------  页面状态  ------------------ */
const state = reactive({
  // 班组下拉选项
  classList: [
    { label: '内勤班组', value: '02' },
    { label: '外勤班组', value: '03' },
  ],
  /** 查询配置 */
  searchConfig: [
    {
      label: '供电单位',
      prop: 'mgtOrgCode',
      type: 'choose-unit', // 这里调用你的自定义组件
      props: {
        isRadio: true,
        isGds: true,
      },
      events: {
        getNode: (val) => {
          console.log('选择的供电单位编码：', val);
        },
      },
    },
    {
      label: '日期',
      prop: 'checkYmd',
      type: 'date',
      props: {
        formdata: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
        clearable: false,
      },
      events: {},
    },
  ],

  /** 表格选中数据 */
  selection: [],
});

/** 查询参数 */
const searchQuery = reactive({
  mgtOrgCode: getFirstGdsMgt().mgtOrgCode,
  checkYmd: '',
  teamtypeCode: currentClassCode === '' ? '03' : currentClassCode,
  empName: '',
});

/** 表格列配置 */
const tableHeader = [
  {
    prop: 'rankingNum',
    label: '名次',
    // width: 120,
    align: 'center',
  },
  {
    prop: 'teamName',
    label: '班组',
  },
  {
    prop: 'workScore',
    label: '总工分',
  },

  {
    prop: 'lastRankingNum',
    label: '较昨日',
    align: 'center',
    fixed: 'right',
  },
];
const tableHeaderUser = [
  {
    prop: 'rankingNum',
    label: '名次',
    // width: 120,
    align: 'center',
  },
  {
    prop: 'empName',
    label: '姓名',
  },
  {
    prop: 'teamName',
    label: '班组',
  },
  {
    prop: 'workScore',
    label: '总工分',
  },

  {
    prop: 'lastRankingNum',
    label: '较昨日',
    align: 'center',
    fixed: 'right',
  },
];
/** 加载状态 */
const loading = ref(false);
const loadingUser = ref(false);

/** 表格数据 */
const tableData = ref([]);
const tableDataUser = ref([]);
/** 分页数据 */
const pageData = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
});

const pageDataUser = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
});
/* ------------------  方法定义  ------------------ */

/** 获取列表数据 */
const getTableData = async () => {
  const { empName, ...rest } = searchQuery;
  const params = {
    ...rest,
    pageSize: pageData.pageSize,
  };
  loading.value = true;
  try {
    const res = await queryDayWorkScoreTeamRanking(params);
    if (res.code === SUCCESS_CODE) {
      tableData.value = res.data[pageData.pageNo - 1] || [];
      console.log('tableData.value :>> ', tableData.value);
      getTopList();
      pageData.total = res.data?.flat(Infinity).length || 0;
    }
  } catch (error) {
    // 异常时展示示例数据
    tableData.value = [];
    getTopList();
    pageData.total = 0;
  } finally {
    loading.value = false;
  }
};
// 获取员工排名
const getUserTableData = async () => {
  const params = {
    ...searchQuery,
    pageSize: pageDataUser.pageSize,
  };
  loadingUser.value = true;
  try {
    const res = await queryDayWorkScorePersonRanking(params);
    if (res.code === SUCCESS_CODE) {
      tableDataUser.value = res.data[pageDataUser.pageNo - 1] || [];
      console.log('tableData.value :>> ', tableDataUser.value);
      getTopListUser();
      pageDataUser.total = res.data?.flat(Infinity).length || 0;
    }
  } catch (error) {
    // 异常时展示示例数据
    tableDataUser.value = [];
    getTopListUser();
    pageDataUser.total = 0;
  } finally {
    loadingUser.value = false;
  }
};
// 获取前3名班组
const getTopList = () => {
  if (pageData.pageNo === 1) {
    topList.value =
      tableData.value.length >= 3
        ? tableData.value.slice(0, 3)
        : tableData.value;
    if (topList.value.length >= 2) {
      [topList.value[0], topList.value[1]] = [
        topList.value[1],
        topList.value[0],
      ];
    }

    tableData.value =
      tableData.value.length >= 3
        ? tableData.value.slice(3)
        : tableData.value.slice(tableData.value.length);
  }
};
// 获取前3名员工
const getTopListUser = () => {
  if (pageDataUser.pageNo === 1) {
    topListUser.value =
      tableDataUser.value.length >= 3
        ? tableDataUser.value.slice(0, 3)
        : tableDataUser.value;
    if (topListUser.value.length >= 2) {
      [topListUser.value[0], topListUser.value[1]] = [
        topListUser.value[1],
        topListUser.value[0],
      ];
    }

    tableDataUser.value =
      tableDataUser.value.length >= 3
        ? tableDataUser.value.slice(3)
        : tableDataUser.value.slice(tableDataUser.value.length);
  }
};
/** 查询 */
const startSearch = () => {
  console.log('searchQuery :>> ', searchQuery);
  pageData.pageNo = 1;
  pageDataUser.pageNo = 1;
  getTableData();
  getUserTableData();
};

/** 查看详情 */
const handleDetail = (row) => {
  state.detail.data = row;
  state.detail.title = '核算失败明细';
  state.detail.visible = true;
};
const topList = ref([]);
const topListUser = ref([]);
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
const handlePageUser = (val) => {
  if ('pageNum' in val) pageDataUser.pageNo = val.pageNum;
  if ('pageSize' in val) pageDataUser.pageSize = val.pageSize;
  getUserTableData();
};
/** 表格选中变化 */
const handleSelectionChange = (selection) => {
  state.selection = selection;
};

/** 导出/下载 */
const handleDownloadFile = () => {
  ElMessage.success('导出成功');
};
const handleDownloadFileUser = () => {
  ElMessage.success('导出成功');
};

/* ------------------  生命周期  ------------------ */
onBeforeMount(() => {
  console.log(getFirstGdsMgt());
  searchQuery.checkYmd = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  getTableData();
  getUserTableData();
});
</script>

<style scoped lang="scss">
// :deep(.dh-fixed-header-table-frame__upper) {
//   overflow-y: auto !important;
//   scrollbar-width: none;
// }

// ::-webkit-scrollbar {
//   display: none !important;
// }
/* 保持原有样式结构 */

.rank-container {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 30px;
  padding-bottom: 20px;
  .rank-box {
    width: 48%;
    height: 100%;
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 20px;
    box-sizing: border-box;
    border: 1px solid rgba(154, 186, 195, 1);
    // background-color: #f6fafd;
    .rank-box-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 80px;

      .filter {
        width: 230px;
        height: 30px;
      }
    }
  }
}
</style>
