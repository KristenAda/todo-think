import { describe, expect, it } from 'vitest';
import { staticRoutes } from '@/router/routes/staticRoutes';

function collectPaths(routes: typeof staticRoutes, parent = ''): string[] {
  const out: string[] = [];
  for (const r of routes) {
    const p = typeof r.path === 'string' ? r.path : '';
    out.push(parent + p);
    if (r.children?.length) {
      out.push(...collectPaths(r.children as typeof staticRoutes, parent));
    }
  }
  return out;
}

describe('staticRoutes', () => {
  it('包含认证与异常兜底路由', () => {
    const paths = collectPaths(staticRoutes);
    expect(paths).toContain('/auth/login');
    expect(paths).toContain('/auth/register');
    expect(staticRoutes.some((r) => r.name === 'Exception404')).toBe(true);
    expect(staticRoutes.some((r) => r.name === 'Exception403')).toBe(true);
  });
});
