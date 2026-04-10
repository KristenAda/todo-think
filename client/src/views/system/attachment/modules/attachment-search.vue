<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  interface Props {
    modelValue: Record<string, any>;
  }

  interface Emits {
    (e: 'update:modelValue', value: Record<string, any>): void;
    (e: 'search', params: Record<string, any>): void;
    (e: 'reset'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const searchBarRef = ref();

  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });

  const rules = {};

  const formItems = computed(() => [
    {
      label: '文件名',
      key: 'keyword',
      type: 'input',
      placeholder: '请输入文件名关键词',
      clearable: true
    }
  ]);

  const handleReset = () => {
    emit('reset');
  };

  const handleSearch = async () => {
    await searchBarRef.value.validate();
    emit('search', formData.value);
  };
</script>
