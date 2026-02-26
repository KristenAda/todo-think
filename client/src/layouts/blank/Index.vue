<template>
  <div class="blank-layout">
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
// 空白母版页，仅作为基础路由的壳子
</script>

<style scoped lang="scss">
.blank-layout {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #0b0f19; // 契合我们之前登录页的深色底色
}

/* 基础的路由切换淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
