<template>
  <!-- 母版页主体 -->
  <div v-if="loaded" class="layout-main">
    <div class="menu-container">
      <MenuArea v-if="isLocalEnv" />
    </div>
    <div class="router-content-wrap">
      <BreadcrumbArea />
      <!-- 在包裹路由组件时，组件名称路由path命名，以支持同组件名称不同页面的缓存，及缓存移除控制 -->
      <div class="router-main">
        <el-config-provider :locale="zhCn">
          <router-view> </router-view>
        </el-config-provider>
      </div>
    </div>
  </div>
</template>

<script setup>
// install
// #region 引用
import { closeAppLoadingInit } from '@/utils/feedback/app-loading';
// @ts-ignore
// eslint-disable-next-line import/extensions, import/no-unresolved
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

import MenuArea from './components/MenuArea.vue';
import BreadcrumbArea from './components/BreadcrumbArea.vue';

// #endregion

// #region 变量/常量
const loaded = ref(false); // 是否加载完成，加载完成后渲染页面内容，避免闪烁
const localEnvList = ['locala', 'development'];
const isLocalEnv = localEnvList.includes(import.meta.env.MODE); // 环境判断true=本地
// #endregion

// #region 业务方法

// #endregion

// #region 生命周期

onMounted(() => {
  // 标记加载完成
  loaded.value = true;
  closeAppLoadingInit();
});

// #endregion
</script>
<style lang="scss" scoped>
.layout-main {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
  padding: 0;
  margin: 0;

  --layout-menu-bar-expand-width: 180px;
  .menu-container {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }
  /* 页面内容 */
  .router-content-wrap {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    background-color: #f1f1f1;
    overflow-y: hidden;
    overflow-x: hidden;
    padding: 18px;
    padding-top: 0;
    padding-bottom: 0;
    .router-main {
      background-color: #fff;
      flex: 1;
      padding: 16px 24px;
      padding-bottom: 0;
      border-radius: 8px 8px 0 0;
      height: calc(100% - 40px);
    }
  }
}

/* fade-transform */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.2s;
}
.fade-transform-enter-from {
  opacity: 0;
  transition: all 0.2s;
  transform: translateX(-30px);
}
.fade-transform-leave-to {
  opacity: 0;
  transition: all 0.2s;
  transform: translateX(30px);
}
</style>
