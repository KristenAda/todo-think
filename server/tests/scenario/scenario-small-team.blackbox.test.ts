/**
 * 黑盒：基于 seed-scenario-small-team 灌入的数据，走 HTTP 全流程抽样。
 *
 * 前置（在 server 目录）：
 *   npm run db:test:full
 *   （或：npm run db:test:fresh && npm run db:scenario:small-team）
 *   （prisma generate 被占用：npm run db:test:fresh && npm run db:scenario:small-team:seed）
 *
 * 运行（需自行安装依赖；不在 package.json 中暴露脚本）：
 *   npx vitest run --config vitest.scenario.config.ts
 *
 * 注意：本文件放在 tests/scenario/，默认单元测试配置不会收录（避免误连开发库）。
 */
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import type Koa from "koa";
import { createApp } from "@/createApp";
import { AuthUtil } from "@/core/auth.util";

const SKIP = process.env.SKIP_SCENARIO_BLACKBOX === "1";

const PROJECT_NAME = "数字化工作台一期";
const DEPT_NAME = "研发部";
const TASK_DESIGN = "后台报表交互稿";
const TASK_SEEDED_DONE = "会员中心改版（前端主导）";

function shaPwd(plain = "123456") {
  return AuthUtil.sha256(plain);
}

async function login(app: Koa, userName: string) {
  const res = await request(app.callback())
    .post("/auth/login")
    .send({ userName, password: shaPwd() });
  expect(res.status).toBe(200);
  expect(res.body.code).toBe(200);
  const token = res.body.data?.token as string | undefined;
  expect(token).toBeTruthy();
  return token!;
}

function auth(req: request.Test, token: string) {
  return req.set("Authorization", `Bearer ${token}`);
}

