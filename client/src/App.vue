<template>
  <component :is="layoutComponent" :key="layout" />
</template>

<script setup>
// #region 引用
// #endregion

// #region props/emit

// #endregion

// #region 变量/常量
const layoutAdmin = defineAsyncComponent(
  () => import('@/layouts/admin/AdminLayout.vue'),
);

const route = useRoute();
const layout = ref(null);
const watched = ref(false);
const layoutComponent = computed(() => {
  switch (layout.value) {
    case 'admin':
      return layoutAdmin;
    default:
      return layoutAdmin;
  }
});

// #endregion

// #region 业务方法
watch(
  () => route.meta,
  (to) => {
    layout.value = to.layout;
    watched.value = true;
  },
);

// #endregion

// #region 生命周期

// #endregion
</script>

<style>
@import url('@/assets/style/common.scss');
@import url('@/assets/style/flex.scss');
@import url('@/styles/index.scss');
/* .auth-message-box:not(.el-overlay) {
} */
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
