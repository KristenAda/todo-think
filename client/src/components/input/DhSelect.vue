<!--
 * @description: 下拉框组件（基于el-select二次封装）
 * @Author: TFG
 * @Date: 2026-01-14
 * @remark：--
 -->
<template>
  <el-select
    v-bind="$attrs"
    :filterable="filterable"
    :style="{
      width: $attrs.width ? $attrs.width : '100%',
      height: $attrs.height ? $attrs.height : '32px',
    }"
    :multiple="multiple"
  >
    <el-option
      v-for="item in data"
      :key="item.value"
      v-bind="item"
      :style="{
        width: $attrs.width ? $attrs.width : '100%',
        height: $attrs.height ? $attrs.height : '32px',
      }"
    >
    </el-option>
    <template #prefix>
      <slot name="prefix"></slot>
    </template>
    <template #empty>暂无数据</template>
  </el-select>
</template>

<script setup>
// #region 引用
// #endregion

// #region props/emit

defineProps({
  /**
   * 下拉框数据源
   */
  data: {
    type: Array,
    default: () => [],
  },
  /**
   * 是否多选
   */
  multiple: {
    type: Boolean,
    default: false,
  },
  /**
   * 是否可搜索
   */
  filterable: {
    type: Boolean,
    default: false,
  },
});
// #endregion

// #region 变量/常量

// #endregion

// #region 业务方法

// #endregion

// #region 生命周期

// #endregion
</script>

<style lang="scss" scoped>
:deep(.el-select__wrapper) {
  font-size: var(--el-font-size-base);
}
</style>
