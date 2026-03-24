<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  >
  </ArtSearchBar>
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

  /**
   * 表单数据双向绑定
   */
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });

  /**
   * 表单校验规则
   */
  const rules = {};

  /**
   * 用户状态选项
   */
  const statusOptions = ref([
    { label: '在线', value: '1' },
    { label: '离线', value: '2' },
    { label: '异常', value: '3' },
    { label: '注销', value: '4' }
  ]);

  /**
   * 用户性别选项
   */
  const genderOptions = ref([
    { label: '男', value: '男' },
    { label: '女', value: '女' }
  ]);

  /**
   * 搜索表单配置项
   */
  const formItems = computed(() => [
    {
      label: '用户名',
      key: 'userName',
      type: 'input',
      placeholder: '请输入用户名',
      clearable: true
    },
    {
      label: '手机号',
      key: 'userPhone',
      type: 'input',
      placeholder: '请输入手机号',
      clearable: true
    },
    {
      label: '邮箱',
      key: 'userEmail',
      type: 'input',
      placeholder: '请输入邮箱',
      clearable: true
    },
    {
      label: '性别',
      key: 'userGender',
      type: 'select',
      props: {
        placeholder: '请选择性别',
        options: genderOptions.value,
        clearable: true
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        options: statusOptions.value,
        clearable: true
      }
    }
  ]);

  /**
   * 处理重置事件
   */
  const handleReset = () => {
    emit('reset');
  };

  /**
   * 处理搜索事件
   * 验证表单后触发搜索
   */
  const handleSearch = async () => {
    await searchBarRef.value.validate();
    emit('search', formData.value);
  };
</script>
