<template>
  <ElDialog v-model="visible" :title="title" width="600px" @closed="emit('closed')">
    <ElForm :model="eventForm" label-width="80px">
      <ElFormItem label="活动标题" required>
        <ElInput v-model="eventForm.content" placeholder="请输入活动标题" />
      </ElFormItem>
      <ElFormItem label="事件颜色">
        <ElRadioGroup v-model="eventForm.type">
          <ElRadio v-for="type in eventTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="开始日期" required>
        <ElDatePicker
          style="width: 100%"
          v-model="eventForm.date"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </ElFormItem>
      <ElFormItem label="结束日期">
        <ElDatePicker
          style="width: 100%"
          v-model="eventForm.endDate"
          type="date"
          placeholder="选择结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :min-date="eventForm.date"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <span class="dialog-footer">
        <ElButton v-if="isEditing" type="danger" @click="emit('delete')"> 删除 </ElButton>
        <ElButton type="primary" @click="emit('save')">
          {{ isEditing ? '更新' : '添加' }}
        </ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  export interface CalendarEventForm {
    date: string;
    endDate?: string;
    content: string;
    type?: 'primary' | 'success' | 'warning' | 'danger';
    bgClass?: string;
    textClass?: string;
  }

  defineProps<{
    title: string;
    isEditing: boolean;
  }>();

  const emit = defineEmits<{
    closed: [];
    save: [];
    delete: [];
  }>();

  const visible = defineModel<boolean>({ required: true });
  const eventForm = defineModel<CalendarEventForm>('eventForm', { required: true });

  const eventTypes = [
    { label: '基本', value: 'primary' },
    { label: '成功', value: 'success' },
    { label: '警告', value: 'warning' },
    { label: '危险', value: 'danger' }
  ] as const;
</script>

<style scoped>
  .dialog-footer {
    display: inline-flex;
    gap: 8px;
  }

  :deep(.el-dialog__body) {
    padding-top: 20px;
  }
</style>
