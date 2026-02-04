<template>
  <div class="common-title">
    <div class="common-title--name">
      <div class="common-title__line"></div>
      {{ name }}
    </div>
  </div>
</template>
<script setup lang="ts" name="CTitle">
defineOptions({ name: 'CTitle2' });
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
  margin-bottom: 8px;
  padding: 10px;
  box-sizing: border-box;
}

.common-title--name {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  color: #1565c0;
  font-weight: bold;
}

.common-title__line {
  width: 4px;
  height: 16px;
  background-color: #1565c0;
  margin-right: 8px;
}
</style>
