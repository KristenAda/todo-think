import path from "path";
import fs from "fs";

/**
 * 附件 / 分片上传相关环境变量（可在 `.env` 中配置）：
 *
 * - UPLOAD_ROOT：上传根目录**绝对路径**。未设置时默认为 `进程工作目录/uploads`。
 * - UPLOAD_MAX_FILE_BYTES：单个文件最大字节数。未设置时默认 104857600（100MB）。
 * - UPLOAD_SESSION_TTL_HOURS：分片上传会话过期时间（小时）。未设置时默认 24。
 */

function envPositiveInt(key: string, defaultVal: number): number {
  const v = process.env[key];
  if (v == null || v === "") return defaultVal;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : defaultVal;
}

/** 上传根目录（绝对路径），环境变量 `UPLOAD_ROOT` */
export const UPLOAD_ROOT = path.resolve(
  process.env.UPLOAD_ROOT?.trim() || path.join(process.cwd(), "uploads"),
);

/** 分片临时目录名（位于 UPLOAD_ROOT 下） */
export const CHUNK_SUBDIR = "_chunks";

/** 单文件最大字节数，环境变量 `UPLOAD_MAX_FILE_BYTES`（默认 100MB） */
export const UPLOAD_MAX_FILE_BYTES = envPositiveInt(
  "UPLOAD_MAX_FILE_BYTES",
  100 * 1024 * 1024,
);

export const UPLOAD_MIN_CHUNK_BYTES = 256 * 1024;
export const UPLOAD_MAX_CHUNK_BYTES = 10 * 1024 * 1024;

/** 分片会话 TTL（毫秒），由 `UPLOAD_SESSION_TTL_HOURS`（默认 24）换算 */
export const UPLOAD_SESSION_TTL_MS =
  envPositiveInt("UPLOAD_SESSION_TTL_HOURS", 24) * 60 * 60 * 1000;

/** 确保根目录与分片父目录存在 */
export function ensureUploadDirs(): void {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_ROOT, CHUNK_SUBDIR), { recursive: true });
}

export function chunkSessionDir(sessionId: string): string {
  return path.join(UPLOAD_ROOT, CHUNK_SUBDIR, sessionId);
}
