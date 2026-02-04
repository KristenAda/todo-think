<template>
  <el-alert
    v-if="state.tipType === TipType.滚动提示 && state.isShow"
    type="error"
  >
    <template #title>
      <!-- 标题 -->
      <span>{{ curInfo.title }}</span>
    </template>
    <!-- 摘要 -->
    <span>{{ curInfo.abstracts }}</span>
  </el-alert>
</template>
<script setup>
import { TipType } from '@/configs/enums/commons';
import { number } from 'echarts';
import { ElNotification } from 'element-plus';
// #region 引用
// #endregion

// #region props/emit
const props = defineProps({
  type: {
    type: number,
    default: TipType.滚动提示,
  },
  info: {
    type: Object,
    default: () => {},
  },
  isShow: {
    type: Boolean,
    default: false,
  },
});

// #endregion

// #region 变量/常量
const curInfo = computed(() => props.info);

const state = reactive({
  tipType: props.type,
  isShow: props.isShow,
});

// #endregion

// #region 业务方法
/**
 * 打开弹窗通知
 */
const openNotification = () => {
  ElNotification({
    title: curInfo.value.title,
    // dangerouslyUseHTMLString: true,
    type: 'info',
    position: 'bottom-right',
    duration: 5000,
    message: curInfo.value.content,
  });
};
// #endregion

// #region 生命周期

watch(
  () => props.isShow,
  (newVal) => {
    if (newVal) {
      if (state.tipType === TipType.弹窗提示) {
        openNotification();
      } else if (state.tipType === TipType.滚动提示) {
        state.isShow = true;
      }
    }
  },
);

// #endregion
</script>
<style lang="scss" scoped>
/* 样式 */
</style>
