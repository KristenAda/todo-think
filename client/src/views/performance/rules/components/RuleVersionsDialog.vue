<template>
  <ArtDialog v-model="innerVisible" title="历史版本" width="760px">
    <ArtTable :data="versions" :columns="columns" :loading="loading" />
  </ArtDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  const props = defineProps<{
    visible: boolean;
    versions: Api.Task.RuleSetVersion[];
    loading: boolean;
    columns: any[];
  }>();

  const emit = defineEmits<{
    'update:visible': [boolean];
  }>();

  const innerVisible = computed({
    get: () => props.visible,
    set: (v: boolean) => emit('update:visible', v)
  });
</script>
