<template>
  <dh-fixed-header-table-frame style="overflow: auto">
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
    <!-- <div><el-button @click="downLoadTemplate">下载</el-button></div> -->
    <div class="box">
      <div class="box-left" style="height: 100%">
        <div class="static-banner">
          <div class="static-banner__item">
            <div class="itme-header">
              <div class="icon"></div>
              <div class="label">员工总人数</div>
            </div>
            <div class="count">1200</div>
            <div class="bot-line"></div>
          </div>
          <div class="static-banner__item">
            <div class="itme-header">
              <div class="icon" style="border-color: #3a96fe"></div>
              <div class="label">有资质人数</div>
            </div>
            <div class="count">1200</div>
            <div class="bot-line" style="background-color: #3a96fe"></div>
          </div>
          <div class="static-banner__item">
            <div class="itme-header">
              <div class="icon" style="border-color: #42ceaf"></div>
              <div class="label">持有率</div>
            </div>
            <div class="count">16.67%</div>
            <div class="bot-line" style="background-color: #42ceaf"></div>
          </div>
        </div>
        <div class="box-table">
          <c-table
            :headers="tableHeader"
            :loading="loading"
            :table-options="{ data: tableData }"
            :border="true"
            :page-data="pageData"
            :show-index="true"
            :show-page-layout="false"
            :show-page-layout2="true"
            @page-change="handlePage"
          >
          </c-table>
        </div>
      </div>
      <div class="echart-box">
        <div class="box-item">
          <div class="search-bar">
            <el-form :inline="true" :model="barForm1" class="">
              <el-row :gutter="30">
                <el-col :span="11">
                  <el-form-item label="部门">
                    <el-select
                      v-model="barForm1.department"
                      multiple
                      style="width: 220px"
                      clearable
                      filterable
                      placeholder="请选择(可多选)"
                      :value-on-clear="''"
                      @change="initEcharts"
                    >
                      <el-option
                        v-for="item in departMentList"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="11">
                  <el-form-item label="资质名称">
                    <el-select
                      v-model="barForm1.qualificationName"
                      multiple
                      style="width: 220px"
                      clearable
                      filterable
                      placeholder="请选择(可多选)"
                      :value-on-clear="''"
                      @change="initEcharts"
                    >
                      <el-option
                        v-for="item in qualificationNameList"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
          <div ref="echart1" class="echart-item"></div>
        </div>
        <div class="box-item">
          <div class="search-bar">
            <el-form :inline="true" :model="barForm2" class="">
              <el-row :gutter="30">
                <el-col :span="11">
                  <el-form-item label="岗位">
                    <el-select
                      v-model="barForm2.position"
                      multiple
                      style="width: 220px"
                      clearable
                      filterable
                      placeholder="请选择(可多选)"
                      :value-on-clear="''"
                      @change="initEcharts"
                    >
                      <el-option
                        v-for="item in departMentList"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="11">
                  <el-form-item label="资质名称">
                    <el-select
                      v-model="barForm2.qualificationName"
                      multiple
                      style="width: 220px"
                      clearable
                      filterable
                      placeholder="请选择(可多选)"
                      :value-on-clear="''"
                      @change="initEcharts"
                    >
                      <el-option
                        v-for="item in qualificationNameList"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
          <div ref="echart2" class="echart-item"></div>
        </div>
      </div>
    </div>
  </dh-fixed-header-table-frame>
</template>

<script setup lang="ts">
import { useAuthorityStore } from '@/stores/authority';
import * as echarts from 'echarts';
import { tableHeader } from './components/tableHeaders';
import { echartOption1, echartOption2 } from './components/options';
// import searchForm from './components/searchForm.vue';

// import searchForm2 from './components/searchForm2.vue';
const useAuthority = useAuthorityStore();
const currentOrg = useAuthority.orgDto;

const searchQuery = reactive({
  mgtOrgCode: currentOrg.mgtOrgCode,
  date: '',
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
    },
  },
  {
    label: '查询时间',
    prop: 'date',
    type: 'date', // 这里调用你的自定义组件
    props: {
      placeholder: '年/月/日',
      formdata: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
    },
  },
];

const loading = ref(false);
const tableData: any = ref([
  {
    qulificationName: '高级电工证明',
    userNum: 100,
    rate: '50%',
  },
]);
const getTableData = async () => {
  loading.value = true;

  console.log(searchQuery);
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
  initEcharts();
});
// 图表部分
const barForm1 = reactive({
  department: '',
  qualificationName: '',
});
const barForm2 = reactive({
  position: '',
  qualificationName: '',
});
const departMentList = ref([
  {
    label: '部门1',
    value: '1',
  },
  {
    label: '部门2',
    value: '2',
  },
]);
const qualificationNameList = ref([
  {
    label: '资质1',
    value: '1',
  },
  {
    label: '资质2',
    value: '2',
  },
]);
const barData1 = ref([
  {
    name: '部门1',
    value1: 10,
    value2: 20,
  },
  {
    name: '部门2',
    value1: 30,
    value2: 40,
  },
  {
    name: '部门3',
    value1: 50,
    value2: 60,
  },
]);
const barData2 = ref([
  {
    name: '部门1',
    value1: 10,
    value2: 20,
  },
  {
    name: '部门2',
    value1: 30,
    value2: 40,
  },
  {
    name: '部门3',
    value1: 50,
    value2: 60,
  },
]);
const echart1 = ref(null);
const echart2 = ref(null);
const initEcharts = () => {
  if (echart1.value) {
    const myChart1 = echarts.init(echart1.value);
    const option1 = echartOption1(barData1.value);
    myChart1.setOption(option1);
    window.addEventListener('resize', () => {
      myChart1.resize();
    });
  }
  if (echart2.value) {
    const myChart2 = echarts.init(echart2.value);
    const option1 = echartOption2(barData2.value);
    myChart2.setOption(option1);
    window.addEventListener('resize', () => {
      myChart2.resize();
    });
  }
};
</script>

<style scoped lang="scss">
:deep(.dh-fixed-header-table-frame__upper) {
  overflow-y: auto !important;
  scrollbar-width: none;
}

::-webkit-scrollbar {
  display: none !important;
}

.box {
  // width: 100%;
  height: 700px;
  display: flex;
  gap: 20px;

  .box-left {
    flex: 1;
    width: 50%;
    height: 700px;
    .static-banner {
      width: 100%;
      display: flex;
      gap: 40px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 0 10px;
      box-sizing: border-box;

      .static-banner__item {
        flex: 1;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        padding: 0 10px;
        box-sizing: border-box;
        padding-top: 10px;
        height: 95px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: all 0.2s ease-in-out;
        &:hover {
          transform: translateY(-4px);
        }
        .itme-header {
          display: flex;
          align-items: center;

          // margin-bottom: 20px;
          .icon {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            border: 5px solid #f8892a;
            margin-right: 10px;
          }

          .label {
            color: #aaa;
            font-size: 14px;
            font-weight: 500;
          }
        }

        .count {
          text-align: center;
          font-size: 20px;
          color: #333;
          font-weight: 600;
        }

        .bot-line {
          width: 100%;

          height: 4px;
          background-color: #f8892a;
        }
      }
    }
    .box-table {
      height: 575px;
    }
  }

  .echart-box {
    flex: 1;
    width: 50%;
    height: 700px;
    padding-bottom: 24px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .box-item {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      padding: 10px 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;

      .search-bar {
        width: 100%;
      }

      .echart-item {
        flex: 1;
        width: 100%;
      }
    }
  }
}
</style>
