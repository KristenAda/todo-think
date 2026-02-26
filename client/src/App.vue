<template>
  <router-view />
</template>

<script setup>
// 这里不再需要复杂的 watch 和 layout 判断
// 因为我们已经在路由表 (routers/modules/xxx.ts) 中通过嵌套的方式分配好了布局
</script>

<style>
@import url('@/assets/style/common.scss');
@import url('@/assets/style/flex.scss');
@import url('@/styles/index.scss');

.el-overlay-message-box:has(.auth-message-box) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
}

.flow-drawer-modal {
  background-color: unset !important;
}
</style>
