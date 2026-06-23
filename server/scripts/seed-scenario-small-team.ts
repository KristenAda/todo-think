/**
 * 测试库场景：研发部 7 人小团队（经理 + 设计 + 3 前端 + 2 后端）
 * — 部门、角色、用户、项目、项目绩效规则、多状态任务、一条已完成任务的积分流水示例。
 *
 * 前置：测试库已灌 todo_think_test_seed.sql（推荐一键：npm run db:test:fresh，再跑本脚本）
 * 环境：仅读取 server/.env.test（库名须含 test）
 * 一键含本场景：npm run db:test:full（= fresh + 本脚本）
 *
 * 用法（在 server 目录）：
 *   npm run db:scenario:small-team
 *   prisma generate 被占用（如已起 dev:testdb）：npm run db:scenario:small-team:seed
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import dotenv from "dotenv";
import type { Prisma } from "@prisma/client";
import {
  PrismaClient,
  TaskStatus,
  TaskType,
  TaskPriority,
  TaskWorkDomain,
  TaskComplexityTier,
  TestStatus,
} from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, "..");

type Tx = Prisma.TransactionClient;

function resolveEnvPath(): string {
  const raw = process.env.DOTENV_CONFIG_PATH?.trim();
  const p = raw
    ? path.isAbsolute(raw)
      ? raw
      : path.join(SERVER_ROOT, raw)
    : path.join(SERVER_ROOT, ".env.test");
  return p;
}

function parseDbName(url: string): string {
  const noQuery = url.split("?")[0];
  const i = noQuery.lastIndexOf("/");
  if (i === -1 || i === noQuery.length - 1) return "";
  try {
    return decodeURIComponent(noQuery.slice(i + 1));
  } catch {
    return noQuery.slice(i + 1);
  }
}

/** 与主种子一致：明文 123456 → 前端 SHA256 → 后端 bcrypt */
const DEMO_PASSWORD_HASH =
  "$2b$10$D9VaXd.QuBfhfGIYPIkUGOw50GxIvLS2BK.IVbjadIUtllWTpzs9q";

const PROJECT_NAME = "数字化工作台一期";

/** 业务管理 › 规则管理（与 prisma/seed.sql `Menu`.id 一致） */
const PERFORMANCE_RULES_MENU_ID = 140;

/** 旧版场景未绑定时补绑，使动态路由含 `/business/performance-rules`（幂等） */
async function ensureScenarioDevMgrHasRulesMenu(client: PrismaClient): Promise<void> {
  const role = await client.role.findFirst({
    where: { roleCode: "scenario_dev_mgr" },
    select: {
      id: true,
      menus: {
        where: { id: PERFORMANCE_RULES_MENU_ID },
        select: { id: true },
      },
    },
  });
  if (!role || role.menus.length > 0) return;
  await client.role.update({
    where: { id: role.id },
    data: { menus: { connect: { id: PERFORMANCE_RULES_MENU_ID } } },
  });
  console.log(
    `[scenario] 已为 scenario_dev_mgr 补绑规则管理菜单（id=${PERFORMANCE_RULES_MENU_ID}）`,
  );
}

function sha256Json(def: object): string {
  return createHash("sha256").update(JSON.stringify(def)).digest("hex");
}

/** 场景脚本依赖绩效/规则等模型；残缺 Client 会在事务中途出现「Cannot read properties of undefined (reading 'create')」 */
function assertScenarioPrismaDelegates(client: PrismaClient): void {
  const keys = [
    "ruleSet",
    "ruleSetVersion",
    "perfSettlement",
    "pointsLedgerEntry",
    "perfItem",
    "ruleExecution",
    "projectTaskRule",
  ] as const;
  const raw = client as unknown as Record<string, unknown>;
  const missing = keys.filter(
    (k) => typeof raw[k] !== "object" || raw[k] === null,
  );
  if (missing.length === 0) return;
  console.error(
    `[scenario] 当前 @prisma/client 未包含委托：${missing.join(", ")}（常见于未执行 prisma generate 或生成被中断）。`,
  );
  console.error("  请在 server 目录执行：npx prisma generate");
  console.error(
    "  Windows 若报 EPERM（rename query_engine），请先关闭占用 node_modules/.prisma/client 的进程（如正在跑的 node/tsx）后再生成。",
  );
  process.exit(1);
}

