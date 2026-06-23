/**
 * 将 empty 插画 SVG 源文本中的固定蓝色系替换为 Element Plus 主题变量，
 * 便于内联渲染时随主题切换。
 */
const REPLACEMENTS: readonly { pattern: RegExp; value: string }[] = [
  { pattern: /#548fff/gi, value: 'var(--el-color-primary)' },
  { pattern: /#949fff/gi, value: 'var(--el-color-primary-light-3)' },
  { pattern: /#5d83ff/gi, value: 'var(--el-color-primary)' },
  { pattern: /#a0b3f8/gi, value: 'var(--el-color-primary-light-5)' },
  { pattern: /#ebf4ff/gi, value: 'var(--el-color-primary-light-9)' },
  {
    pattern: /#ebebff/gi,
    value:
      'color-mix(in srgb, var(--el-color-primary-light-9), var(--el-color-primary-light-7) 18%)'
  },
  {
    pattern: /#ebe1ff/gi,
    value:
      'color-mix(in srgb, var(--el-color-primary-light-9), var(--el-color-primary-light-5) 28%)'
  },
  {
    pattern: /#ebd3ff/gi,
    value:
      'color-mix(in srgb, var(--el-color-primary-light-8), var(--el-color-primary-light-3) 22%)'
  },
  {
    pattern: /#ebb9ff/gi,
    value:
      'color-mix(in srgb, var(--el-color-primary-light-8), var(--el-color-primary-light-3) 18%)'
  },
  {
    pattern: /#d7d7f4/gi,
    value:
      'color-mix(in srgb, var(--el-color-primary-light-9), var(--el-color-primary-light-5) 12%)'
  },
  { pattern: /#e3e7ff/gi, value: 'var(--el-color-primary-light-9)' },
  {
    pattern: /#c9cfe5/gi,
    value: 'color-mix(in srgb, var(--el-fill-color), var(--el-color-primary-light-7) 14%)'
  },
  {
    pattern: /#d3dcf4/gi,
    value:
      'color-mix(in srgb, var(--el-border-color-lighter), var(--el-color-primary-light-8) 35%)'
  },
  { pattern: /#eaeff5/gi, value: 'var(--el-fill-color-light)' },
  { pattern: /#dee1f0/gi, value: 'var(--el-fill-color)' },
  { pattern: /#fafbfd/gi, value: 'var(--el-fill-color-blank)' },
  {
    pattern: /#3a3a77/gi,
    value:
      'color-mix(in srgb, var(--el-text-color-regular) 78%, var(--el-color-primary-dark-2) 22%)'
  }
];

export function themeifyEmptySvg(svg: string): string {
  let out = svg;
  for (const { pattern, value } of REPLACEMENTS) {
    out = out.replace(pattern, value);
  }
  return out;
}

/** 内联到 DOM 时给根 svg 增加行内样式（如宽度），内部会先执行 themeify */
export function withEmptySvgRootStyle(svg: string, rootStyle: string): string {
  return themeifyEmptySvg(svg).replace(/<svg\s/, `<svg style="${rootStyle}" `);
}
