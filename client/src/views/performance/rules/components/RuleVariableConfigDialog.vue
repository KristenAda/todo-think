<template>
  <ArtDialog v-model="innerVisible" title="变量配置" width="1060px">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 8px"
      title="默认值主要用于规则试算初始化；任务结算应优先使用真实任务事实数据。"
    />
    <div style="margin-bottom: 8px">
      <el-button type="primary" plain @click="emit('addVariableDraft')">新增变量</el-button>
    </div>
    <ArtTable :data="variableDrafts" :columns="columns" />
    <template #footer>
      <el-button @click="innerVisible = false">取消</el-button>
      <el-button type="primary" @click="emit('saveVariableConfig')">保存变量配置</el-button>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  const props = defineProps<{
    visible: boolean;
    variableDrafts: Api.Task.RuleVariable[];
    columns: any[];
  }>();

  const emit = defineEmits<{
    'update:visible': [boolean];
    addVariableDraft: [];
    saveVariableConfig: [];
  }>();

  const innerVisible = computed({
    get: () => props.visible,
    set: (v: boolean) => emit('update:visible', v)
  });
</script>
