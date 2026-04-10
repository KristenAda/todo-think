import { z } from "zod";

export const InitUploadDto = z.object({
  fileName: z.string().min(1).max(200),
  totalSize: z.number().int().positive(),
  chunkSize: z.number().int().positive(),
  mimeType: z.string().max(200).optional(),
});
export type InitUploadDtoType = z.infer<typeof InitUploadDto>;

export const MergeUploadDto = z.object({
  uploadId: z.string().uuid(),
});
export type MergeUploadDtoType = z.infer<typeof MergeUploadDto>;

export const AttachmentPageDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  keyword: z.string().optional(),
});
export type AttachmentPageDtoType = z.infer<typeof AttachmentPageDto>;
