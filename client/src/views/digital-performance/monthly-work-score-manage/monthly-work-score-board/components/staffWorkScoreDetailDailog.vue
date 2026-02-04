<template>
  <dh-dialog ref="dialogRef" width="80%" :title="props.title">
    <div class="appeal-dialog-main">
      <super-form
        ref="formRef"
        :model-value="formData"
        :schema="formSchema1"
        :cols="4"
      >
      </super-form>

      <c-table
        style="max-height: 350px"
        :headers="tableHeader"
        :loading="loading"
        :table-options="{ data: tableData }"
        :border="true"
        :page-data="pageData"
        :show-index="true"
        :show-excel="false"
        @page-change="handlePage"
      >
      </c-table>
      <div class="common-title">
        <c-title name="本月日工分变化情况"></c-title>
      </div>
      <div
        ref="echartsRef"
        class="score-line-chart"
        style="width: 100%; height: 400px"
      ></div>
    </div>

    <template #footer>
      <div class="dialog-footer-center">
        <el-button @click="dialogRef.close()">取消</el-button>
        <el-button type="primary" @click="confirm"> 确认 </el-button>
      </div>
    </template>
  </dh-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { ECharts, EChartsOption } from 'echarts';

interface TableRowData {
  currentMonthTotalScore?: string;
  extraBonus?: string;
  extraDeduction?: string;
  actualCurrentMonthTotalScore?: string;
}
interface Prop {
  title: string;
  data: TableRowData;
}

interface PageProp {
  pageNum?: number;
  pageSize?: number;
}

const props = withDefaults(defineProps<Prop>(), {
  title: '',
});
const emit = defineEmits(['confirm']);

const dialogRef = ref();
const loading = ref(false);
const formRef = ref();
const tableData = ref([]);
const echartsRef = ref<HTMLDivElement | null>(null);
let scoreChart: ECharts | null = null;

const tableHeader = [
  {
    prop: 'workOrderNo',
    label: '工单编号',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'taskName',
    label: '任务名称',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'baseScore',
    label: '基准分',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'scoreDetail',
    label: '评分明细',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'finalScore',
    label: '得分',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];

const pageData = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
});

const handlePage = (val: PageProp) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
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

function confirm() {}

function initData() {
  if (props.title === '新增') {
    Object.assign(formData, props.data);
  } else if (props.title === '编辑') {
    Object.assign(formData, props.data);
  }
}

const formData = reactive({
  currentMonthTotalScore: '30',
  extraBonus: '5',
  extraDeduction: '2',
  actualCurrentMonthTotalScore: '33',
});

const formSchema1 = [
  { type: 'section', label: '总体情况' },
  {
    prop: 'currentMonthTotalScore',
    label: '当月总分',
    type: 'input',
    disabled: true,
    placeholder: '无数据',
  },
  {
    prop: 'extraBonus',
    label: '额外加分',
    type: 'input',
    disabled: true,
    placeholder: '无数据',
  },
  {
    prop: 'extraDeduction',
    label: '额外减分',
    type: 'input',
    disabled: true,
    placeholder: '无数据',
  },
  {
    prop: 'actualCurrentMonthTotalScore',
    label: '实际当月总分',
    type: 'input',
    disabled: true,
    placeholder: '无数据',
  },
];

const initEcharts = () => {
  if (!echartsRef.value) return;
  scoreChart = echarts.init(echartsRef.value);

  // 构造完整数据：包含日期、完成任务数、当日总工分
  const chartSourceData = [
    { date: '10月1日', taskCount: 8, totalScore: 28 },
    { date: '10月2日', taskCount: 9, totalScore: 32 },
    { date: '10月3日', taskCount: 7, totalScore: 29 },
    { date: '10月4日', taskCount: 10, totalScore: 35 },
    { date: '10月5日', taskCount: 8, totalScore: 33 },
    { date: '10月6日', taskCount: 11, totalScore: 38 },
    { date: '10月7日', taskCount: 9, totalScore: 36 },
    { date: '10月8日', taskCount: 12, totalScore: 42 },
    { date: '10月9日', taskCount: 10, totalScore: 39 },
    { date: '10月10日', taskCount: 13, totalScore: 45 },
    { date: '10月11日', taskCount: 12, totalScore: 43 },
    { date: '10月12日', taskCount: 9, totalScore: 37 },
    { date: '10月13日', taskCount: 7, totalScore: 34 },
    { date: '10月14日', taskCount: 6, totalScore: 30 },
    { date: '10月15日', taskCount: 8, totalScore: 33 },
  ];

  // 提取X轴日期数据
  const xAxisDateData = chartSourceData.map((item) => item.date);
  // 提取当日总工分数据（折线图渲染用）
  const totalScoreData = chartSourceData.map((item) => item.totalScore);
  // 提取完成任务数数据
  const taskCountData = chartSourceData.map((item) => item.taskCount);

  const chartOption: EChartsOption = {
    legend: {
      data: ['日工分'],
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      // 自定义tooltip格式：显示几月几日、完成任务数、当日总工分
      formatter: (params: any) => {
        const currentItem = chartSourceData[params[0].dataIndex];
        return `
          <div style="text-align: left; padding: 6px 0;">
            <div>日期：${currentItem.date}</div>
            <div>完成任务数：${currentItem.taskCount} 个</div>
            <div>当日总工分：${currentItem.totalScore} 分数</div>
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    // X轴改为几月几日显示
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisDateData,
    },
    yAxis: {
      type: 'value',
      name: '分数',
      nameTextStyle: {
        fontSize: 14,
        color: '#666',
      },
      min: 0,
      max: 50,
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '日工分',
        type: 'line',
        data: totalScoreData,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#409EFF',
        },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#409EFF',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(64, 158, 255, 0.3)',
            },
            {
              offset: 1,
              color: 'rgba(64, 158, 255, 0.05)',
            },
          ]),
        },
      },
    ],
  };
  scoreChart.setOption(chartOption, true);
};

const resizeEcharts = () => {
  if (scoreChart) {
    scoreChart.resize();
  }
};

onMounted(() => {
  initData();
  setTimeout(() => {
    initEcharts();
  }, 200);
  window.addEventListener('resize', resizeEcharts);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeEcharts);
  if (scoreChart) {
    scoreChart.dispose();
    scoreChart = null;
  }
});
</script>

<style lang="scss" scoped></style>
