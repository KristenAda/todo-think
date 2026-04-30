<template>
  <ArtDialog v-model="innerVisible" title="版本规则内容预览" width="900px">
    <div class="preview-head">
      <el-tag type="success">版本号：{{ previewVersionNo || '-' }}</el-tag>
    </div>
    <div class="preview-panel">
      <div class="preview-item">
        <div class="preview-item__label">规则名称</div>
        <div class="preview-item__value">{{ previewData.ruleName || '-' }}</div>
      </div>
      <div class="preview-item">
        <div class="preview-item__label">公式表达式</div>
        <div class="preview-item__value preview-item__formula">{{ previewData.expression || '-' }}</div>
      </div>
      <div class="preview-item">
        <div class="preview-item__label">命中条件</div>
        <div class="preview-item__value">{{ previewData.conditionText || '-' }}</div>
      </div>
      <div class="preview-item">
        <div class="preview-item__label">注入变量</div>
        <div class="preview-tags">
          <el-tag v-for="v in previewData.variables" :key="v.code" size="small">{{ v.code }}：{{ v.path }}</el-tag>
          <span v-if="!previewData.variables.length">无</span>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="innerVisible = false">关闭</el-button>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  const props = defineProps<{
    visible: boolean;
    previewVersionNo: number | null;
    previewData: {
      ruleName: string;
      expression: string;
      conditionText: string;
      variables: Array<{ code: string; path: string }>;
    };
  }>();

  const emit = defineEmits<{
    'update:visible': [boolean];
  }>();

  const innerVisible = computed({
    get: () => props.visible,
    set: (v: boolean) => emit('update:visible', v)
  });
</script>

<style scoped>
  .preview-head {
    margin-bottom: 10px;
  }
  .preview-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .preview-item {
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 10px 12px;
    background: var(--el-bg-color);
  }
  .preview-item__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }
  .preview-item__value {
    font-size: 14px;
    color: var(--el-text-color-primary);
    line-height: 1.5;
    word-break: break-all;
  }
  .preview-item__formula {
    font-family: Consolas, Monaco, monospace;
    color: rgb(52, 211, 153);
  }
  .preview-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
