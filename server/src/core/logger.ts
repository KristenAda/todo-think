import path from "path";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors } = format;

// 日志根目录：运行时 process.cwd()/logs
const LOG_DIR = path.resolve(process.cwd(), "logs");

/**
 * 将额外的 metadata 对象序列化为单行 JSON 附加到日志末尾
 */
function serializeMeta(meta: Record<string, unknown>): string {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (key === "timestamp" || key === "level" || key === "message") continue;
    filtered[key] = value;
  }
  if (Object.keys(filtered).length === 0) return "";
  try {
    return " " + JSON.stringify(filtered);
  } catch {
    return " [meta无法序列化]";
  }
}

// 文件日志格式（纯文本，含完整 metadata）
const fileLogFormat = printf((info) => {
  const { level, message, timestamp: ts, stack, ...rest } = info as {
    level: string;
    message: string;
    timestamp: string;
    stack?: string;
    [key: string]: unknown;
  };
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  const stackStr = stack ? `\n  [stack]\n${stack}` : "";
  const metaStr = serializeMeta(rest);
  return `${base}${stackStr}${metaStr}`;
});

// 控制台日志格式（带颜色）
const consoleLogFormat = printf((info) => {
  const { level, message, timestamp: ts, stack, ...rest } = info as {
    level: string;
    message: string;
    timestamp: string;
    stack?: string;
    [key: string]: unknown;
  };
  const base = `[${ts}] [${level}] ${message}`;
  const stackStr = stack ? `\n  [stack]\n${stack}` : "";
  const metaStr = serializeMeta(rest);
  return `${base}${stackStr}${metaStr}`;
});

// 每日滚动 info 日志（info 及以上）
const infoTransport = new DailyRotateFile({
  dirname: LOG_DIR,
  filename: "%DATE%-info.log",
  datePattern: "YYYY-MM-DD",
  level: "info",
  maxFiles: "30d",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    fileLogFormat,
  ),
});

// 每日滚动 error 日志（仅 error）
const errorTransport = new DailyRotateFile({
  dirname: LOG_DIR,
  filename: "%DATE%-error.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxFiles: "30d",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    fileLogFormat,
  ),
});

// 控制台输出（开发 + 生产都保留，方便 PM2 查看）
const consoleTransport = new transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    consoleLogFormat,
  ),
});

const logger = createLogger({
  level: "info",
  transports: [infoTransport, errorTransport, consoleTransport],
});

export default logger;