describe.skipIf(SKIP)("黑盒：小团队场景（scenario seed）", () => {
  let app: Koa;

  beforeAll(async () => {
    app = await createApp();
  });

  it("部门树可见研发部；经理可见项目与规则集；任务列表含角色分工（负责人/协助/验收）", async () => {
    const mgr = await login(app, "dev_mgr");

    const tree = await auth(request(app.callback()).get("/departments/tree"), mgr);
    expect(tree.status).toBe(200);
    expect(tree.body.code).toBe(200);
    const flatNames = JSON.stringify(tree.body.data ?? []);
    expect(flatNames).toContain(DEPT_NAME);

    const projPage = await auth(
      request(app.callback()).get("/projects").query({ page: 1, pageSize: 20 }),
      mgr,
    );
    expect(projPage.status).toBe(200);
    expect(projPage.body.code).toBe(200);
    const plist = projPage.body.data?.list ?? [];
    const project = plist.find((p: { name?: string }) => p.name === PROJECT_NAME);
    expect(project, `请先灌入场景种子（缺少项目「${PROJECT_NAME}」）`).toBeTruthy();
    const projectId = project.id as number;

    const rs = await auth(
      request(app.callback()).get("/rule-sets").query({ projectId }),
      mgr,
    );
    expect(rs.status).toBe(200);
    expect(rs.body.code).toBe(200);
    const ruleSets = rs.body.data ?? [];
    expect(ruleSets.length).toBeGreaterThan(0);

    const seededDone = await auth(
      request(app.callback())
        .get("/tasks")
        .query({ page: 1, pageSize: 50, keyword: TASK_SEEDED_DONE }),
      mgr,
    );
    expect(seededDone.status).toBe(200);
    const doneList = seededDone.body.data?.list ?? [];
    expect(doneList.length).toBeGreaterThan(0);
    const doneTask = doneList[0];
    expect(doneTask.status).toBe("COMPLETED");
    expect(doneTask.mainAssignee?.userName).toBe("fe01");
    expect(doneTask.tester?.userName).toBe("dev_mgr");
    const coUsers = (doneTask.coAssignees ?? []).map((c: { user?: { userName?: string } }) => c.user?.userName).sort();
    expect(coUsers).toEqual(["be01", "fe02"].sort());

    const detail = await auth(
      request(app.callback()).get(`/tasks/${doneTask.id}`),
      mgr,
    );
    expect(detail.status).toBe(200);
    const d = detail.body.data;
    expect(d.workLogs?.length ?? 0).toBeGreaterThan(0);
    expect(d.timelines?.length ?? 0).toBeGreaterThan(0);

    const recon = await auth(
      request(app.callback()).get(`/performance/reconcile/${doneTask.id}`),
      mgr,
    );
    expect(recon.status).toBe(200);
    expect(recon.body.code).toBe(200);
    expect((recon.body.data?.settlements ?? []).length).toBeGreaterThan(0);
    expect((recon.body.data?.ledgers ?? []).length).toBeGreaterThan(0);

    const stats = await auth(
      request(app.callback())
        .get("/performance/stats")
        .query({ page: 1, pageSize: 20, projectId }),
      mgr,
    );
    expect(stats.status).toBe(200);
    expect(stats.body.code).toBe(200);
    expect(stats.body.data?.summary?.totals?.headcount ?? 0).toBeGreaterThan(0);
  });

  it("设计任务：负责人开始开发 → 填报工时 → 提交验收 → 经理验收通过 → 产生结算记录", async () => {
    const mgr = await login(app, "dev_mgr");
    const designer = await login(app, "designer01");

    const projPage = await auth(
      request(app.callback()).get("/projects").query({ page: 1, pageSize: 20 }),
      mgr,
    );
    const project = (projPage.body.data?.list ?? []).find(
      (p: { name?: string }) => p.name === PROJECT_NAME,
    );
    expect(project).toBeTruthy();
    const projectId = project.id as number;

    const taskRes = await auth(
      request(app.callback())
        .get("/tasks")
        .query({ page: 1, pageSize: 50, keyword: TASK_DESIGN, projectId }),
      mgr,
    );
    expect(taskRes.status).toBe(200);
    const tasks = taskRes.body.data?.list ?? [];
    expect(tasks.length).toBeGreaterThan(0);
    const taskRow = tasks.find((t: { title?: string }) => t.title === TASK_DESIGN);
    expect(taskRow).toBeTruthy();
    const taskId = taskRow.id as number;

    if (taskRow.status !== "PENDING") {
      console.warn(
        `[scenario-blackbox] 任务「${TASK_DESIGN}」当前状态为 ${taskRow.status}，跳过可变步骤（重置测试库并重新灌种子后可再跑全流程）。`,
      );
      expect(["IN_PROGRESS", "QA_REVIEW", "COMPLETED"]).toContain(taskRow.status);
      const reconDone = await auth(
        request(app.callback()).get(`/performance/reconcile/${taskId}`),
        mgr,
      );
      expect(reconDone.status).toBe(200);
      expect((reconDone.body.data?.settlements ?? []).length).toBeGreaterThan(0);
      return;
    }

    const reconcileBefore = await auth(
      request(app.callback()).get(`/performance/reconcile/${taskId}`),
      mgr,
    );
    const settlementsBefore = reconcileBefore.body.data?.settlements ?? [];

    const sw = await auth(request(app.callback()).post(`/tasks/${taskId}/start-work`), designer);
    expect(sw.status).toBe(200);
    expect(sw.body.code).toBe(200);

    const wl = await auth(request(app.callback()).post(`/tasks/${taskId}/worklogs`).send({
      hours: 4,
      content: "黑盒测试登记：交互稿细化与标注",
    }), designer);
    expect(wl.status).toBe(200);
    expect(wl.body.code).toBe(200);

    const st = await auth(request(app.callback()).post(`/tasks/${taskId}/submit-test`).send({
      testCaseResults: [],
    }), designer);
    expect(st.status).toBe(200);
    expect(st.body.code).toBe(200);

    const qa = await auth(request(app.callback()).post(`/tasks/${taskId}/qa-audit`).send({
      decision: "pass",
      actualHours: 8,
    }), mgr);
    expect(qa.status).toBe(200);
    expect(qa.body.code).toBe(200);

    const done = await auth(request(app.callback()).get(`/tasks/${taskId}`), mgr);
    expect(done.body.data?.status).toBe("COMPLETED");

    const reconcileAfter = await auth(
      request(app.callback()).get(`/performance/reconcile/${taskId}`),
      mgr,
    );
    const settlementsAfter = reconcileAfter.body.data?.settlements ?? [];
    expect(settlementsAfter.length).toBeGreaterThanOrEqual(settlementsBefore.length);
    expect(settlementsAfter.length).toBeGreaterThan(0);
  });
});
