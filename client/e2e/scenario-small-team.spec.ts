import { test, expect } from '@playwright/test';
import { loginScenarioManager, loginWithPassword } from './helpers/login';
import { workbenchProjectLocator, workbenchTaskTitleLocator } from './helpers/task-flow';

test.describe('场景种子：小团队演示（UI）', () => {
  test('经理登录 → 工作台可见场景项目「数字化工作台一期」', async ({ page }) => {
    await loginScenarioManager(page);
    await page.goto('/outside/workbench');
    await expect(page.locator('.workbench')).toBeVisible({ timeout: 30_000 });
    await expect(workbenchProjectLocator(page, '数字化工作台一期')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('设计师登录 → 工作台可见与其相关的任务卡片', async ({ page }) => {
    await loginWithPassword(page, 'designer01', '123456');
    await page.goto('/outside/workbench');
    await expect(page.locator('.workbench')).toBeVisible({ timeout: 30_000 });
    await expect(workbenchTaskTitleLocator(page, '后台报表交互稿')).toBeVisible({
      timeout: 30_000,
    });
  });
});
