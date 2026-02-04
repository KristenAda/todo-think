<template>
  <div ref="chartRef" style="width: 100%; height: 100%"></div>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts';

interface FunnelChartItem {
  value: number;
  name: string;
  count: number;
  teamList: string[];
}

const props = defineProps<{
  chartData: FunnelChartItem[];
}>();

// 3. 计算总价值（复用原有逻辑，改为使用 props.chartData）
const getTotalValue = () => {
  if (!props.chartData || props.chartData.length === 0) return 0;
  return props.chartData.reduce((total, item) => total + item.value, 0);
};

// 4. ECharts 核心相关变量（复用原有逻辑）
const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;
let resizeHandler: () => void;

// 5. 渲染 ECharts（核心修改：图例数据从 props.chartData.map 提取 name，不再硬编码）
const renderEcharts = () => {
  if (!myChart || !chartRef.value || !props.chartData) return;

  const totalValue = getTotalValue();
  // 自动提取图例数据：从 chartData 中遍历取出每个 item 的 name
  const legendData = props.chartData.map((item) => item.name);

  const option = {
    legend: {
      data: legendData, // 改为自动提取的图例数据
      bottom: 0,
    },
    series: [
      {
        name: '月工分',
        data: props.chartData, // 改为使用 props 传入的 chartData
        type: 'funnel',
        tooltip: {
          trigger: 'item',
        },
        // 核心配置1：开启标签（图形延伸线条后的文字），并自定义格式
        label: {
          show: true,
          position: 'right', // 标签显示在图形右侧（延伸线条指向）
          formatter: (params: any) => {
            const ratio = ((params.data.value / totalValue) * 100).toFixed(0);
            return `占比：${ratio}%，${params.data.count}个班组`;
          },
          fontSize: 12, // 可选：调整标签文字大小
        },
        // 可选：优化延伸线条样式
        labelLine: {
          show: true, // 显示延伸线条（默认开启，显式指定更清晰）
          lineStyle: {
            color: '#999', // 线条颜色
            width: 1, // 线条粗细
          },
        },
      },
    ],
    tooltip: {
      trigger: 'item',
      axisPointer: { type: 'shadow' },
      padding: 0,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const { data, color } = params;
        const { teamList } = data;
        let teamListStr = '';

        for (let i = 0; i < teamList.length; i += 2) {
          const item1 = teamList[i] ? `● ${teamList[i]}` : '';
          const item2 = teamList[i + 1] ? `● ${teamList[i + 1]}` : '';

          teamListStr += `
        <div style="margin: 2px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <span>${item1}</span>
          <span>${item2 || ''}</span>
        </div>
      `;
        }

        // 内层 div 保持原有样式，补充完整圆角和内边距
        return `
      <div style="background-color: ${color}; padding: 12px; border-radius: 4px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
        ${teamListStr}
      </div>
    `;
      },
      position: (point: any) => {
        return [point[0] + 50, point[1]];
      },
    },
  };

  myChart.setOption(option, true);
};

// 6. 挂载时初始化 ECharts（复用原有逻辑）
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

// 7. 监听 props.chartData 变化，自动更新图表（深度监听，适配数组元素变化）
watch(
  () => props.chartData,
  () => {
    renderEcharts();
  },
  { deep: true },
);

// 8. 卸载时销毁 ECharts 实例和事件监听（复用原有逻辑）
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
