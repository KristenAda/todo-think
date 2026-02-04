<template>
  <div class="echarts-card">
    <slot name="header">
      <div class="hearder flex-row justify-between">
        <h3>{{ props.title }}</h3>
        <div class="form-box">
          <super-form
            label-width="80px"
            label-position="right"
            :model-value="formData"
            :schema="props.formSchema"
            :cols="1"
            @update:model-value="handleSearchQueryUpdate"
          >
          </super-form>
        </div>
      </div>
    </slot>
    <div class="default">
      <slot></slot>
    </div>
  </div>
</template>
<script lang="ts" setup>
interface Prop {
  formData: any;
  formSchema: any;
  title: string;
}

const props = withDefaults(defineProps<Prop>(), {
  formData: {},
  formSchema: {},
  title: '',
});

const emit = defineEmits<{
  (e: 'update:formData', value: any): void;
}>();

// 处理 c-search-panel 内部的值变化
const handleSearchQueryUpdate = (newValue: any) => {
  emit('update:formData', newValue);
};

onMounted(() => {
  console.log('props.formSchema', props.formSchema);
});
</script>
<style lang="scss" scoped>
.hearder {
  height: 50px;
}
.echarts-card {
  width: 100%;
  height: 403px;
  border: 1px solid rgba(211, 229, 255, 1);
  border-radius: 9px;
  margin-top: 20px;
  padding: 10px 15px;
  box-sizing: border-box;

  .form-box {
    width: 250px;
    :deep(.component-wrapper) {
      width: 100% !important;
    }
  }
  .default {
    height: calc(100% - 50px);
  }
}
</style>
