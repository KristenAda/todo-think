<!--
 * @description: 加载中的组件
 * @Author: TFG
 * @Date: 2026-01-14
 * @remark：--
 -->
<template>
  <div v-if="showFlag" class="app-loading-mask">
    <div class="app-loading-container">
      <div class="van-loading">
        <svg width="40" height="40">
          <circle class="loading-circle" cx="18" cy="18" r="12"></circle>
        </svg>
      </div>
      <p>{{ showTxt }}</p>
    </div>
  </div>
</template>

<script setup>
// #region 引用

// #endregion

// #region props/emit

const props = defineProps({
  /**
   * 加载中的文案信息对象
   */
  msgInfo: {
    type: Object,
    required: true,
  },

  /**
   * 是否显示加载中组件
   */
  isShow: {
    type: Boolean,
    default: false,
  },

  /**
   * 加载中的文案信息
   */
  loadingTxt: {
    type: String,
    default: '',
  },
});

// #endregion

// #region 变量/常量

// 显示文案
const showTxt = computed(() => {
  return props.msgInfo?.loadingTxt ?? props.loadingTxt ?? '正在加载中...';
});
// 是否显示标识
const showFlag = computed(() => {
  return props.msgInfo?.isShow ?? props.isShow;
});

// #endregion
</script>

<style lang="scss" scoped>
.app-loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  width: 100%;
  height: 100%;
  opacity: 1;
}

.app-loading-container {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: center;
  width: 8.875rem !important;
  min-height: 7.5rem;
  padding: 1rem;
  color: var(--el-color-white);
  background-color: var(--el-color-black-light-7);
  border-radius: 0.5rem;
  transform: translate3d(-50%, -50%, 0);
  transform: translate3d(-50%, -50%, 0);
}

.app-loading-container > p {
  margin-top: 0.875rem;
  font-size: var(--el-font-size-medium);
  color: var(--el-color-white);
  text-align: center;
}

.app-loading-container .van-loading {
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: center;
  width: 2rem;
  height: 2rem;
  margin-top: 1rem;
  text-align: center;
}

@keyframes loadingAnim {
  0% {
    stroke-dasharray: 160 160;
    stroke-dashoffset: 0;
  }

  100% {
    stroke-dasharray: 120 60;
    stroke-dashoffset: -160;
  }
}

.loading-circle {
  fill: transparent;
  stroke: var(--el-color-white);
  stroke-width: 2;
  animation: loadingAnim;
  animation-duration: 1.5s;
  animation-iteration-count: infinite;
}
</style>
