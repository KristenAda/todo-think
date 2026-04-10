import { Context } from "koa";
import formidable from "formidable";
import { Result } from "@/core/result";
import attachmentService from "./attachment.service";
import {
  AttachmentPageDto,
  InitUploadDto,
  MergeUploadDto,
} from "./attachment.dto";
import { isSuperAdminRoles } from "@/utils/role.util";
import { UPLOAD_MAX_CHUNK_BYTES } from "@/core/upload.config";

function currentUserId(ctx: Context): number {
  return (ctx.state as any).user?.id as number;
}

class AttachmentController {
  /** 初始化分片上传（JSON） */
  async init(ctx: Context) {
    const parsed = InitUploadDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues[0]?.message ?? "参数错误");
      return;
    }
    const data = await attachmentService.initUpload(currentUserId(ctx), parsed.data);
    ctx.body = Result.success(data);
  }

  /** 上传单个分片（multipart：uploadId、chunkIndex、file） */
  async uploadChunk(ctx: Context) {
    const userId = currentUserId(ctx);
    const form = formidable({
      maxFileSize: UPLOAD_MAX_CHUNK_BYTES + 1024 * 1024,
      allowEmptyFiles: false,
    });
    let fields: formidable.Fields;
    let files: formidable.Files;
    try {
      [fields, files] = await form.parse(ctx.req);
    } catch (e: any) {
      ctx.body = Result.error(e?.message ?? "分片解析失败");
      return;
    }

    const uploadId = String(fields.uploadId?.[0] ?? "");
    const chunkIndex = Number(fields.chunkIndex?.[0]);
    const fileArr = files.file ?? files.chunk;
    const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;
    if (!uploadId || Number.isNaN(chunkIndex) || !file) {
      ctx.body = Result.error("请提供 uploadId、chunkIndex 与文件字段 file");
      return;
    }

    const tempPath = (file as formidable.File).filepath;
    try {
      const r = await attachmentService.saveChunk(userId, uploadId, chunkIndex, tempPath);
      ctx.body = Result.success(r);
    } catch (e: any) {
      ctx.status = e.status ?? 400;
      ctx.body = Result.error(e.message ?? "上传失败", e.status ?? 400);
    }
  }

  /** 查询已上传分片（断点续传） */
  async status(ctx: Context) {
    const uploadId = ctx.params.uploadId;
    try {
      const data = await attachmentService.getUploadStatus(currentUserId(ctx), uploadId);
      ctx.body = Result.success(data);
    } catch (e: any) {
      ctx.status = e.status ?? 400;
      ctx.body = Result.error(e.message ?? "查询失败", e.status ?? 400);
    }
  }

  /** 合并分片并落库 */
  async merge(ctx: Context) {
    const parsed = MergeUploadDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues[0]?.message ?? "参数错误");
      return;
    }
    try {
      const data = await attachmentService.mergeUpload(
        currentUserId(ctx),
        parsed.data.uploadId,
      );
      ctx.body = Result.success(data);
    } catch (e: any) {
      ctx.status = e.status ?? 400;
      ctx.body = Result.error(e.message ?? "合并失败", e.status ?? 400);
    }
  }

  /**
   * 下载附件（需登录；不挂静态目录，仅经此接口输出流）
   */
  async download(ctx: Context) {
    const id = Number(ctx.params.id);
    if (!id) {
      ctx.status = 400;
      ctx.body = Result.error("无效 id", 400);
      return;
    }
    try {
      const { attachment, stream } = await attachmentService.getDownloadStream(
        id,
        currentUserId(ctx),
      );
      const name = encodeURIComponent(attachment.originalName);
      ctx.set(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${name}`,
      );
      ctx.type = attachment.mimeType || "application/octet-stream";
      ctx.body = stream;
    } catch (e: any) {
      ctx.status = e.status ?? 404;
      ctx.body = Result.error(e.message ?? "下载失败", e.status ?? 404);
    }
  }

  /** 分页列表 */
  async page(ctx: Context) {
    const parsed = AttachmentPageDto.safeParse(ctx.query);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues[0]?.message ?? "参数错误");
      return;
    }
    const { page, pageSize, keyword } = parsed.data;
    const roles = ((ctx.state as any).user?.roles ?? []) as string[];
    const listAll = isSuperAdminRoles(roles);
    const { list, total } = await attachmentService.page(
      currentUserId(ctx),
      page,
      pageSize,
      keyword,
      listAll,
    );
    ctx.body = Result.page(list, total, page, pageSize);
  }

  /** 删除（本人或超级管理员） */
  async remove(ctx: Context) {
    const id = Number(ctx.params.id);
    const roles = ((ctx.state as any).user?.roles ?? []) as string[];
    const isAdmin = isSuperAdminRoles(roles);
    try {
      await attachmentService.softDelete(id, currentUserId(ctx), isAdmin);
      ctx.body = Result.success(null, "已删除");
    } catch (e: any) {
      ctx.status = e.status ?? 400;
      ctx.body = Result.error(e.message ?? "删除失败", e.status ?? 400);
    }
  }
}

export default new AttachmentController();
