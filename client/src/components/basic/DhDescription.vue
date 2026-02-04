<template>
  <div class="dh-description-container">
    <label class="title">{{ props.label + (props.suffix || '') }}</label>
    <div class="description-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  /**
   * 标题
   */
  label: {
    type: String,
    default: '',
  },
  /**
   * 后缀
   */
  suffix: {
    type: String,
    default: null,
  },
});
</script>
<style lang="scss" scoped>
.dh-description-container {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  font-size: var(--el-font-size-base);
  line-height: 32px;
}

.dh-description-container .title {
  display: inline-block;
  color: var(--el-color-gray-dark);
  vertical-align: top;
}

.dh-description-container .description-content {
  display: inline-block;
  flex: 1;
  color: var(--el-text-color-primary);
  word-break: break-all;
}
</style>
