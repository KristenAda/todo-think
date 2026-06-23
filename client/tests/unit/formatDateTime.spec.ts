import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from '@/utils/date/formatDateTime';

describe('formatDateTime', () => {
  it('非法输入返回空串', () => {
    expect(formatDateTime(undefined)).toBe('');
    expect(formatDateTime('')).toBe('');
    expect(formatDateTime('not-a-date')).toBe('');
  });

  it('按本地时区格式化为 YYYY-MM-DD HH:mm:ss', () => {
    const d = new Date(2026, 4, 11, 8, 30, 5);
    expect(formatDateTime(d)).toBe('2026-05-11 08:30:05');
  });
});

describe('formatDate', () => {
  it('格式化为 YYYY-MM-DD', () => {
    const d = new Date(2026, 0, 2);
    expect(formatDate(d)).toBe('2026-01-02');
  });
});
