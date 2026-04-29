<!-- 附件预览：图片用 Element Plus 预览；Office/PDF 用 vue-office；纯文本直接展示 -->
<template>
  <ArtDialog
    v-model="modelValue"
    :title="fileName || '预览'"
    icon="solar:document-text-bold-duotone"
    width="min(900px, 92vw)"
    :max-height="'calc(88vh - 56px)'"
    :z-index="PREVIEW_DIALOG_Z_INDEX"
    :close-on-overlay="true"
    @maximize="onDialogMaximizeRestore"
    @restore="onDialogMaximizeRestore"
    @closed="onClosed"
  >
    <div
      v-loading="loading"
      class="preview-body"
      :class="{ 'preview-body--office': isOfficePreview }"
    >
      <template v-if="errorMsg">
        <el-alert type="error" :title="errorMsg" show-icon :closable="false" />
      </template>
      <template v-else-if="!loading && previewKind">
        <div v-if="previewKind === 'image' && imageUrl" class="image-preview">
          <el-image
            :src="imageUrl"
            fit="contain"
            :preview-src-list="[imageUrl]"
            :initial-index="0"
            preview-teleported
            hide-on-click-modal
            class="image-preview__img"
          />
        </div>

        <div v-else-if="previewKind === 'pdf' && officeBuffer" class="office-wrap">
          <VueOfficePdf
            :key="officeViewerKey"
            :src="officeBuffer"
            class="office-inner"
            @rendered="onOfficeRendered"
            @error="onOfficeError"
          />
        </div>

        <div v-else-if="previewKind === 'docx' && officeBuffer" class="office-wrap">
          <VueOfficeDocx
            :key="officeViewerKey"
            :src="officeBuffer"
            class="office-inner"
            @rendered="onOfficeRendered"
            @error="onOfficeError"
          />
        </div>

        <div v-else-if="previewKind === 'excel' && officeBuffer" class="office-wrap">
          <VueOfficeExcel
            :key="officeViewerKey"
            :src="officeBuffer"
            class="office-inner"
            @rendered="onOfficeRendered"
            @error="onOfficeError"
          />
        </div>

        <div v-else-if="previewKind === 'pptx' && officeBuffer" class="office-wrap">
          <VueOfficePptx
            :key="officeViewerKey"
            :src="officeBuffer"
            class="office-inner"
            @rendered="onOfficeRendered"
            @error="onOfficeError"
          />
        </div>

        <pre v-else-if="previewKind === 'text'" class="txt-preview">{{ textContent }}</pre>

        <template v-else-if="previewKind === 'unsupported'">
          <el-empty description="该类型不支持在线预览，请下载后查看">
            <el-button type="primary" @click="emitDownload">下载文件</el-button>
          </el-empty>
        </template>
      </template>
    </div>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue';
  import { downloadAttachmentBlob } from '@/api/attachment';
  import {
    resolveAttachmentPreviewKind,
    type AttachmentPreviewKind
  } from '@/utils/attachmentPreviewKind';

  import '@vue-office/docx/lib/index.css';
  import '@vue-office/excel/lib/index.css';

  /** 高于任务详情等 ArtDialog 的 z-index（9000），避免预览被遮挡 */
  const PREVIEW_DIALOG_Z_INDEX = 50000;

  // 使用各包 lib/v3/*.mjs（Vue3 ESM），避免走 lib/index.js 的 UMD 经 esbuild 预构建后与 Vue 运行时搅在一起导致 isFunction 未初始化
  const VueOfficePdf = defineAsyncComponent(
    () => import('@vue-office/pdf/lib/v3/vue-office-pdf.mjs')
  );
  const VueOfficeDocx = defineAsyncComponent(
    () => import('@vue-office/docx/lib/v3/vue-office-docx.mjs')
  );
  const VueOfficeExcel = defineAsyncComponent(
    () => import('@vue-office/excel/lib/v3/vue-office-excel.mjs')
  );
  const VueOfficePptx = defineAsyncComponent(
    () => import('@vue-office/pptx/lib/v3/vue-office-pptx.mjs')
  );

  const props = defineProps<{
    attachmentId?: number;
    fileName: string;
    mimeType: string | null;
  }>();

  const modelValue = defineModel<boolean>({ default: false });

  const loading = ref(false);
  const errorMsg = ref('');
  const imageUrl = ref<string | null>(null);
  const officeBuffer = ref<ArrayBuffer | Blob | null>(null);
  const textContent = ref('');
  const previewKind = ref<AttachmentPreviewKind | null>(null);

  const viewerKey = computed(() => `${props.attachmentId ?? 0}-${previewKind.value ?? ''}`);

  /** 最大化/还原后递增，强制 vue-office 按新容器尺寸重新挂载 */
  const officeLayoutEpoch = ref(0);
  const officeViewerKey = computed(() => `${viewerKey.value}-layout-${officeLayoutEpoch.value}`);

  const isOfficePreview = computed(() =>
    ['pdf', 'docx', 'excel', 'pptx'].includes(previewKind.value ?? '')
  );

  function onDialogMaximizeRestore() {
    nextTick(() => {
      requestAnimationFrame(() => {
        officeLayoutEpoch.value++;
      });
    });
  }

  function revokeImageUrl() {
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value);
      imageUrl.value = null;
    }
  }

  function resetPayload() {
    revokeImageUrl();
    officeBuffer.value = null;
    textContent.value = '';
    previewKind.value = null;
  }

  async function loadBlob() {
    const id = props.attachmentId;
    if (!id) return;
    loading.value = true;
    errorMsg.value = '';
    resetPayload();
    try {
      const { blob } = await downloadAttachmentBlob(id);
      const mime = blob.type || props.mimeType || '';
      const kind = resolveAttachmentPreviewKind(props.fileName, mime);
      previewKind.value = kind;

      if (kind === 'unsupported') {
        return;
      }

      if (kind === 'image') {
        imageUrl.value = URL.createObjectURL(blob);
        return;
      }

      if (kind === 'text') {
        textContent.value = await blob.text();
        return;
      }

      officeBuffer.value = await blob.arrayBuffer();
    } catch {
      errorMsg.value = '加载失败';
    } finally {
      loading.value = false;
    }
  }

  function onOfficeRendered() {
    /* vue-office 渲染完成 */
  }

  function onOfficeError() {
    errorMsg.value = '预览渲染失败，请尝试下载后查看';
  }

  watch(modelValue, (vis) => {
    if (vis && props.attachmentId) loadBlob();
  });

  function onClosed() {
    revokeImageUrl();
    officeBuffer.value = null;
    textContent.value = '';
    errorMsg.value = '';
    previewKind.value = null;
    officeLayoutEpoch.value = 0;
  }

  async function emitDownload() {
    if (!props.attachmentId) return;
    try {
      const { blob, name } = await downloadAttachmentBlob(props.attachmentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name || props.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      errorMsg.value = '下载失败';
    }
  }
</script>

<style scoped lang="scss">
  /* 纵向滚动只交给 ArtDialog 的 .art-dialog__body（overflow-y: auto），此处不再套 max-height + overflow，避免双滚动条 */

  .preview-body {
    min-height: 120px;
  }

  /* Office 预览：占满弹窗内容区高度，便于最大化后纵向空间与 vue-office 一致 */
  .preview-body--office {
    display: flex;
    flex-direction: column;
    min-height: min(56vh, 520px);
    flex: 1 1 auto;
  }

  .preview-body--office .office-wrap {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .image-preview {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 200px;

    :deep(.image-preview__img) {
      max-width: 100%;
    }

    :deep(.el-image__inner) {
      max-width: 100%;
      height: auto !important;
      object-fit: contain;
    }
  }

  .office-wrap {
    width: 100%;
    min-height: 280px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-blank);
  }

  .office-inner {
    flex: 1 1 auto;
    min-height: min(52vh, 640px);
    width: 100%;
  }

  .txt-preview {
    margin: 0;
    padding: 12px 14px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }
</style>
