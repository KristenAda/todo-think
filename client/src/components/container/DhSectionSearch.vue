<template>
  <div class="dh-search-container">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-select),
:deep(.date-picker-wrapper) {
  vertical-align: top;
}

:deep(.my-date-picker) {
  vertical-align: bottom;
}
.dh-search-container {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 8px;

  :deep(.search-label) {
    font-size: 12px !important;
    color: var(--el-text-color-regular);
  }
}
.dh-search-container > :deep(.el-button) {
  margin: 0;
}
// .dh-search-container > :deep(*) {
//   margin: 0 8px 8px 0;
// }
</style>
