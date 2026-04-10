import fs from "fs/promises";
import path from "path";
import { createReadStream } from "fs";
import { randomUUID } from "crypto";
import prisma from "@/core/prisma";
import {
  CHUNK_SUBDIR,
  UPLOAD_MAX_FILE_BYTES,
  UPLOAD_MAX_CHUNK_BYTES,
  UPLOAD_MIN_CHUNK_BYTES,
  UPLOAD_ROOT,
  UPLOAD_SESSION_TTL_MS,
  chunkSessionDir,
  ensureUploadDirs,
} from "@/core/upload.config";

function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[\\/]/g, "");
  return base.replace(/[^a-zA-Z0-9._\-()\u4e00-\u9fff]/g, "_").slice(0, 180) || "file";
}

function assertPathUnderRoot(absPath: string, root: string): void {
  const resolved = path.resolve(absPath);
  const rootResolved = path.resolve(root);
  if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
    throw { status: 400, message: "非法路径" };
  }
}

/** 同卷用 rename；跨卷（如系统盘 Temp → 项目盘 uploads）会报 EXDEV，需 copy + unlink */
async function moveFileTo(src: string, dest: string): Promise<void> {
  try {
    await fs.rename(src, dest);
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "EXDEV" || err.code === "ENOTSUP") {
      await fs.copyFile(src, dest);
      await fs.unlink(src);
    } else {
      throw e;
    }
  }
}

export interface InitUploadInput {
  fileName: string;
  totalSize: number;
  chunkSize: number;
  mimeType?: string;
}

class AttachmentService {
  constructor() {
    ensureUploadDirs();
  }

