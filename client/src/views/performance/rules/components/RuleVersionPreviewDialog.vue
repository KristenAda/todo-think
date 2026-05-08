<template>
  <ArtDialog v-model="innerVisible" title="版本规则内容预览" width="900px">
    <div class="preview-head">
      <el-tag type="success">版本号：{{ previewVersionNo || '-' }}</el-tag>
    </div>

    <div class="preview-panel">
      <div class="preview-item">
        <div class="preview-item-label">规则名称</div>
        <div class="preview-item-value">{{ previewData.ruleName || '-' }}</div>
      </div>

      <div class="preview-item">
        <div class="preview-item-label">公式表达式（兼容摘要）</div>
        <div class="preview-item-value preview-item-formula">{{
          previewData.expression || '-'
        }}</div>
      </div>

      <div v-if="previewData.segmentExpressions?.length" class="preview-item">
        <div class="preview-item-label">各科公式</div>
        <div class="preview-segments">
          <div
            v-for="(row, idx) in previewData.segmentExpressions"
            :key="idx"
            class="preview-segment-row"
          >
            <span class="preview-segment-label">{{ row.label }}</span>
            <span class="preview-segment-expr">{{ row.expression }}</span>
          </div>
        </div>
      </div>

      <div class="preview-item">
        <div class="preview-item-label">命中条件</div>
        <div class="preview-item-value">{{ previewData.conditionText || '-' }}</div>
      </div>

      <div class="preview-item">
        <div class="preview-item-label">注入变量</div>
        <div v-if="previewData.variables.length" class="preview-var-list">
          <div v-for="v in previewData.variables" :key="v.code" class="preview-var-card">
            <div class="preview-var-card-title">{{ v.label }}</div>
            <div class="preview-var-card-row">
              <span class="preview-var-card-field-label">公式编码</span>
              <code class="preview-var-card-code">{{ v.code }}</code>
            </div>
            <div class="preview-var-card-hint">{{ v.sourceHint }}</div>
          </div>
        </div>
        <div v-else class="preview-item-empty">无</div>
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
      variables: Array<{ code: string; label: string; sourceHint: string }>;
      segmentExpressions?: Array<{ label: string; expression: string }>;
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

  .preview-item-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }

  .preview-item-value {
    font-size: 14px;
    color: var(--el-text-color-primary);
    line-height: 1.5;
    word-break: break-all;
  }

  .preview-item-empty {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .preview-item-formula {
    font-family: Consolas, Monaco, monospace;
    color: rgb(52, 211, 153);
  }

  .preview-var-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .preview-var-card {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-extra-light);
  }

  .preview-var-card-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 6px;
  }

  .preview-var-card-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    margin-bottom: 4px;
  }

  .preview-var-card-field-label {
    color: var(--el-text-color-secondary);
  }

  .preview-var-card-code {
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
  }

  .preview-var-card-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.45;
  }

  .preview-segments {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preview-segment-row {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 10px;
    align-items: start;
    font-size: 13px;
  }

  .preview-segment-label {
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }

  .preview-segment-expr {
    font-family: Consolas, Monaco, monospace;
    color: rgb(52, 211, 153);
    word-break: break-all;
    line-height: 1.45;
  }
</style>
