<template>
  <EchartsCard
    :title="state.title"
    :form-data="state.formData"
    :form-schema="state.formSchema"
  >
    <FunnelCharts :chart-data="myChartData"></FunnelCharts>
  </EchartsCard>
</template>

<script lang="ts" setup>
import EchartsCard from './echartsCard.vue';
import FunnelCharts from './funnelCharts.vue';

const state = reactive({
  title: '各班组工分分布',
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
const myChartData = ref([
  {
    value: 60,
    name: '0-1000分',
    count: 6,
    teamList: ['班组A', '班组B', '班组C', '班组D', '班组E', '班组F'],
  },
  {
    value: 40,
    name: '1000-2000分',
    count: 4,
    teamList: ['班组G', '班组H', '班组I', '班组J'],
  },
  {
    value: 20,
    name: '2000-3000分',
    count: 2,
    teamList: ['班组K', '班组L'],
  },

  {
    value: 15,
    name: '3000-4000分',
    count: 3,
    teamList: ['班组M', '班组N', '班组O'],
  },
  {
    value: 8,
    name: '4000-5000分',
    count: 2,
    teamList: ['班组P', '班组Q'],
  },
  {
    value: 5,
    name: '5000分以上',
    count: 1,
    teamList: ['班组R'],
  },
]);
</script>