  async initUpload(userId: number, input: InitUploadInput) {
    const { fileName, totalSize, chunkSize, mimeType } = input;
    if (totalSize <= 0 || totalSize > UPLOAD_MAX_FILE_BYTES) {
      throw { status: 400, message: `文件大小须在 1 ~ ${UPLOAD_MAX_FILE_BYTES} 字节之间` };
    }
    if (chunkSize < UPLOAD_MIN_CHUNK_BYTES || chunkSize > UPLOAD_MAX_CHUNK_BYTES) {
      throw {
        status: 400,
        message: `分片大小须在 ${UPLOAD_MIN_CHUNK_BYTES} ~ ${UPLOAD_MAX_CHUNK_BYTES} 字节之间`,
      };
    }
    const totalChunks = Math.ceil(totalSize / chunkSize);
    if (totalChunks > 10000) {
      throw { status: 400, message: "分片数量过多，请增大分片大小" };
    }

    const safe = sanitizeFileName(fileName);
    const expiresAt = new Date(Date.now() + UPLOAD_SESSION_TTL_MS);

    const session = await prisma.uploadSession.create({
      data: {
        fileName: safe,
        mimeType: mimeType ?? null,
        totalSize,
        chunkSize,
        totalChunks,
        userId,
        status: "pending",
        expiresAt,
      },
    });

    const dir = chunkSessionDir(session.id);
    await fs.mkdir(dir, { recursive: true });

    return {
      uploadId: session.id,
      totalChunks,
      chunkSize,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async saveChunk(
    userId: number,
    uploadId: string,
    chunkIndex: number,
    tempFilePath: string,
  ) {
    const session = await prisma.uploadSession.findUnique({ where: { id: uploadId } });
    if (!session) throw { status: 404, message: "上传会话不存在" };
    if (session.userId !== userId) throw { status: 403, message: "无权操作该上传会话" };
    if (session.status !== "pending") {
      throw { status: 400, message: "上传会话已结束" };
    }
    if (new Date() > session.expiresAt) {
      throw { status: 400, message: "上传会话已过期，请重新发起" };
    }
    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw { status: 400, message: "分片序号无效" };
    }

    const destDir = chunkSessionDir(uploadId);
    assertPathUnderRoot(destDir, UPLOAD_ROOT);
    const destPath = path.join(destDir, `${chunkIndex}.part`);
    assertPathUnderRoot(destPath, UPLOAD_ROOT);

    const st = await fs.stat(tempFilePath);
    const expectedLen =
      chunkIndex === session.totalChunks - 1
        ? session.totalSize - chunkIndex * session.chunkSize
        : session.chunkSize;
    if (st.size !== expectedLen) {
      await fs.unlink(tempFilePath).catch(() => {});
      throw { status: 400, message: "分片大小与预期不符" };
    }

    await moveFileTo(tempFilePath, destPath);
    return { ok: true, chunkIndex };
  }

  async getUploadStatus(userId: number, uploadId: string) {
    const session = await prisma.uploadSession.findUnique({ where: { id: uploadId } });
    if (!session) throw { status: 404, message: "上传会话不存在" };
    if (session.userId !== userId) throw { status: 403, message: "无权查看该上传会话" };

    const dir = chunkSessionDir(uploadId);
    let uploaded: number[] = [];
    try {
      const names = await fs.readdir(dir);
      uploaded = names
        .filter((n) => /^\d+\.part$/.test(n))
        .map((n) => Number(n.replace(".part", "")))
        .sort((a, b) => a - b);
    } catch {
      uploaded = [];
    }

    return {
      uploadId,
      totalChunks: session.totalChunks,
      chunkSize: session.chunkSize,
      totalSize: session.totalSize,
      status: session.status,
      uploadedChunkIndexes: uploaded,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async mergeUpload(userId: number, uploadId: string) {
    const session = await prisma.uploadSession.findUnique({
      where: { id: uploadId },
      include: { attachment: true },
    });
    if (!session) throw { status: 404, message: "上传会话不存在" };
    if (session.userId !== userId) throw { status: 403, message: "无权操作该上传会话" };
    if (session.status === "merged" && session.attachment) {
      const att = session.attachment;
      return {
        attachmentId: att.id,
        storedPath: att.storedPath,
        originalName: att.originalName,
        size: att.size,
      };
    }
    if (session.status !== "pending") {
      throw { status: 400, message: "上传会话无法合并" };
    }
    if (new Date() > session.expiresAt) {
      throw { status: 400, message: "上传会话已过期" };
    }

    const dir = chunkSessionDir(uploadId);
    for (let i = 0; i < session.totalChunks; i++) {
      const p = path.join(dir, `${i}.part`);
      try {
        await fs.access(p);
      } catch {
        throw { status: 400, message: `缺少分片 ${i}，请续传后重试` };
      }
    }

    const yyyy = new Date().getFullYear();
    const mm = String(new Date().getMonth() + 1).padStart(2, "0");
    const relDir = path.posix.join("attachments", String(yyyy), mm);
    const absDir = path.join(UPLOAD_ROOT, relDir.replace(/\//g, path.sep));
    await fs.mkdir(absDir, { recursive: true });

    const finalName = `${randomUUID()}_${session.fileName}`;
    const absFinal = path.join(absDir, finalName);
    assertPathUnderRoot(absFinal, UPLOAD_ROOT);

    try {
      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = path.join(dir, `${i}.part`);
        const buf = await fs.readFile(chunkPath);
        await fs.appendFile(absFinal, buf);
      }
    } catch (e) {
      await fs.unlink(absFinal).catch(() => {});
      throw e;
    }

    const stat = await fs.stat(absFinal);
    if (stat.size !== session.totalSize) {
      await fs.unlink(absFinal).catch(() => {});
      throw { status: 400, message: "合并后大小与声明不一致" };
    }

    const storedPath = path.posix.join(relDir.replace(/\\/g, "/"), finalName);

    const result = await prisma.$transaction(async (tx) => {
      const att = await tx.attachment.create({
        data: {
          originalName: session.fileName,
          storedPath,
          mimeType: session.mimeType,
          size: session.totalSize,
          uploadedById: userId,
        },
      });
      await tx.uploadSession.update({
        where: { id: uploadId },
        data: { status: "merged", attachmentId: att.id },
      });
      return att;
    });

    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});

    return {
      attachmentId: result.id,
      storedPath: result.storedPath,
      originalName: result.originalName,
      size: result.size,
    };
  }

  getAbsolutePath(storedPath: string): string {
    const normalized = storedPath.replace(/\//g, path.sep);
    const abs = path.join(UPLOAD_ROOT, normalized);
    assertPathUnderRoot(abs, UPLOAD_ROOT);
    return abs;
  }

  async getDownloadStream(attachmentId: number, _userId: number) {
    const att = await prisma.attachment.findFirst({
      where: { id: attachmentId, deletedAt: null },
    });
    if (!att) throw { status: 404, message: "附件不存在" };
    const abs = this.getAbsolutePath(att.storedPath);
    try {
      await fs.access(abs);
    } catch {
      throw { status: 404, message: "文件已丢失" };
    }
    return { attachment: att, stream: createReadStream(abs) };
  }

  async page(
    userId: number,
    page: number,
    pageSize: number,
    keyword: string | undefined,
    listAll: boolean,
  ) {
    const where: any = { deletedAt: null };
    if (!listAll) {
      where.uploadedById = userId;
    }
    if (keyword?.trim()) {
      where.originalName = { contains: keyword.trim() };
    }
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      prisma.attachment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createTime: "desc" },
        include: {
          uploadedBy: {
            select: { id: true, userName: true, nickName: true },
          },
        },
      }),
      prisma.attachment.count({ where }),
    ]);
    return { list, total };
  }

  async softDelete(id: number, userId: number, isAdmin: boolean) {
    const att = await prisma.attachment.findFirst({ where: { id, deletedAt: null } });
    if (!att) throw { status: 404, message: "附件不存在" };
    if (!isAdmin && att.uploadedById !== userId) {
      throw { status: 403, message: "无权删除该附件" };
    }
    await prisma.attachment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    const abs = this.getAbsolutePath(att.storedPath);
    await fs.unlink(abs).catch(() => {});
  }
}

export default new AttachmentService();
