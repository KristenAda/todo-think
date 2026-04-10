/**
 * 附件在线预览类型（与 vue-office / 文本 / 图片 展示策略对应）
 * @see https://github.com/501351981/vue-office
 */
export type AttachmentPreviewKind =
  | 'image'
  | 'pdf'
  | 'docx'
  | 'excel'
  | 'pptx'
  | 'text'
  | 'unsupported';

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg']);

const TEXT_EXT = new Set([
  'txt',
  'log',
  'md',
  'json',
  'xml',
  'csv',
  'yaml',
  'yml',
  'ini',
  'conf',
  'ts',
  'js',
  'mjs',
  'cjs',
  'vue',
  'css',
  'scss',
  'less',
  'html',
  'htm',
  'sh',
  'env',
  'properties'
]);

export function resolveAttachmentPreviewKind(
  fileName: string,
  mime: string | null | undefined
): AttachmentPreviewKind {
  const lower = (fileName || '').toLowerCase();
  const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.') + 1) : '';
  const m = (mime || '').toLowerCase();

  if (m.startsWith('image/')) return 'image';
  if (IMAGE_EXT.has(ext)) return 'image';

  if (m === 'application/pdf' || ext === 'pdf') return 'pdf';

  // 旧版 Word / PPT 二进制，vue-office 不支持
  if (ext === 'doc') return 'unsupported';
  if (ext === 'ppt') return 'unsupported';

  if (
    ext === 'docx' ||
    m.includes('wordprocessingml') ||
    m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }

  if (
    ext === 'pptx' ||
    m.includes('presentationml.presentation') ||
    m === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'pptx';
  }

  if (
    ext === 'xls' ||
    ext === 'xlsx' ||
    m.includes('spreadsheetml') ||
    m.includes('vnd.ms-excel') ||
    m === 'application/vnd.ms-excel'
  ) {
    return 'excel';
  }

  if (
    m.startsWith('text/') ||
    m === 'application/json' ||
    m === 'application/xml' ||
    TEXT_EXT.has(ext)
  ) {
    return 'text';
  }

  return 'unsupported';
}
