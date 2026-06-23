/**
 * 端到端串联：工作台 → 任务详情（负责人/验收/工时）→ 设计任务流转 → 经理验收 → 效能统计 / 规则管理。
 *
 * 依赖测试库场景种子（server）：推荐 `npm run db:test:full`（或 db:test:fresh + db:scenario:small-team）；
 * 后端：npm run dev:testdb（前端代理 localhost:3000）。
 *
 * 若「后台报表交互稿」曾被跑过已完成，设计师步骤会自动跳过变更；经理验收步骤会断言「已完成」。
 */
import { test, expect } from '@playwright/test';
import { loginWithPassword } from './helpers/login';
import {
  clickTaskDetailFooterButton,
  closeTopArtDialog,
  expectSuccessToast,
  expectTaskDetailBodyVisible,
  expectTaskDetailCompletedVisible,
  fillWorkLogAndSubmit,
  isTaskDetailCompleted,
  openTaskCardByTitle,
  taskDetailFooter,
  waitWorkbenchLoaded,
  workbenchProjectLocator,
} from './helpers/task-flow';

const PROJECT = '数字化工作台一期';
const TASK_DONE = '会员中心改版（前端主导）';
const TASK_DESIGN = '后台报表交互稿';

test.describe.serial('场景：研发部业务链路（UI 全流程）', () => {
  test('经理 — 工作台可见场景项目；已完成任务详情含主责与工时', async ({ page }) => {
    await loginWithPassword(page, 'dev_mgr', '123456');
    await waitWorkbenchLoaded(page);
    await expect(workbenchProjectLocator(page, PROJECT)).toBeVisible({ timeout: 30_000 });

    await openTaskCardByTitle(page, TASK_DONE);
    await expect(page.locator('.task-detail-body')).toContainText('任务基本信息');
    await expect(page.locator('.task-detail-body')).toContainText(/王前端一|fe01/);
    await expect(page.locator('.task-detail-body')).toContainText(/张经理|dev_mgr/);
    await expect(page.locator('.section--worklog')).toBeVisible();
    await closeTopArtDialog(page);
  });

  test('设计师 — 待处理：开始开发 → 登记工时 → 提交验收（产品类任务无需用例）', async ({
    page,
  }) => {
    await loginWithPassword(page, 'designer01', '123456');
    await openTaskCardByTitle(page, TASK_DESIGN);

    const alreadyDone = await isTaskDetailCompleted(page);
    if (alreadyDone) {
      test.info().annotations.push({
        type: 'note',
        description: '「后台报表交互稿」已是已完成，跳过开发/提测步骤。',
      });
      await closeTopArtDialog(page);
      return;
    }

    await expectTaskDetailBodyVisible(page);

    const startBtn = taskDetailFooter(page).locator('.el-button').filter({ hasText: '开始开发' });
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expectSuccessToast(page, /已开始开发/);
      await expect(page.locator('.task-detail-body').getByText('开发中', { exact: true })).toBeVisible({
        timeout: 20_000,
      });
    }

    await clickTaskDetailFooterButton(page, '登记工时');
    await fillWorkLogAndSubmit(page, 4, 'Playwright：交互稿细化与标注');
    await expectSuccessToast(page, /工时登记成功/);

    await clickTaskDetailFooterButton(page, '提交验收');
    await expectSuccessToast(page, /已提交验收/);

    await closeTopArtDialog(page);
  });

  test('经理 — 待验收：验收通过（或已验收则校验状态）', async ({ page }) => {
    await loginWithPassword(page, 'dev_mgr', '123456');
    await openTaskCardByTitle(page, TASK_DESIGN);

    const passBtn = page.getByRole('button', { name: '验收通过' });
    if (await passBtn.isVisible()) {
      await passBtn.click();
      const qaDlg = page.locator('.art-dialog').filter({ hasText: '确认验收通过' });
      await expect(qaDlg).toBeVisible({ timeout: 10_000 });
      await qaDlg.locator('.el-input-number input').fill('8');
      await qaDlg.getByRole('button', { name: '确认通过' }).click();
      await expectSuccessToast(page, /验收通过/);
    } else {
      await expectTaskDetailCompletedVisible(page);
    }

    await closeTopArtDialog(page);
  });

  test('经理 — 研发效能统计页 / 规则管理页可访问', async ({ page }) => {
    await loginWithPassword(page, 'dev_mgr', '123456');

    // 与后端菜单一致：父路径 /performance + 子 path metric（非 REST /api/performance/stats）
    await page.goto('/performance/metric');
    await expect(page.getByRole('heading', { name: '研发效能统计' })).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.getByText('成员绩效明细')).toBeVisible();

    await page.goto('/business/performance-rules');
    await expect(page.getByText('计算规则')).toBeVisible({ timeout: 25_000 });
    // 已有选中规则集时 el-select 不展示占位符，仅显示当前项文案
    await expect(
      page.getByPlaceholder('选择规则集').or(page.getByRole('button', { name: '规则集管理' })),
    ).toBeVisible({ timeout: 15_000 });
  });
});
