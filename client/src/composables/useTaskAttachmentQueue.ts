import { ref, computed } from 'vue';
import type { MergeUploadResult } from '@/api/attachment';
import { uploadAttachmentFile } from '@/composables/useChunkUpload';

export interface TaskFileUploadItem {
  id: string;
  file: File;
  percent: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  attachmentId?: number;
  error?: string;
}

/** 编辑任务时：已在任务上的附件（来自服务端） */
export interface ExistingTaskAttachment {
  linkId: number;
  attachmentId: number;
  originalName: string;
  mimeType: string | null;
  /** 字节，来自服务端；无则展示为 — */
  size?: number;
  sort: number;
}

/** 任务表单 / 工时登记：多文件排队、挨个上传、每文件独立环形进度；支持保留/移除已有附件 */
export function useTaskAttachmentQueue() {
  const items = ref<TaskFileUploadItem[]>([]);
  const isUploading = ref(false);

  const existing = ref<ExistingTaskAttachment[]>([]);
  const removedAttachmentIds = ref<Set<number>>(new Set());

  const hasPending = computed(() =>
    items.value.some((x) => x.status === 'pending' || x.status === 'uploading')
  );

  /** 未移除的已有附件（按 sort） */
  const activeExisting = computed(() =>
    existing.value
      .filter((e) => !removedAttachmentIds.value.has(e.attachmentId))
      .sort((a, b) => a.sort - b.sort)
  );

  function setExisting(list: ExistingTaskAttachment[] | null | undefined) {
    items.value = [];
    if (!list?.length) {
      existing.value = [];
    } else {
      existing.value = [...list].sort((a, b) => a.sort - b.sort);
    }
    removedAttachmentIds.value = new Set();
  }

  function removeExisting(attachmentId: number) {
    removedAttachmentIds.value.add(attachmentId);
  }

  function restoreExisting(attachmentId: number) {
    removedAttachmentIds.value.delete(attachmentId);
  }

  function isExistingRemoved(attachmentId: number) {
    return removedAttachmentIds.value.has(attachmentId);
  }

  function addFiles(fileList: File[] | FileList) {
    const arr = Array.from(fileList);
    for (const f of arr) {
      items.value.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        percent: 0,
        status: 'pending'
      });
    }
  }

  function removeItem(id: string) {
    const i = items.value.findIndex((x) => x.id === id);
    if (i >= 0 && items.value[i].status !== 'uploading') {
      items.value.splice(i, 1);
    }
  }

  function reset() {
    items.value = [];
    existing.value = [];
    removedAttachmentIds.value = new Set();
  }

  /**
   * 上传队列中新文件（已有附件无需上传）
   */
  async function uploadAll(): Promise<void> {
    isUploading.value = true;
    try {
      for (const item of items.value) {
        if (item.status === 'done' && item.attachmentId != null) continue;
        item.status = 'uploading';
        item.percent = 0;
        item.error = undefined;
        try {
          const merged: MergeUploadResult = await uploadAttachmentFile(item.file, {
            onProgress: (p) => {
              item.percent = p;
            }
          });
          item.attachmentId = merged.attachmentId;
          item.status = 'done';
          item.percent = 100;
        } catch (e: unknown) {
          item.status = 'error';
          item.error = (e as Error)?.message ?? '上传失败';
          throw e;
        }
      }
    } finally {
      isUploading.value = false;
    }
  }

  /**
   * 提交用：保留的已有附件 id（顺序） + 新上传成功的 id（顺序接在后面）
   */
  function getAttachmentIdsForSubmit(): number[] {
    const kept = activeExisting.value.map((e) => e.attachmentId);
    const newIds = items.value
      .filter((x) => x.status === 'done' && x.attachmentId != null)
      .map((x) => x.attachmentId!);
    return [...kept, ...newIds];
  }

  /** @deprecated 仅新文件 id，请用 getAttachmentIdsForSubmit */
  function getAttachmentIds(): number[] {
    return getAttachmentIdsForSubmit();
  }

  return {
    items,
    isUploading,
    hasPending,
    existing,
    activeExisting,
    removedAttachmentIds,
    setExisting,
    removeExisting,
    restoreExisting,
    isExistingRemoved,
    addFiles,
    removeItem,
    reset,
    uploadAll,
    getAttachmentIdsForSubmit,
    getAttachmentIds
  };
}
