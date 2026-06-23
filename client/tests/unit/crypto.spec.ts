import { describe, expect, it } from 'vitest';
import { hashPassword } from '@/utils/crypto';

describe('hashPassword', () => {
  it('对同一输入生成固定长度十六进制串', () => {
    const a = hashPassword('hello');
    const b = hashPassword('hello');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/i);
  });
});
