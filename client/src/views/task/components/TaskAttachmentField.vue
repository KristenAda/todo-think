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
    <div v-if="activeExisting.length || items.length" class="file-list">
      <div
        v-for="ex in activeExisting"
        :key="'ex-' + ex.attachmentId"
        class="file-card"
        :class="getFileCategoryClass(ex.originalName, ex.mimeType ?? '')"
        :style="existingIconZoneStyle(ex)"
      >
        <div class="file-card__surface">
          <div class="file-card__icon-zone" aria-hidden="true">
            <ArtSvgIcon :icon="fileIconForExisting(ex)" class="file-card__type-icon" />
            <div class="file-card__state file-card__state--ok">
              <ArtSvgIcon icon="mdi:check-decagram" />
            </div>
          </div>
          <div class="file-card__right">
            <div class="file-card__detail">
              <p class="file-card__title" :title="ex.originalName">
                {{ truncateName(ex.originalName, 52) }}
              </p>
              <div class="file-card__spec-row">
                <span class="file-card__spec-part">
                  <span class="file-card__spec-key">类型</span>
                  <span class="file-card__spec-val file-card__spec-val--accent">{{
                    typeValue(ex.originalName, ex.mimeType)
                  }}</span>
                </span>
                <span class="file-card__spec-sep" aria-hidden="true">·</span>
                <span class="file-card__spec-part">
                  <span class="file-card__spec-key">大小</span>
                  <span class="file-card__spec-val">{{ sizeValue(ex.size) }}</span>
                </span>
              </div>
            </div>
            <div class="file-card__actions">
              <el-button
                class="file-card__action-btn"
                text
                type="primary"
                size="small"
                @click="previewExisting(ex)"
              >
                <art-svg-icon icon="mdi:eye-outline" class="file-card__action-ico" />
                预览
              </el-button>
              <el-button
                class="file-card__action-btn file-card__action-btn--danger"
                text
                type="danger"
                size="small"
                @click="removeExisting(ex.attachmentId)"
              >
                <art-svg-icon icon="mdi:trash-can-outline" class="file-card__action-ico" />
                移除
              </el-button>
            </div>
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
          <div class="file-card__icon-zone" aria-hidden="true">
            <ArtSvgIcon :icon="fileIconFor(item)" class="file-card__type-icon" />
            <div v-if="item.status === 'uploading'" class="file-card__upload-mask">
              <el-progress
                type="circle"
                :percentage="item.percent"
                :width="26"
                :stroke-width="2"
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
          <div class="file-card__right">
            <div class="file-card__detail">
              <p class="file-card__title" :title="item.file.name">
                {{ truncateName(item.file.name, 52) }}
              </p>
              <div class="file-card__spec-row">
                <span class="file-card__spec-part">
                  <span class="file-card__spec-key">类型</span>
                  <span class="file-card__spec-val file-card__spec-val--accent">{{
                    typeValue(item.file.name, item.file.type || null)
                  }}</span>
                </span>
                <span class="file-card__spec-sep" aria-hidden="true">·</span>
                <span class="file-card__spec-part">
                  <span class="file-card__spec-key">大小</span>
                  <span class="file-card__spec-val">{{ sizeValue(item.file.size) }}</span>
                </span>
              </div>
            </div>
            <div class="file-card__actions">
              <el-button
                v-if="item.status === 'done' && item.attachmentId"
                class="file-card__action-btn"
                text
                type="primary"
                size="small"
                @click="preview(item)"
              >
                <art-svg-icon icon="mdi:eye-outline" class="file-card__action-ico" />
                预览
              </el-button>
              <el-button
                v-if="item.status !== 'uploading'"
                class="file-card__action-btn file-card__action-btn--danger"
                text
                type="danger"
                size="small"
                @click="removeItem(item.id)"
              >
                <art-svg-icon icon="mdi:trash-can-outline" class="file-card__action-ico" />
                移除
              </el-button>
            </div>
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
  import type { UploadFile } from 'element-plus';
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

  withDefaults(
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
    return { '--ft-tint': getFileTintRgb(item.file.name, item.file.type) } as Record<
      string,
      string
    >;
  }

  function fileIconForExisting(ex: ExistingTaskAttachment) {
    return getFileIcon(ex.originalName, ex.mimeType ?? undefined);
  }

  function existingIconZoneStyle(ex: ExistingTaskAttachment) {
    return {
      '--ft-tint': getFileTintRgb(ex.originalName, ex.mimeType ?? '')
    } as Record<string, string>;
  }

  function onFileChange(uploadFile: UploadFile) {
    const raw = uploadFile.raw;
    if (raw) addFiles([raw]);
  }

  function truncateName(name: string, max = 52) {
    return name.length <= max ? name : `${name.slice(0, max)}…`;
  }

  function formatBytes(n: number): string {
    if (!Number.isFinite(n) || n < 0) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  function sizeValue(bytes: number | undefined) {
    if (bytes == null) return '—';
    return formatBytes(bytes);
  }

  function typeValue(fileName: string, mimeType: string | null) {
    const ext = getFileExtLabel(fileName);
    if (ext) return ext;
    if (mimeType) {
      const sub = mimeType.split('/')[1];
      if (sub) return sub.toUpperCase();
    }
    return '未知';
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
    border: 1px dashed color-mix(in srgb, var(--el-color-primary) 28%, var(--el-border-color));
    background: linear-gradient(
      165deg,
      color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color)) 0%,
      var(--el-fill-color-light) 100%
    );
    color: var(--el-text-color-primary);
    transition:
      border-color 0.22s ease,
      background 0.22s ease,
      box-shadow 0.22s ease,
      transform 0.18s ease;

    &:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
      background: linear-gradient(
        165deg,
        var(--el-color-primary-light-9) 0%,
        color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color)) 100%
      );
      box-shadow:
        0 4px 18px color-mix(in srgb, var(--el-color-primary) 12%, transparent),
        0 1px 2px rgba(0, 0, 0, 0.04);
      transform: translateY(-1px);
    }

    &__icon {
      margin-right: 6px;
      font-size: 18px;
      vertical-align: -3px;
      opacity: 0.92;
    }
  }

  .hint {
    margin: 10px 0 0;
    font-size: 12px;
    line-height: 1.55;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.02em;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-top: 10px;
  }

  .file-card {
    --ft-tint: 120, 144, 156;

    &__surface {
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0;
      max-height: 80px;
      padding: 5px 8px;
      border-radius: 10px;
      overflow: hidden;
      background: linear-gradient(
        145deg,
        color-mix(in srgb, rgb(var(--ft-tint)) 5%, var(--el-bg-color)) 0%,
        var(--el-bg-color) 48%,
        var(--el-bg-color) 100%
      );
      border: 1px solid color-mix(in srgb, rgb(var(--ft-tint)) 18%, var(--el-border-color-lighter));
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.06) inset,
        0 1px 2px rgba(0, 0, 0, 0.04),
        0 8px 20px rgba(0, 0, 0, 0.04);
      transition:
        border-color 0.25s ease,
        box-shadow 0.25s ease,
        transform 0.2s ease;

      &:hover {
        border-color: color-mix(in srgb, rgb(var(--ft-tint)) 38%, var(--el-border-color-lighter));
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.08) inset,
          0 3px 10px rgba(0, 0, 0, 0.05),
          0 12px 28px color-mix(in srgb, rgb(var(--ft-tint)) 12%, transparent);
        transform: translateY(-1px);
      }
    }

    &__icon-zone {
      position: relative;
      flex: 0 0 34px;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(
        120% 120% at 30% 20%,
        rgba(var(--ft-tint), 0.22) 0%,
        rgba(var(--ft-tint), 0.07) 55%,
        rgba(var(--ft-tint), 0.04) 100%
      );
      border: 1px solid color-mix(in srgb, rgb(var(--ft-tint)) 28%, transparent);
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.1) inset,
        0 3px 10px color-mix(in srgb, rgb(var(--ft-tint)) 10%, transparent);
      overflow: hidden;
    }

    &__type-icon {
      font-size: 17px;
      color: rgb(var(--ft-tint));
      filter: drop-shadow(0 1px 2px color-mix(in srgb, rgb(var(--ft-tint)) 20%, transparent));
    }

    &__upload-mask {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--el-bg-color) 72%, transparent);
      backdrop-filter: blur(6px);
    }

    :deep(.file-card__upload-mask .el-progress--circle) {
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08));
    }

    &__state {
      position: absolute;
      top: 1px;
      right: 1px;
      font-size: 10px;
      line-height: 1;
      filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12));

      &--ok {
        color: var(--el-color-success);
      }

      &--err {
        color: var(--el-color-danger);
      }
    }

    /* 右侧：严格上下结构 — 上块信息、下块操作 */
    &__right {
      flex: 1;
      min-width: 0;
      min-height: 0;
      max-height: 70px;
      margin-left: 8px;
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
      background: color-mix(in srgb, var(--el-fill-color-blank) 88%, var(--el-bg-color));
      border: 1px solid var(--el-border-color-extra-light);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;
    }

    &__detail {
      flex: 1 1 auto;
      min-height: 0;
      padding: 4px 8px 3px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      justify-content: center;
      border-bottom: 1px solid var(--el-border-color-extra-light);
      background: linear-gradient(
        180deg,
        color-mix(in srgb, rgb(var(--ft-tint)) 4%, transparent) 0%,
        transparent 72%
      );
    }

    &__title {
      margin: 0;
      font-size: 12.5px;
      font-weight: 600;
      line-height: 1.3;
      letter-spacing: -0.01em;
      color: var(--el-text-color-primary);
      display: -webkit-box;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* 类型与大小同一行：标签+值横向排列，中间分隔符 */
    &__spec-row {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
      gap: 6px;
      min-width: 0;
      font-size: 11px;
      line-height: 1.25;
    }

    &__spec-part {
      display: inline-flex;
      flex-direction: row;
      align-items: baseline;
      gap: 3px;
      min-width: 0;
      flex: 0 1 auto;
      overflow: hidden;
    }

    &__spec-key {
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 600;
      color: var(--el-text-color-placeholder);
      letter-spacing: 0.06em;
    }

    &__spec-val {
      font-weight: 600;
      color: var(--el-text-color-regular);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__spec-val--accent {
      color: rgb(var(--ft-tint));
    }

    &__spec-sep {
      flex-shrink: 0;
      color: var(--el-text-color-placeholder);
      opacity: 0.55;
      font-weight: 500;
      transform: translateY(-0.5px);
    }

    &__actions {
      flex-shrink: 0;
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: flex-end;
      gap: 0;
      padding: 2px 6px 3px;
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--el-fill-color-light) 55%, transparent) 0%,
        var(--el-fill-color-blank) 100%
      );
    }

    &__action-ico {
      margin-right: 2px;
      font-size: 12px;
      vertical-align: -2px;
      opacity: 0.92;
    }

    :deep(.file-card__action-btn) {
      margin: 0;
      padding: 2px 7px;
      height: auto;
      min-height: 0;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.02em;
      transition:
        background 0.18s ease,
        color 0.18s ease;

      &:hover {
        background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
      }
    }

    :deep(.file-card__action-btn--danger:hover) {
      background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
    }
  }

  html.dark .file-card__upload-mask {
    background: color-mix(in srgb, var(--el-bg-color) 55%, transparent);
  }

  html.dark .file-card__right {
    background: color-mix(in srgb, var(--el-fill-color-dark) 35%, var(--el-bg-color));
  }

  html.dark .file-card__actions {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.12) 100%);
  }
</style>
