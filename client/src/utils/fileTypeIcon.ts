/**
 * 根据扩展名 / MIME 返回 Iconify 图标名与分类（用于样式与展示）
 */
export type FileCategory =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'ppt'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'text'
  | 'default';

const ICON: Record<FileCategory, string> = {
  pdf: 'mdi:file-pdf-box',
  word: 'mdi:file-word-box',
  excel: 'mdi:file-excel-box',
  ppt: 'mdi:file-powerpoint-box',
  image: 'mdi:file-image-box',
  video: 'mdi:file-video-box',
  audio: 'mdi:file-music-box',
  archive: 'mdi:folder-zip',
  code: 'mdi:file-code-outline',
  text: 'mdi:file-document-outline',
  default: 'mdi:file-outline'
};

/** 与分类对应的主题色（RGB 逗号分隔，用于 rgb(var(--x))） */
const TINT: Record<FileCategory, string> = {
  pdf: '229, 57, 53',
  word: '25, 118, 210',
  excel: '46, 125, 50',
  ppt: '245, 124, 0',
  image: '123, 31, 162',
  video: '156, 39, 176',
  audio: '0, 137, 123',
  archive: '109, 76, 65',
  code: '66, 165, 245',
  text: '96, 125, 139',
  default: '120, 144, 156'
};

export function getFileCategory(fileName: string, mime?: string | null): FileCategory {
  if (mime?.startsWith('image/')) return 'image';
  if (mime?.startsWith('video/')) return 'video';
  if (mime?.startsWith('audio/')) return 'audio';

  const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';

  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'excel';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'ppt';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return 'archive';
  if (
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic'].includes(ext)
  )
    return 'image';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (
    [
      'js',
      'ts',
      'tsx',
      'jsx',
      'vue',
      'json',
      'xml',
      'html',
      'htm',
      'css',
      'scss',
      'less',
      'md',
      'sql',
      'yaml',
      'yml',
      'sh',
      'bat',
      'ps1'
    ].includes(ext)
  )
    return 'code';
  if (['txt', 'log', 'ini', 'env'].includes(ext)) return 'text';

  if (mime?.includes('pdf')) return 'pdf';
  if (mime?.includes('word') || mime?.includes('document')) return 'word';
  if (mime?.includes('sheet') || mime?.includes('excel')) return 'excel';
  if (mime?.includes('presentation') || mime?.includes('powerpoint')) return 'ppt';
  if (mime?.includes('zip') || mime?.includes('compressed')) return 'archive';

  return 'default';
}

export function getFileIcon(fileName: string, mime?: string | null): string {
  return ICON[getFileCategory(fileName, mime)];
}

/** 用于 BEM 修饰符，如 `ft-cat-pdf` */
export function getFileCategoryClass(fileName: string, mime?: string | null): string {
  return `ft-cat-${getFileCategory(fileName, mime)}`;
}

export function getFileTintRgb(fileName: string, mime?: string | null): string {
  return TINT[getFileCategory(fileName, mime)];
}

/** 文件名旁展示的短扩展名标签，如 PDF / XLSX */
export function getFileExtLabel(fileName: string): string {
  if (!fileName.includes('.')) return '';
  const ext = fileName.split('.').pop()!.toLowerCase();
  return ext.length <= 8 ? ext.toUpperCase() : ext.slice(0, 8).toUpperCase();
}
