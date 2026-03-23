<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform">
        <keep-alive :include="cachedViews">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const cachedViews = ref([]); // 这里可以从 Pinia 中动态获取需要缓存的组件名
</script>

<style scoped>
.app-main {
  min-height: calc(100vh - 60px); /* 减去 header 高度（60px） */
  width: 100%;
  position: relative;
  overflow: auto;
  padding: 20px;
  background-color: #f0f2f5;
}
/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.1s;
}

/* 🚀 核心修复：让即将离开的页面脱离文档流，不占据高度，且宽度贴合父容器的 padding */
.fade-transform-leave-active {
  position: absolute;
  /* 这里的 20px 对应你上面 .app-main 设置的 padding: 20px; */
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 0;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
