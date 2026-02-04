<!--
 * @description: 进度条组件
 * @Author: TFG
 * @Date: 2026-01-14
 * @remark：--
 -->
<template>
  <div v-if="showFlag" class="app-loading-mask">
    <div class="app-loading-container">
      <div class="loader loader-init">
        <div class="loader-bar"></div>
        <div id="loadingTips" style="font-size: 16px">
          {{ showTxt }}
        </div>
      </div>
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
  // width: 8.875rem !important;
  // min-height: 7.5rem;
  padding: 1rem;
  // color: var(--el-color-white);
  // background-color: var(--el-color-black-light-7);
  border-radius: 0.5rem;
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

@keyframes loading-anim {
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
  animation: loading-anim;
  animation-duration: 1.5s;
  animation-iteration-count: infinite;
}

html:has(.loader-init) {
  min-width: 100vw !important;
}
.loader {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
}
.loader-bar {
  position: relative;
  width: calc(160px / 0.707);
  height: 10px;
  overflow: hidden;
  background: #f9f9f9;
  border: 1px solid #006dfe;
  border-radius: 10px;
}

.loader-bar::before {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  content: '';
  background: repeating-linear-gradient(45deg, #0031f2 0 30px, #006dfe 0 40px)
    right/200% 100%;
  border-radius: 5px;
  animation:
    fill-progress 6s ease-in-out infinite,
    light-effect 1s infinite linear;
  animation-fill-mode: forwards;
}

@keyframes fill-progress {
  0% {
    width: 0;
  }

  33% {
    width: 33.333%;
  }

  66% {
    width: 66.67%;
  }

  100% {
    width: 100%;
  }
}

@keyframes light-effect {
  0%,
  20%,
  40%,
  60%,
  80%,
  100% {
    background: repeating-linear-gradient(45deg, #0031f2 0 30px, #006dfe 0 40px)
      right/200% 100%;
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    background: repeating-linear-gradient(
        45deg,
        #0031f2 0 30px,
        #006dfe 0 40px,
        rgb(255 255 255 / 30%) 0 40px
      )
      right/200% 100%;
  }
}
</style>
