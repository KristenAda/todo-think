<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive :include="cachedViews">
          <component :is="Component" :key="route.path" />
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
  min-height: calc(100vh - 50px); /* 减去 header 高度 */
  width: 100%;
  position: relative;
  overflow: hidden;
  padding: 20px;
  background-color: #f0f2f5;
}

/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
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
