import request from '@/utils/http';
import axios from 'axios';
import { useUserStore } from '@/store/modules/user';

const BASE = '/attachments';

export interface InitUploadParams {
  fileName: string;
  totalSize: number;
  chunkSize: number;
  mimeType?: string;
}

export interface InitUploadResult {
  uploadId: string;
  totalChunks: number;
  chunkSize: number;
  expiresAt: string;
}

export interface UploadStatusResult {
  uploadId: string;
  totalChunks: number;
  chunkSize: number;
  totalSize: number;
  status: string;
  uploadedChunkIndexes: number[];
  expiresAt: string;
}

export interface MergeUploadResult {
  attachmentId: number;
  storedPath: string;
  originalName: string;
  size: number;
}

export function fetchAttachmentInit(data: InitUploadParams) {
  return request.post<InitUploadResult>({ url: `${BASE}/upload/init`, data });
}

export function fetchAttachmentMerge(uploadId: string) {
  return request.post<MergeUploadResult>({ url: `${BASE}/upload/merge`, data: { uploadId } });
}

export function fetchAttachmentUploadStatus(uploadId: string) {
  return request.get<UploadStatusResult>({ url: `${BASE}/upload/${uploadId}/status` });
}

export interface AttachmentItem {
  id: number;
  originalName: string;
  storedPath: string;
  mimeType: string | null;
  size: number;
  createTime: string;
  uploadedBy: { id: number; userName: string; nickName: string | null };
}

export function fetchAttachmentPage(params: { page?: number; pageSize?: number; keyword?: string }) {
  return request.get<{
    list: AttachmentItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPage: number;
  }>({ url: BASE, params });
}

export function fetchAttachmentDelete(id: number) {
  return request.del({ url: `${BASE}/${id}` });
}

/**
 * 分片上传（单块），带进度回调（占整文件比例中的一段）
 */
export function uploadAttachmentChunk(
  uploadId: string,
  chunkIndex: number,
  chunkBlob: Blob,
  fileName: string,
  onProgress: (percent: number) => void
) {
  const fd = new FormData();
  fd.append('uploadId', uploadId);
  fd.append('chunkIndex', String(chunkIndex));
  fd.append('file', chunkBlob, fileName);

  const { VITE_API_URL } = import.meta.env;
  const { accessToken } = useUserStore();

  return axios.post(`${VITE_API_URL}${BASE}/upload/chunk`, fd, {
    headers: {
      Authorization: accessToken ? `Bearer ${accessToken}` : '',
      'Content-Type': 'multipart/form-data'
    },
    timeout: 300000,
    onUploadProgress: (ev) => {
      if (!ev.total) return;
      onProgress(Math.round((ev.loaded / ev.total) * 100));
    }
  });
}

/** 带鉴权下载为 Blob，用于浏览器保存 */
export async function downloadAttachmentBlob(id: number): Promise<{ blob: Blob; name: string }> {
  const { VITE_API_URL } = import.meta.env;
  const { accessToken } = useUserStore();
  const res = await axios.get(`${VITE_API_URL}${BASE}/${id}/download`, {
    responseType: 'blob',
    timeout: 300000,
    headers: {
      Authorization: accessToken ? `Bearer ${accessToken}` : ''
    }
  });
  const dispo = res.headers['content-disposition'] as string | undefined;
  let name = `file-${id}`;
  if (dispo) {
    const m = /filename\*=UTF-8''([^;]+)/i.exec(dispo);
    if (m?.[1]) name = decodeURIComponent(m[1]);
  }
  return { blob: res.data as Blob, name };
}
