<template>
  <div
    class="work-points-card align-center"
    :style="{
      backgroundColor: `${config[props.type].bgColor}`,
    }"
  >
    <img
      class="card-bgimg"
      src="@/assets/images/digital-performance/monthly-work-score-manage/monthly-work-score-board/bgimg.png"
      alt=""
    />
    <div class="card-text flex-col">
      <div>
        {{ config[props.type].text }}
      </div>
      <div class="card-text-num">
        {{ props.points }}
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
interface Prop {
  type: 'sum' | 'average' | 'maxGroup' | 'maxEmployee';
  points: number;
}
const props = withDefaults(defineProps<Prop>(), {
  type: 'sum',
  points: 0,
});
const config = reactive({
  sum: {
    bgColor: 'rgba(145, 187, 249, 0.996078431372549)',
    text: '本月总工分',
  },
  average: {
    bgColor: 'rgba(249, 216, 145, 0.996078431372549)',
    text: '本月平均工分',
  },
  maxGroup: {
    bgColor: 'rgba(249, 145, 145, 0.996078431372549)',
    text: '最高班组工分',
  },
  maxEmployee: {
    bgColor: 'rgba(64, 189, 104, 0.996078431372549)',
    text: '最高员工工分',
  },
});
</script>
<style lang="scss">
.work-points-card {
  width: 242px;
  height: 137px;
  border-radius: 14px;
  position: relative;
  padding: 0 15px;
  box-sizing: border-box;
  .card-bgimg {
    position: absolute;
    right: 0;
    bottom: 0;
  }
  .card-text {
    color: white;
    gap: 20px;
    font-size: 18px;
    font-weight: bold;
    .card-text-num {
      font-size: 28px;
    }
  }
}
</style>
