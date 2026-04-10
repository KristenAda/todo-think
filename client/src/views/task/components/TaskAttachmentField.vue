<!-- 任务/工时：多附件选择、分片挨个上传、环形进度（按类型图标与主题色） -->
<template>
  <div class="task-attach-field">
    <el-upload
      :show-file-list="false"
      :auto-upload="false"
      multiple
      :disabled="disabled || isUploading"
      @change="onFileChange"
    >
      <template #trigger>
        <el-button class="trigger-btn" :disabled="disabled || isUploading" round>
          <art-svg-icon icon="mdi:cloud-upload-outline" class="trigger-btn__icon" />
          {{ triggerText }}
        </el-button>
      </template>
    </el-upload>
    <p v-if="hint" class="hint">{{ hint }}</p>
    <div v-if="activeExisting.length || items.length" class="file-grid">
      <div
        v-for="ex in activeExisting"
        :key="'ex-' + ex.attachmentId"
        class="file-card"
        :class="getFileCategoryClass(ex.originalName, ex.mimeType ?? '')"
        :style="existingIconZoneStyle(ex)"
      >
        <div class="file-card__surface">
          <div class="file-card__icon-zone">
            <ArtSvgIcon :icon="fileIconForExisting(ex)" class="file-card__type-icon" />
            <div class="file-card__state file-card__state--ok">
              <ArtSvgIcon icon="mdi:check-decagram" />
            </div>
          </div>
          <div class="file-card__body">
            <div class="file-card__name-row">
              <span class="file-card__name" :title="ex.originalName">{{
                truncateName(ex.originalName, 22)
              }}</span>
            </div>
            <span v-if="getFileExtLabel(ex.originalName)" class="file-card__ext-pill">{{
              getFileExtLabel(ex.originalName)
            }}</span>
          </div>
          <div class="file-card__toolbar">
            <el-button link type="primary" size="small" @click="previewExisting(ex)"> 预览 </el-button>
            <el-button link type="danger" size="small" @click="removeExisting(ex.attachmentId)">
              移除
            </el-button>
          </div>
        </div>
      </div>
      <div
        v-for="item in items"
        :key="item.id"
        class="file-card"
        :class="getFileCategoryClass(item.file.name, item.file.type)"
        :style="iconZoneStyle(item)"
      >
        <div class="file-card__surface">
          <div class="file-card__icon-zone">
            <ArtSvgIcon :icon="fileIconFor(item)" class="file-card__type-icon" />
            <div v-if="item.status === 'uploading'" class="file-card__upload-mask">
              <el-progress
                type="circle"
                :percentage="item.percent"
                :width="54"
                :stroke-width="4"
                :status="progressStatus(item)"
              />
            </div>
            <div v-else-if="item.status === 'done'" class="file-card__state file-card__state--ok">
              <ArtSvgIcon icon="mdi:check-decagram" />
            </div>
            <div v-else-if="item.status === 'error'" class="file-card__state file-card__state--err">
              <ArtSvgIcon icon="mdi:alert-circle" />
            </div>
          </div>
          <div class="file-card__body">
            <div class="file-card__name-row">
              <span class="file-card__name" :title="item.file.name">{{
                truncateName(item.file.name, 22)
              }}</span>
            </div>
            <span v-if="getFileExtLabel(item.file.name)" class="file-card__ext-pill">{{
              getFileExtLabel(item.file.name)
            }}</span>
          </div>
          <div class="file-card__toolbar">
            <el-button
              v-if="item.status === 'done' && item.attachmentId"
              link
              type="primary"
              size="small"
              @click="preview(item)"
            >
              预览
            </el-button>
            <el-button
              v-if="item.status !== 'uploading'"
              link
              type="danger"
              size="small"
              @click="removeItem(item.id)"
            >
              移除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <AttachmentPreviewDialog
      v-model="previewVisible"
      :attachment-id="previewAttachmentId"
      :file-name="previewFileName"
      :mime-type="previewMimeType"
    />
  </div>
</template>

