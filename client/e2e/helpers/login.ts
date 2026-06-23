import { expect, type Page } from '@playwright/test';

/** 完成登录页拖拽验证（ArtDragVerify） */
export async function passLoginDragVerify(page: Page) {
  const track = page.locator('.drag_verify').first();
  const handle = page.locator('.dv_handler').first();
  await track.waitFor({ state: 'visible' });
  const box = await track.boundingBox();
  if (!box) throw new Error('未找到 .drag_verify 尺寸');

  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 6, box.y + box.height / 2, { steps: 16 });
  await page.mouse.up();

  await expect(page.locator('.dv_text').first()).toContainText(/验证成功|Verification successful/, {
    timeout: 10_000
  });
}

/** 场景演示账号登录（明文密码与种子一致） */
export async function loginWithPassword(page: Page, userName: string, plainPassword: string) {
  await page.goto('/auth/login');
  const inputs = page.locator('.form .el-input__inner');
  await inputs.nth(0).fill(userName);
  await inputs.nth(1).fill(plainPassword);
  await passLoginDragVerify(page);
  await page.locator('.btn-login').click();
  await page.waitForURL((u) => !u.pathname.includes('/auth/login'), { timeout: 45_000 });
}

export async function loginScenarioManager(page: Page) {
  await loginWithPassword(page, 'dev_mgr', '123456');
}
