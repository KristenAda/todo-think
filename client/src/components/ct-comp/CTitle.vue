<template>
  <div class="common-title">
    <div class="common-title--name">
      <div class="common-title__line"></div>
      {{ name }}
      <!-- 判断有无operate slot，然后slot -->
      <div v-if="$slots.operate" class="common-title__operate">
        <slot name="operate" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts" name="CTitle">
defineOptions({ name: 'CTitle' });
type Props = {
  name?: string;
};
// 接受父组件参数，配置默认值
withDefaults(defineProps<Props>(), {
  name: '',
});
</script>
<style lang="scss" scoped>
.common-title {
  // margin-bottom: 15px;
  margin: 24px 0 16px 0;
  height: 16px !important;
  position: relative;
}

.common-title--name {
  display: flex;
  align-items: center;
  font-size: 16px;
  height: 16px !important;
  color: #383838;
  .common-title__operate {
    margin-left: auto;
    margin-right: 8px;
  }
}

.common-title__line {
  width: 4px;
  height: 14px;
  background-color: #2d8ffd;
  margin-right: 8px;
  position: relative;
  top: 0.5px;
}
</style>