async function cloneRoleWithMenus(
  tx: Tx,
  sourceRoleId: number,
  data: {
    roleName: string;
    roleCode: string;
    description: string;
    sort: number;
    dataScope: number;
    remark?: string;
  },
) {
  const src = await tx.role.findUnique({
    where: { id: sourceRoleId },
    select: { menus: { select: { id: true } } },
  });
  if (!src) throw new Error(`找不到源角色 id=${sourceRoleId}`);
  return tx.role.create({
    data: {
      roleName: data.roleName,
      roleCode: data.roleCode,
      description: data.description,
      enabled: true,
      sort: data.sort,
      dataScope: data.dataScope,
      remark: data.remark ?? null,
      menus: { connect: src.menus.map((m) => ({ id: m.id })) },
    },
  });
}

async function main() {
  const envPath = resolveEnvPath();
  if (!fs.existsSync(envPath)) {
    console.error(`[scenario] 缺少 ${envPath}，请先配置 .env.test`);
    process.exit(1);
  }
  // 必须用 override：否则终端/IDE 里已存在的 DATABASE_URL（常指向开发库）会盖住 .env.test
  dotenv.config({ path: envPath, override: true });

  if (!process.env.DATABASE_URL) {
    console.error(
      `[scenario] ${envPath} 中未解析到 DATABASE_URL，请检查文件内容与格式（勿漏引号、勿整行注释）。`,
    );
    process.exit(1);
  }
  const dbName = parseDbName(process.env.DATABASE_URL);
  if (!/test/i.test(dbName) && process.env.ALLOW_NON_TEST_DB !== "1") {
    console.error(
      `[scenario] 当前库名「${dbName}」不含 test，拒绝执行（防止误写开发库）。`,
    );
    console.error(
      "  请在 .env.test 中将 DATABASE_URL 指向测试库，例如 .../todo_think_test_db；若已从示例复制，请确认未仍使用 todo_think_db。",
    );
    console.error(
      "  若 IDE 已注入 DATABASE_URL，本脚本已用 override 读取 .env.test；若仍见此提示，说明 .env.test 里库名仍不含 test。",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  assertScenarioPrismaDelegates(prisma);

  await ensureScenarioDevMgrHasRulesMenu(prisma);

  const existed = await prisma.user.findUnique({
    where: { userName: "dev_mgr" },
  });
  if (existed) {
    console.log(
      "[scenario] 已存在用户 dev_mgr，跳过（如需重做：npm run db:test:fresh 后再 npm run db:scenario:small-team，或 npm run db:test:full）",
    );
    await prisma.$disconnect();
    return;
  }

  const ruleDefinition = {
    rules: [
      {
        id: "scenario_accept_base",
        name: "验收通过基础积分（演示）",
        when: { op: "gt", left: { path: "task.actualHours" }, right: 0 },
        then: [
          {
            type: "emitPosting",
            amount: 15,
            subject: { ref: "task.mainAssigneeId" },
            pointsType: "base",
            reasonCode: "TASK_ACCEPTED_BASE",
          },
        ],
        priority: 100,
      },
    ],
    params: {},
    variables: [],
  };
  const checksum = sha256Json(ruleDefinition);

  await prisma.$transaction(async (tx) => {
    const roleMgr = await cloneRoleWithMenus(tx, 2, {
      roleName: "研发部经理",
      roleCode: "scenario_dev_mgr",
      description: "部门负责人：项目、规则、分配与验收",
      sort: 10,
      dataScope: 4,
      remark: "场景种子",
    });
    /** 普通管理员角色种子未绑「规则管理」，动态路由无 /business/performance-rules */
    await tx.role.update({
      where: { id: roleMgr.id },
      data: { menus: { connect: { id: PERFORMANCE_RULES_MENU_ID } } },
    });
    const roleDesigner = await cloneRoleWithMenus(tx, 4, {
      roleName: "UI设计师",
      roleCode: "scenario_ui_designer",
      description: "设计与交互",
      sort: 11,
      dataScope: 5,
      remark: "场景种子",
    });
    const roleFe = await cloneRoleWithMenus(tx, 4, {
      roleName: "前端开发",
      roleCode: "scenario_fe_dev",
      description: "前端实现",
      sort: 12,
      dataScope: 5,
      remark: "场景种子",
    });
    const roleBe = await cloneRoleWithMenus(tx, 4, {
      roleName: "后端开发",
      roleCode: "scenario_be_dev",
      description: "后端实现",
      sort: 13,
      dataScope: 5,
      remark: "场景种子",
    });

    const dept = await tx.department.create({
      data: {
        parentId: null,
        ancestors: "0",
        name: "研发部",
        sort: 1,
        leader: "张经理",
        phone: null,
        email: null,
        status: 1,
      },
    });

    const uMgr = await tx.user.create({
      data: {
        userName: "dev_mgr",
        password: DEMO_PASSWORD_HASH,
        nickName: "张经理",
        userPhone: "13900000001",
        userEmail: "dev.mgr@scenario.local",
        userGender: "男",
        status: "1",
        remark: "研发部经理（场景）",
        roles: { connect: [{ id: roleMgr.id }] },
      },
    });
    const uDesigner = await tx.user.create({
      data: {
        userName: "designer01",
        password: DEMO_PASSWORD_HASH,
        nickName: "李设计",
        userPhone: "13900000002",
        userEmail: "designer@scenario.local",
        userGender: "女",
        status: "1",
        remark: "UI设计师",
        roles: { connect: [{ id: roleDesigner.id }] },
      },
    });
    const uFe1 = await tx.user.create({
      data: {
        userName: "fe01",
        password: DEMO_PASSWORD_HASH,
        nickName: "王前端一",
        userPhone: "13900000003",
        userEmail: "fe01@scenario.local",
        userGender: "男",
        status: "1",
        roles: { connect: [{ id: roleFe.id }] },
      },
    });
    const uFe2 = await tx.user.create({
      data: {
        userName: "fe02",
        password: DEMO_PASSWORD_HASH,
        nickName: "赵前端二",
        userPhone: "13900000004",
        userEmail: "fe02@scenario.local",
        userGender: "女",
        status: "1",
        roles: { connect: [{ id: roleFe.id }] },
      },
    });
    const uFe3 = await tx.user.create({
      data: {
        userName: "fe03",
        password: DEMO_PASSWORD_HASH,
        nickName: "钱前端三",
        userPhone: "13900000005",
        userEmail: "fe03@scenario.local",
        userGender: "男",
        status: "1",
        roles: { connect: [{ id: roleFe.id }] },
      },
    });
    const uBe1 = await tx.user.create({
      data: {
        userName: "be01",
        password: DEMO_PASSWORD_HASH,
        nickName: "孙后端一",
        userPhone: "13900000006",
        userEmail: "be01@scenario.local",
        userGender: "男",
        status: "1",
        roles: { connect: [{ id: roleBe.id }] },
      },
    });
    const uBe2 = await tx.user.create({
      data: {
        userName: "be02",
        password: DEMO_PASSWORD_HASH,
        nickName: "周后端二",
        userPhone: "13900000007",
        userEmail: "be02@scenario.local",
        userGender: "女",
        status: "1",
        roles: { connect: [{ id: roleBe.id }] },
      },
    });

    await tx.deptManager.create({
      data: { deptId: dept.id, userId: uMgr.id },
    });
    for (const uid of [
      uMgr.id,
      uDesigner.id,
      uFe1.id,
      uFe2.id,
      uFe3.id,
      uBe1.id,
      uBe2.id,
    ]) {
      await tx.deptMember.create({
        data: { deptId: dept.id, userId: uid },
      });
    }

    const project = await tx.project.create({
      data: {
        name: PROJECT_NAME,
        description:
          "小团队真实链路演示：规则管理绑定本项目 → 任务分配 → 工时 → 验收 → 积分",
        orgId: dept.id,
        managerId: uMgr.id,
        status: "ACTIVE",
        startDate: new Date("2026-05-01T00:00:00.000Z"),
        endDate: new Date("2026-08-31T23:59:59.000Z"),
        taskRule: {
          create: {
            requireEstimateHours: false,
            requireDueDate: false,
            requireTestEvidenceForDev: true,
            allowCoAssigneeSubmitQa: false,
            allowQaRejectWithoutHours: true,
          },
        },
      },
    });

    const ruleSet = await tx.ruleSet.create({
      data: {
        code: `scenario_proj_${project.id}`,
        name: "研发部一期积分规则",
        scope: "PROJECT",
        projectId: project.id,
        status: "ACTIVE",
      },
    });

    const ruleVersion = await tx.ruleSetVersion.create({
      data: {
        ruleSetId: ruleSet.id,
        version: 1,
        publishedBy: uMgr.id,
        publishedAt: new Date(),
        checksum,
        definition: ruleDefinition,
      },
    });

    await tx.project.update({
      where: { id: project.id },
      data: { activeRuleSetVersionId: ruleVersion.id },
    });

    const acceptedAt = new Date("2026-05-10T10:00:00.000Z");

    const taskDone = await tx.task.create({
      data: {
        projectId: project.id,
        orgId: dept.id,
        type: TaskType.FEATURE,
        workDomain: TaskWorkDomain.SOFTWARE_DEVELOPMENT,
        priority: TaskPriority.P1,
        dueDate: new Date("2026-05-15T00:00:00.000Z"),
        title: "会员中心改版（前端主导）",
        description: "列表页改版与接口联调；经理验收并计分",
        status: TaskStatus.COMPLETED,
        managerId: uMgr.id,
        mainAssigneeId: uFe1.id,
        testerId: uMgr.id,
        estimatedHours: 16,
        actualHours: 10,
        suggestedBaseScore: 15,
        baseScore: 15,
        baseScoreSource: "MANUAL",
        complexityTier: TaskComplexityTier.STANDARD,
        complexity: 1,
        acceptedAt,
        coAssignees: {
          create: [{ userId: uFe2.id }, { userId: uBe1.id }],
        },
      },
    });

    await tx.testCase.create({
      data: {
        taskId: taskDone.id,
        description: "登录后进入会员中心，列表字段与原型一致",
        expectedResult: "展示昵称、等级、积分三列",
        selfTestStatus: TestStatus.PASSED,
        selfTestRemark: "dev ok",
        qaStatus: TestStatus.PASSED,
        qaRemark: "验收通过",
        bugCount: 0,
      },
    });

    await tx.workLog.createMany({
      data: [
        {
          taskId: taskDone.id,
          userId: uFe1.id,
          hours: 6,
          content: "搭建页面骨架与路由",
        },
        {
          taskId: taskDone.id,
          userId: uFe1.id,
          hours: 4,
          content: "对接接口与联调",
        },
      ],
    });

    await tx.taskTimeline.createMany({
      data: [
        {
          taskId: taskDone.id,
          eventType: "TASK_CREATED",
          title: "创建任务",
          content: "经理分配：主责前端王前端一，协助前端二与后端一",
          toStatus: TaskStatus.PENDING,
          operatorId: uMgr.id,
        },
        {
          taskId: taskDone.id,
          eventType: "STATUS_CHANGED",
          title: "开始开发",
          fromStatus: TaskStatus.PENDING,
          toStatus: TaskStatus.IN_PROGRESS,
          operatorId: uFe1.id,
        },
        {
          taskId: taskDone.id,
          eventType: "STATUS_CHANGED",
          title: "提交验收",
          fromStatus: TaskStatus.IN_PROGRESS,
          toStatus: TaskStatus.QA_REVIEW,
          operatorId: uFe1.id,
        },
        {
          taskId: taskDone.id,
          eventType: "QA_PASSED",
          title: "验收通过",
          content: "确认实际工时 10h，纳入绩效规则结算",
          fromStatus: TaskStatus.QA_REVIEW,
          toStatus: TaskStatus.COMPLETED,
          operatorId: uMgr.id,
        },
      ],
    });

    let account = await tx.pointsAccount.findUnique({
      where: { ownerType_ownerId: { ownerType: "USER", ownerId: uFe1.id } },
    });
    if (!account) {
      account = await tx.pointsAccount.create({
        data: { ownerType: "USER", ownerId: uFe1.id, status: "ACTIVE" },
      });
    }

    const settlementKey = `task:${taskDone.id}:first:${acceptedAt.toISOString()}`;
    const inputSnapshot = {
      task: {
        id: taskDone.id,
        projectId: project.id,
        mainAssigneeId: uFe1.id,
        testerId: uMgr.id,
        actualHours: 10,
        acceptedAt: acceptedAt.toISOString(),
        workDomain: "SOFTWARE_DEVELOPMENT",
        coAssigneeIds: [uFe2.id, uBe1.id],
        testCaseBugCount: 0,
        delayHours: 0,
        priority: "P1",
        dueDate: "2026-05-15T00:00:00.000Z",
      },
    };
    const outputSnapshot = {
      metrics: [],
      explains: [{ ok: true, ruleId: "scenario_accept_base" }],
      postings: [
        {
          amount: 15,
          ruleId: "scenario_accept_base",
          subjectId: uFe1.id,
          pointsType: "base",
          reasonCode: "TASK_ACCEPTED_BASE",
          subjectType: "USER",
        },
      ],
    };

    const settlement = await tx.perfSettlement.create({
      data: {
        settlementKey,
        settlementType: "first",
        projectId: project.id,
        taskId: taskDone.id,
        occurredAt: acceptedAt,
        status: "SUCCEEDED",
        ruleSetVersionId: ruleVersion.id,
        inputSnapshot,
        outputSnapshot,
        settledAt: acceptedAt,
      },
    });

    const ledger = await tx.pointsLedgerEntry.create({
      data: {
        accountId: account.id,
        bizType: "task_settlement",
        bizId: String(settlement.id),
        projectId: project.id,
        taskId: taskDone.id,
        ruleSetVersionId: ruleVersion.id,
        pointsType: "base",
        amount: 15,
        occurredAt: acceptedAt,
        idempotencyKey: `${taskDone.id}:scenario_accept_base:${uFe1.id}:base:15`,
        explain: {
          ruleId: "scenario_accept_base",
          reasonCode: "TASK_ACCEPTED_BASE",
        },
      },
    });

    await tx.perfItem.create({
      data: {
        settlementId: settlement.id,
        subjectType: "USER",
        subjectId: uFe1.id,
        metricCode: "points_base",
        value: 15,
        sourceLedgerEntryId: ledger.id,
        explain: {
          kind: "posting",
          ruleId: "scenario_accept_base",
          reasonCode: "TASK_ACCEPTED_BASE",
        },
      },
    });

    await tx.ruleExecution.create({
      data: {
        ruleSetVersionId: ruleVersion.id,
        triggerType: "TaskAccepted",
        triggerId: String(taskDone.id),
        status: "SUCCEEDED",
        inputSnapshot,
        outputSnapshot,
        endedAt: acceptedAt,
      },
    });

    await tx.task.create({
      data: {
        projectId: project.id,
        orgId: dept.id,
        type: TaskType.ENHANCEMENT,
        workDomain: TaskWorkDomain.SOFTWARE_DEVELOPMENT,
        priority: TaskPriority.P2,
        title: "组件库主题切换优化",
        description: "进行中：主责钱前端三",
        status: TaskStatus.IN_PROGRESS,
        managerId: uMgr.id,
        mainAssigneeId: uFe3.id,
        testerId: uMgr.id,
        estimatedHours: 12,
        actualHours: 3,
        complexityTier: TaskComplexityTier.STANDARD,
        complexity: 1,
      },
    });

    await tx.task.create({
      data: {
        projectId: project.id,
        orgId: dept.id,
        type: TaskType.FEATURE,
        workDomain: TaskWorkDomain.SOFTWARE_DEVELOPMENT,
        priority: TaskPriority.P0,
        dueDate: new Date("2026-05-20T00:00:00.000Z"),
        title: "订单 API 分页改造",
        description: "验收中：主责周后端二，协助王前端一",
        status: TaskStatus.QA_REVIEW,
        managerId: uMgr.id,
        mainAssigneeId: uBe2.id,
        testerId: uMgr.id,
        estimatedHours: 8,
        actualHours: 6,
        baseScore: 12,
        baseScoreSource: "MANUAL",
        complexityTier: TaskComplexityTier.COMPLEX,
        complexity: 1.2,
        coAssignees: {
          create: [{ userId: uFe1.id }],
        },
      },
    });

    await tx.task.create({
      data: {
        projectId: project.id,
        orgId: dept.id,
        type: TaskType.FEATURE,
        workDomain: TaskWorkDomain.PRODUCT_DESIGN,
        priority: TaskPriority.P2,
        title: "后台报表交互稿",
        description: "待开发：主责李设计，经理分配",
        status: TaskStatus.PENDING,
        managerId: uMgr.id,
        mainAssigneeId: uDesigner.id,
        testerId: uMgr.id,
        estimatedHours: 16,
        complexityTier: TaskComplexityTier.STANDARD,
        complexity: 1,
      },
    });
  });

  console.log("[scenario] 写入完成。");
  console.log(`  项目：${PROJECT_NAME}`);
  console.log("  登录（密码演示环境 123456）：dev_mgr / designer01 / fe01 fe02 fe03 / be01 be02");
  console.log("  后端请使用：npm run dev:testdb");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[scenario] 失败:", e);
  process.exit(1);
});
