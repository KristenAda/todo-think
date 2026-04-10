import { ref } from 'vue';
import {
  fetchAttachmentInit,
  fetchAttachmentMerge,
  fetchAttachmentUploadStatus,
  uploadAttachmentChunk,
  type MergeUploadResult
} from '@/api/attachment';

const DEFAULT_CHUNK = 2 * 1024 * 1024;

function cacheKey(file: File) {
  return `chunk-upload:${file.name}:${file.size}:${file.lastModified}`;
}

function setProgress(
  onProgress: ((pct: number) => void) | undefined,
  refVal: { value: number } | undefined,
  pct: number
) {
  const v = Math.min(100, Math.round(pct));
  if (onProgress) onProgress(v);
  else if (refVal) refVal.value = v;
}

/**
 * 分片上传核心（断点续传），进度通过 onProgress 或 progressRef 输出
 */
export async function uploadAttachmentFile(
  file: File,
  options?: {
    chunkSize?: number;
    onProgress?: (percent: number) => void;
    progressRef?: { value: number };
  }
): Promise<MergeUploadResult> {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK;
  const onProgress = options?.onProgress;
  const progressRef = options?.progressRef;

  const ck = cacheKey(file);
  let uploadId: string;
  let totalChunks: number;

  const cached = sessionStorage.getItem(ck);
  if (cached) {
    try {
      const { uploadId: uid } = JSON.parse(cached) as { uploadId: string };
      const st = await fetchAttachmentUploadStatus(uid);
      if (st.status === 'pending' && st.totalSize === file.size && st.chunkSize === chunkSize) {
        uploadId = uid;
        totalChunks = st.totalChunks;
      } else {
        sessionStorage.removeItem(ck);
        throw new Error('retry-init');
      }
    } catch {
      sessionStorage.removeItem(ck);
      const init = await fetchAttachmentInit({
        fileName: file.name,
        totalSize: file.size,
        chunkSize,
        mimeType: file.type || undefined
      });
      uploadId = init.uploadId;
      totalChunks = init.totalChunks;
      sessionStorage.setItem(ck, JSON.stringify({ uploadId }));
    }
  } else {
    const init = await fetchAttachmentInit({
      fileName: file.name,
      totalSize: file.size,
      chunkSize,
      mimeType: file.type || undefined
    });
    uploadId = init.uploadId;
    totalChunks = init.totalChunks;
    sessionStorage.setItem(ck, JSON.stringify({ uploadId }));
  }

  let status = await fetchAttachmentUploadStatus(uploadId);
  let done = new Set(status.uploadedChunkIndexes);

  for (let i = 0; i < totalChunks; i++) {
    if (done.has(i)) {
      setProgress(onProgress, progressRef, ((i + 1) / totalChunks) * 100);
      continue;
    }

    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const blob = file.slice(start, end);

    await uploadAttachmentChunk(uploadId, i, blob, file.name, (chunkPct) => {
      const base = (i / totalChunks) * 100;
      const seg = (1 / totalChunks) * chunkPct;
      setProgress(onProgress, progressRef, Math.min(99, base + seg));
    });

    setProgress(onProgress, progressRef, ((i + 1) / totalChunks) * 100);
  }

  const merged = await fetchAttachmentMerge(uploadId);
  sessionStorage.removeItem(ck);
  setProgress(onProgress, progressRef, 100);
  return merged;
}

export function useChunkUpload() {
  const uploading = ref(false);
  const progressPercent = ref(0);
  const errorMessage = ref('');

  /**
   * 上传文件（分片 + 断点续传 + 总进度）
   */
  async function upload(file: File, chunkSize: number = DEFAULT_CHUNK): Promise<MergeUploadResult> {
    uploading.value = true;
    errorMessage.value = '';
    progressPercent.value = 0;

    try {
      return await uploadAttachmentFile(file, {
        chunkSize,
        progressRef: progressPercent
      });
    } catch (e: any) {
      errorMessage.value = e?.response?.data?.message ?? e?.message ?? '上传失败';
      throw e;
    } finally {
      uploading.value = false;
    }
  }

  return { uploading, progressPercent, errorMessage, upload };
}
