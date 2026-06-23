import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E（本仓库不在 package.json 中挂载脚本；自行执行）
 *
 * 前置：
 * 1. 后端已启动且可被前端代理访问（默认 .env.development 里 VITE_API_PROXY_URL=http://localhost:3000）
 *    场景数据：`server` 下推荐 npm run db:test:full（或 db:test:fresh + db:scenario:small-team）；后端 dev:testdb。
 * 2. 浏览器（二选一）：
 *    - 推荐（本机已装 Chrome）：默认在 Windows/macOS 下使用系统 Chrome，无需下载。
 *    - 或使用自带 Chromium：设置环境变量 PLAYWRIGHT_USE_BUNDLED_BROWSER=1 后执行
 *      `pnpm exec playwright install`（需能访问外网下载）。
 *    - 指定 Edge：`PLAYWRIGHT_BROWSER_CHANNEL=msedge pnpm exec playwright test`
 *
 * 运行（在 client 目录）：
 *   pnpm exec playwright test
 *   pnpm exec playwright test scenario-workflow-chain.spec.ts
 *
 * 已手动启动前端时（端口与 PLAYWRIGHT_BASE_URL 一致）：
 *   PowerShell: $env:PLAYWRIGHT_SKIP_WEBSERVER='1'; pnpm exec playwright test
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3006';

/** 未下载 ms-playwright 内置浏览器时，用系统 Chrome/Edge 可直接跑 */
function resolveBrowserChannel(): 'chrome' | 'msedge' | undefined {
  const raw = process.env.PLAYWRIGHT_BROWSER_CHANNEL?.trim().toLowerCase();
  if (raw === 'chrome' || raw === 'msedge') return raw;
  if (process.env.PLAYWRIGHT_USE_BUNDLED_BROWSER === '1') return undefined;
  if (process.env.CI) return undefined;
  if (process.platform === 'win32' || process.platform === 'darwin') return 'chrome';
  return undefined;
}

const browserChannel = resolveBrowserChannel();

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'zh-CN'
  },
  projects: [
    {
      name: browserChannel ? `desktop-${browserChannel}` : 'chromium-bundled',
      use: {
        ...devices['Desktop Chrome'],
        ...(browserChannel ? { channel: browserChannel } : {})
      }
    }
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npx vite --host 127.0.0.1 --strictPort',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe'
      }
});