<script setup lang="ts">
  import type { UploadFile, UploadFiles } from 'element-plus';
  import {
    useTaskAttachmentQueue,
    type TaskFileUploadItem,
    type ExistingTaskAttachment
  } from '@/composables/useTaskAttachmentQueue';
  import AttachmentPreviewDialog from './AttachmentPreviewDialog.vue';
  import {
    getFileIcon,
    getFileCategoryClass,
    getFileTintRgb,
    getFileExtLabel
  } from '@/utils/fileTypeIcon';

  const props = withDefaults(
    defineProps<{
      disabled?: boolean;
      triggerText?: string;
      hint?: string;
    }>(),
    {
      disabled: false,
      triggerText: '选择文件（可选，可多选）',
      hint: ''
    }
  );

  const queue = useTaskAttachmentQueue();
  const {
    items,
    activeExisting,
    isUploading,
    addFiles,
    removeItem,
    removeExisting,
    uploadAll,
    getAttachmentIdsForSubmit,
    getAttachmentIds,
    reset,
    setExisting
  } = queue;

  const previewVisible = ref(false);
  const previewAttachmentId = ref<number | undefined>();
  const previewFileName = ref('');
  const previewMimeType = ref<string | null>(null);

  function fileIconFor(item: TaskFileUploadItem) {
    return getFileIcon(item.file.name, item.file.type);
  }

  function iconZoneStyle(item: TaskFileUploadItem) {
    return { '--ft-tint': getFileTintRgb(item.file.name, item.file.type) } as Record<string, string>;
  }

  function fileIconForExisting(ex: ExistingTaskAttachment) {
    return getFileIcon(ex.originalName, ex.mimeType ?? undefined);
  }

  function existingIconZoneStyle(ex: ExistingTaskAttachment) {
    return {
      '--ft-tint': getFileTintRgb(ex.originalName, ex.mimeType ?? '')
    } as Record<string, string>;
  }

  function onFileChange(uploadFile: UploadFile, _uploadFiles: UploadFiles) {
    const raw = uploadFile.raw;
    if (raw) addFiles([raw]);
  }

  function truncateName(name: string, max = 22) {
    return name.length <= max ? name : `${name.slice(0, max)}…`;
  }

  function progressStatus(item: TaskFileUploadItem) {
    if (item.status === 'error') return 'exception';
    if (item.status === 'done') return 'success';
    return undefined;
  }

  function openPreview(attachmentId: number, fileName: string, mimeType: string | null) {
    previewAttachmentId.value = attachmentId;
    previewFileName.value = fileName;
    previewMimeType.value = mimeType;
    previewVisible.value = true;
  }

  function preview(item: TaskFileUploadItem) {
    if (!item.attachmentId) return;
    openPreview(item.attachmentId, item.file.name, item.file.type || null);
  }

  function previewExisting(ex: ExistingTaskAttachment) {
    openPreview(ex.attachmentId, ex.originalName, ex.mimeType);
  }

  defineExpose({
    uploadAll,
    getAttachmentIdsForSubmit,
    getAttachmentIds,
    setExisting,
    reset,
    hasQueuedFiles: () => items.value.length > 0
  });
</script>

<style scoped lang="scss">
  .task-attach-field {
    width: 100%;
  }

  .trigger-btn {
    border: 1px dashed var(--el-border-color);
    background: var(--el-fill-color-light);
    transition:
      border-color 0.2s,
      background 0.2s,
      box-shadow 0.2s;

    &:hover:not(:disabled) {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
    }

    &__icon {
      margin-right: 6px;
      font-size: 18px;
      vertical-align: -3px;
    }
  }

  .hint {
    margin: 10px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
    gap: 14px;
    margin-top: 14px;
  }

  .file-card {
    --ft-tint: 120, 144, 156;

    &__surface {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 10px 10px 8px;
      border-radius: 14px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.04),
        0 4px 12px rgba(0, 0, 0, 0.03);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow:
          0 4px 16px rgba(0, 0, 0, 0.07),
          0 2px 4px rgba(0, 0, 0, 0.04);
        border-color: rgba(var(--ft-tint), 0.35);
      }
    }

    &__icon-zone {
      position: relative;
      width: 100%;
      height: 76px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(
        155deg,
        rgba(var(--ft-tint), 0.16) 0%,
        rgba(var(--ft-tint), 0.06) 100%
      );
      border: 1px solid rgba(var(--ft-tint), 0.2);
      overflow: hidden;
    }

    &__type-icon {
      font-size: 38px;
      color: rgb(var(--ft-tint));
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.06));
    }

    &__upload-mask {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(4px);
    }

    :deep(.file-card__upload-mask .el-progress--circle) {
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.08));
    }

    &__state {
      position: absolute;
      top: 6px;
      right: 6px;
      font-size: 18px;
      line-height: 1;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.12));

      &--ok {
        color: var(--el-color-success);
      }

      &--err {
        color: var(--el-color-danger);
      }
    }

    &__body {
      margin-top: 10px;
      text-align: center;
      min-height: 40px;
    }

    &__name-row {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.35;
    }

    &__name {
      font-size: 12.5px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      letter-spacing: 0.01em;
    }

    &__ext-pill {
      display: inline-block;
      margin-top: 6px;
      padding: 1px 8px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: rgb(var(--ft-tint));
      background: rgba(var(--ft-tint), 0.1);
      border-radius: 999px;
      border: 1px solid rgba(var(--ft-tint), 0.2);
    }

    &__toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 2px;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid var(--el-border-color-extra-light);
    }
  }

  html.dark .file-card__upload-mask {
    background: rgba(0, 0, 0, 0.45);
  }
</style>
