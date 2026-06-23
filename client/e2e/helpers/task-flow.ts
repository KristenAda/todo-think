import { expect, type Page } from '@playwright/test';

/** Element Plus 成功提示 */
export async function expectSuccessToast(page: Page, pattern: RegExp | string) {
  const msg = page.locator('.el-message--success').last();
  await expect(msg).toBeVisible({ timeout: 15_000 });
  await expect(msg).toContainText(pattern);
}

/** 关闭当前可见的最顶层 ArtDialog（任务详情或子弹窗） */
export async function closeTopArtDialog(page: Page) {
  const closeBtn = page.locator('.art-dialog-overlay .art-dialog__action-btn--close').last();
  await closeBtn.click({ timeout: 5000 }).catch(() => {});
}

export async function waitWorkbenchLoaded(page: Page) {
  await page.goto('/outside/workbench');
  await expect(page.locator('.workbench')).toBeVisible({ timeout: 30_000 });
  await page
    .getByText('正在加载看板数据')
    .waitFor({ state: 'hidden', timeout: 30_000 })
    .catch(() => {});
}

/** 工作台任务卡片上的项目名称（避免与站内消息等含同名 substring 的节点 strict 冲突） */
export function workbenchProjectLocator(page: Page, projectName: string) {
  return page.locator('.workbench .task-card__project').filter({ hasText: projectName }).first();
}

/** 工作台任务卡片标题 */
export function workbenchTaskTitleLocator(page: Page, title: string) {
  return page.locator('.workbench .task-card__title').filter({ hasText: title }).first();
}

/**
 * 在工作台点击包含指定标题的任务卡片，打开任务详情抽屉。
 */
export async function openTaskCardByTitle(page: Page, title: string) {
  await waitWorkbenchLoaded(page);
  const card = page.locator('.workbench .task-card').filter({ hasText: title }).first();
  await card.scrollIntoViewIfNeeded();
  await card.click({ timeout: 20_000 });
  await expect(page.locator('.art-dialog__title').filter({ hasText: title })).toBeVisible({
    timeout: 20_000,
  });
}

/** 任务详情主抽屉底部按钮区（避免 getByRole 与图标按钮的可访问名不一致） */
export function taskDetailFooter(page: Page) {
  return page.locator('.task-detail-footer');
}

export async function expectTaskDetailBodyVisible(page: Page) {
  await expect(page.locator('.task-detail-body')).toBeVisible({ timeout: 30_000 });
}

/**
 * 任务详情基本信息区状态是否为「已完成」。
 * 勿用 body.getByText('已完成')：时间线等处也会出现「已完成」substring，易 strict 抛错，
 * 若配合 .catch(() => false) 会误判为未完成。
 */
export async function isTaskDetailCompleted(page: Page): Promise<boolean> {
  await expect(page.locator('.task-detail-body')).toBeVisible({ timeout: 15_000 });
  const statusTag = page
    .locator('.task-detail-body .task-basic-grid .el-tag')
    .filter({ hasText: /^已完成$/ });
  return (await statusTag.count()) > 0;
}

export async function expectTaskDetailCompletedVisible(page: Page) {
  await expect(
    page
      .locator('.task-detail-body .task-basic-grid .el-tag')
      .filter({ hasText: /^已完成$/ })
      .first(),
  ).toBeVisible({ timeout: 10_000 });
}

/** 点击任务详情 footer 中带指定文案的 Element Plus 按钮 */
export async function clickTaskDetailFooterButton(page: Page, label: string | RegExp) {
  const btn = taskDetailFooter(page).locator('.el-button').filter({ hasText: label });
  await expect(btn).toBeVisible({ timeout: 30_000 });
  await btn.click();
}

export async function fillWorkLogAndSubmit(page: Page, hours: number, content: string) {
  const dlg = page
    .locator('.art-dialog-overlay')
    .filter({ has: page.locator('.art-dialog__title', { hasText: '登记工时' }) })
    .last();
  await expect(dlg).toBeVisible({ timeout: 10_000 });
  const numInput = dlg.locator('.el-input-number input');
  await numInput.click();
  await numInput.fill(String(hours));
  await dlg.locator('textarea').fill(content);
  await dlg.getByRole('button', { name: '提交' }).click();
}
