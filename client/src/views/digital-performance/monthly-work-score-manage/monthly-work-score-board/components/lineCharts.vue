<template>
  <EchartsCard
    :title="state.title"
    :form-data="state.formData"
    :form-schema="state.formSchema"
  >
    <div ref="chartRef" style="width: 100%; height: 100%"></div>
  </EchartsCard>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import tooltip from '@/directives/tooltip';
import EchartsCard from './echartsCard.vue';

const state = reactive({
  title: '班组公分排行榜',
  formData: {
    teamType: '',
  },
  formSchema: [
    {
      prop: 'teamType',
      label: '班组类型',
      type: 'select',
      options: [{ label: '全部', value: 1 }],
    },
  ],
});
const chartData = ref([120, 200, 150, 80, 70, 110, 130]);

const xAxisData = [
  '外勤四班',
  '外勤二班',
  '外勤一班',
  '外勤五班',
  '外勤五班',
  '外勤五班',
  '外勤五班',
];

const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;
let resizeHandler: () => void;

const renderEcharts = () => {
  if (!myChart || !chartRef.value) return;

  const option = {
    legend: {
      data: ['月工分', '平均分'],
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
    },
    yAxis: [
      {
        type: 'value',
        name: '月工分',
      },
      {
        type: 'value',
        name: '平均分',
      },
    ],
    series: [
      {
        name: '月工分',
        data: chartData.value,
        type: 'bar',
        itemStyle: {
          color: '#409EFF',
          barBorderRadius: [8, 8, 0, 0],
        },
        yAxisIndex: 0,
      },
      {
        name: '平均分',
        data: chartData.value,
        type: 'line',
        itemStyle: {
          color: '#F56C6C',
        },
        lineWidth: 2,
        symbol: 'circle',
        symbolSize: 6,
        yAxisIndex: 1,
      },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
  };

  myChart.setOption(option, true);
};

onMounted(() => {
  if (!chartRef.value) return;

  myChart = echarts.init(chartRef.value);
  renderEcharts();

  resizeHandler = () => {
    if (myChart) {
      myChart.resize();
    }
  };
  window.addEventListener('resize', resizeHandler);
});

watch(
  chartData,
  () => {
    renderEcharts();
  },
  { deep: true },
);

onUnmounted(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
  }

  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
});
</script>
