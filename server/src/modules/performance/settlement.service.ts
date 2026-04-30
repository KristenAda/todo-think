import prisma from "../../core/prisma";
import logger from "../../core/logger";
import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";

type TaskFact = {
  task: {
    id: number;
    projectId: number;
    workDomain: string;
    priority: string;
    dueDate: string | null;
    acceptedAt: string;
    estimatedHours: number | null;
    actualHours: number;
    mainAssigneeId: number | null;
    testerId: number | null;
    coAssigneeIds: number[];
    testCaseBugCount: number;
    delayHours: number;
    aheadDays: number;
    baseScore: number;
    complexity: number;
  };
};

type Expr =
  | number
  | { path: string }
  | { var: string }
  | { param: string }
  | { fn: string; args?: any[] };

type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { op: string; left: any; right: any };

type RuleAction =
  | {
      type: "emitPosting";
      subject: { ref: string }; // e.g. task.mainAssigneeId
      pointsType: string;
      amount: Expr;
      reasonCode?: string;
    }
  | {
      type: "emitMetric";
      subject: { ref: string };
      metricCode: string;
      value: Expr;
      reasonCode?: string;
    };

type Rule = {
  id: string;
  name?: string;
  priority?: number;
  when?: Condition;
  then: RuleAction[];
};

type RuleSetDefinition = {
  params?: Record<string, number>;
  variables?: { code: string; expr: Expr }[];
  rules: Rule[];
};

export function simulateRuleSetDefinition(def: RuleSetDefinition, inputSnapshot: any) {
  const ctx: any = {
    ...(inputSnapshot ?? {}),
    __params: def.params ?? {},
    __vars: {},
  };

  for (const vv of def.variables ?? []) {
    ctx.__vars[vv.code] = evalExpr(vv.expr, ctx);
  }

  const postings: any[] = [];
  const metrics: any[] = [];
  const explains: any[] = [];

  const rules = [...(def.rules ?? [])].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  for (const r of rules) {
    const ok = evalCondition(r.when, ctx);
    if (!ok) continue;
    for (const act of r.then ?? []) {
      if (act.type === "emitPosting") {
        const subjectId = Number(getPath(ctx, act.subject.ref) ?? 0);
        if (!subjectId) continue;
        const amount = Math.round(evalExpr(act.amount, ctx));
        if (!amount) continue;
        postings.push({
          subjectType: "USER",
          subjectId,
          pointsType: act.pointsType,
          amount,
          reasonCode: act.reasonCode ?? r.id,
          ruleId: r.id,
        });
      }
      if (act.type === "emitMetric") {
        const subjectId = Number(getPath(ctx, act.subject.ref) ?? 0);
        if (!subjectId) continue;
        metrics.push({
          subjectType: "USER",
          subjectId,
          metricCode: act.metricCode,
          value: evalExpr(act.value, ctx),
          reasonCode: act.reasonCode ?? r.id,
          ruleId: r.id,
        });
      }
    }
    explains.push({ ruleId: r.id, ok: true });
  }

  return { postings, metrics, explains };
}

function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

function getPath(obj: any, path: string) {
  const segs = path.split(".");
  let cur = obj;
  for (const s of segs) {
    if (cur == null) return null;
    cur = cur[s];
  }
  return cur ?? null;
}

function evalExpr(expr: Expr, ctx: any): number {
  if (typeof expr === "number") return expr;
  if ("path" in expr) return Number(getPath(ctx, expr.path) ?? 0);
  if ("var" in expr) return Number(ctx.__vars?.[expr.var] ?? 0);
  if ("param" in expr) return Number(ctx.__params?.[expr.param] ?? 0);
  if ("fn" in expr) {
    const args = (expr.args ?? []).map((a) =>
      typeof a === "object" && a != null && ("op" in a || "all" in a || "any" in a || "not" in a)
        ? a
        : a
    );
    switch (expr.fn) {
      case "add":
        return (expr.args ?? []).reduce((sum, a) => sum + evalExpr(a as any, ctx), 0);
      case "sub":
        return evalExpr((expr.args ?? [0])[0] as any, ctx) - evalExpr((expr.args ?? [0, 0])[1] as any, ctx);
      case "mul":
        return (expr.args ?? []).reduce((prod, a) => prod * evalExpr(a as any, ctx), 1);
      case "div": {
        const a = evalExpr((expr.args ?? [0])[0] as any, ctx);
        const b = evalExpr((expr.args ?? [0, 1])[1] as any, ctx);
        return b === 0 ? 0 : a / b;
      }
      case "max":
        return Math.max(...(expr.args ?? []).map((a) => evalExpr(a as any, ctx)));
      case "min":
        return Math.min(...(expr.args ?? []).map((a) => evalExpr(a as any, ctx)));
      case "round": {
        const v = evalExpr((expr.args ?? [0])[0] as any, ctx);
        return Math.round(v);
      }
      case "piecewise": {
        const pieces = (expr.args ?? []) as any[];
        for (const p of pieces) {
          if (!p?.when) continue;
          if (evalCondition(p.when as any, ctx)) return evalExpr(p.value as any, ctx);
        }
        return 0;
      }
      case "formula": {
        const formulaText = String((expr.args ?? [])[0] ?? "").trim();
        if (!formulaText) return 0;
        const taskVars = (ctx?.task ?? {}) as Record<string, any>;
        const merged: Record<string, any> = {
          ...(ctx.__params ?? {}),
          ...(ctx.__vars ?? {}),
          ...taskVars,
          max: Math.max,
          min: Math.min,
          abs: Math.abs,
          round: Math.round,
        };
        const names = Object.keys(merged);
        const values = Object.values(merged);
        try {
          const fn = new Function(...names, `return (${formulaText});`);
          const result = fn(...values);
          return Number.isFinite(Number(result)) ? Number(result) : 0;
        } catch {
          return 0;
        }
      }
      default:
        return 0;
    }
  }
  return 0;
}

function evalCondition(cond: Condition | undefined, ctx: any): boolean {
  if (!cond) return true;
  if ("all" in cond) return cond.all.every((c) => evalCondition(c, ctx));
  if ("any" in cond) return cond.any.some((c) => evalCondition(c, ctx));
  if ("not" in cond) return !evalCondition(cond.not, ctx);
  const left = typeof cond.left === "object" ? evalExpr(cond.left as any, ctx) : cond.left;
  const right = typeof cond.right === "object" ? evalExpr(cond.right as any, ctx) : cond.right;
  switch (cond.op) {
    case "eq":
      return left === right;
    case "ne":
      return left !== right;
    case "gt":
      return left > right;
    case "gte":
      return left >= right;
    case "lt":
      return left < right;
    case "lte":
      return left <= right;
    default:
      return false;
  }
}

async function ensureGlobalDefaultRuleSet() {
  const code = "global-default";
  const existing = await prisma.ruleSet.findUnique({ where: { code } });
  if (existing) return existing;

  return prisma.ruleSet.create({
    data: { code, name: "全局默认规则", scope: "GLOBAL" },
  });
}

async function ensureGlobalDefaultRuleSetVersion(ruleSetId: number) {
  const latest = await prisma.ruleSetVersion.findFirst({
    where: { ruleSetId },
    orderBy: { version: "desc" },
  });
  if (latest) return latest;

  const def: RuleSetDefinition = {
    params: {},
    variables: [
      // delayHours = max(0, (acceptedAt - dueDate) hours)
      { code: "delayHours", expr: { path: "task.delayHours" } },
    ],
    rules: [
      {
        id: "base_points",
        name: "验收通过基础积分",
        priority: 100,
        when: { op: "gt", left: { path: "task.actualHours" }, right: 0 },
        then: [
          {
            type: "emitPosting",
            subject: { ref: "task.mainAssigneeId" },
            pointsType: "base",
            amount: 10,
            reasonCode: "TASK_ACCEPTED_BASE",
          },
        ],
      },
    ],
  };

  const definitionText = JSON.stringify(def);
  return prisma.ruleSetVersion.create({
    data: {
      ruleSetId,
      version: 1,
      checksum: sha256(definitionText),
      definition: def as any,
    },
  });
}

async function getEffectiveRuleSetVersionId(projectId: number, occurredAt: Date) {
  // 1) 项目级规则（若未来实现）——暂留接口位
  const projectRuleSet = await prisma.ruleSet.findFirst({
    where: { scope: "PROJECT", projectId, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
  });
  if (projectRuleSet) {
    const v = await prisma.ruleSetVersion.findFirst({
      where: {
        ruleSetId: projectRuleSet.id,
        OR: [
          { effectiveFrom: null, effectiveTo: null },
          {
            AND: [
              { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: occurredAt } }] },
              { OR: [{ effectiveTo: null }, { effectiveTo: { gte: occurredAt } }] },
            ],
          },
        ],
      },
      orderBy: { version: "desc" },
    });
    if (v) return v.id;
  }

  // 2) 全局默认
  const global = await ensureGlobalDefaultRuleSet();
  const globalV = await ensureGlobalDefaultRuleSetVersion(global.id);
  return globalV.id;
}

function buildTaskFact(task: any): TaskFact {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const acceptedAt = task.acceptedAt ? new Date(task.acceptedAt) : new Date(task.updatedAt);
  const delayHours =
    dueDate && acceptedAt ? Math.max(0, (acceptedAt.getTime() - dueDate.getTime()) / 3600000) : 0;
  const aheadDays =
    dueDate && acceptedAt ? Math.floor((dueDate.getTime() - acceptedAt.getTime()) / (24 * 3600000)) : 0;

  const bugCount = (task.testCases ?? []).reduce((sum: number, tc: any) => sum + (tc.bugCount ?? 0), 0);
  const coAssigneeIds = (task.coAssignees ?? []).map((r: any) => r.userId);

  return {
    task: {
      id: task.id,
      projectId: task.projectId,
      workDomain: task.workDomain,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      acceptedAt: acceptedAt.toISOString(),
      estimatedHours: task.estimatedHours ?? null,
      actualHours: task.actualHours ?? 0,
      mainAssigneeId: task.mainAssigneeId ?? null,
      testerId: task.testerId ?? null,
      coAssigneeIds,
      testCaseBugCount: bugCount,
      delayHours,
      aheadDays,
      baseScore:
        (task as any).baseScore ??
        (task as any).suggestedBaseScore ??
        task.estimatedHours ??
        0,
      complexity: 1,
    },
  } as any;
}

async function ensurePointsAccount(tx: Prisma.TransactionClient, ownerType: string, ownerId: number) {
  const existing = await tx.pointsAccount.findUnique({
    where: { ownerType_ownerId: { ownerType, ownerId } },
  });
  if (existing) return existing;
  return tx.pointsAccount.create({ data: { ownerType, ownerId } });
}

export async function createFirstSettlementForAcceptedTask(taskId: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { coAssignees: true, testCases: true },
  });
  if (!task) throw new Error("task not found");
  if (!task.acceptedAt) throw new Error("task.acceptedAt missing");

  const occurredAt = new Date(task.acceptedAt);
  const ruleSetVersionId = await getEffectiveRuleSetVersionId(task.projectId, occurredAt);

  const inputSnapshot = buildTaskFact(task);
  const settlementKey = `task:${taskId}:first:${occurredAt.toISOString()}`;

  await prisma.perfSettlement.create({
    data: {
      settlementKey,
      settlementType: "first",
      projectId: task.projectId,
      taskId,
      occurredAt,
      status: "PENDING",
      ruleSetVersionId,
      inputSnapshot: inputSnapshot as any,
    },
  });
}

export async function createReversalSettlement(taskId: number, occurredAt: Date) {
  const last = await prisma.perfSettlement.findFirst({
    where: { taskId, status: "SUCCEEDED", settlementType: { not: "reversal" } },
    orderBy: { occurredAt: "desc" },
  });
  if (!last) return;

  const settlementKey = `task:${taskId}:reversal:${occurredAt.toISOString()}:${last.id.toString()}`;
  await prisma.perfSettlement.create({
    data: {
      settlementKey,
      settlementType: "reversal",
      projectId: last.projectId,
      taskId,
      occurredAt,
      status: "PENDING",
      ruleSetVersionId: last.ruleSetVersionId,
      replacesSettlementId: last.id,
      inputSnapshot: last.inputSnapshot as any,
    },
  });
}

export async function createAdjustmentSettlementForTask(
  taskId: number,
  ruleSetVersionId?: number,
  occurredAt: Date = new Date(),
) {
  const lastEffective = await prisma.perfSettlement.findFirst({
    where: {
      taskId,
      status: "SUCCEEDED",
      settlementType: { in: ["first", "adjustment"] },
    },
    orderBy: { occurredAt: "desc" },
  });
  if (!lastEffective) {
    throw new Error("no effective settlement found for adjustment");
  }

  const finalRuleSetVersionId =
    ruleSetVersionId ??
    (await getEffectiveRuleSetVersionId(lastEffective.projectId, occurredAt));

  const settlementKey = `task:${taskId}:adjustment:${occurredAt.toISOString()}:${lastEffective.id.toString()}`;
  return prisma.perfSettlement.create({
    data: {
      settlementKey,
      settlementType: "adjustment",
      projectId: lastEffective.projectId,
      taskId,
      occurredAt,
      status: "PENDING",
      ruleSetVersionId: finalRuleSetVersionId,
      replacesSettlementId: lastEffective.id,
      inputSnapshot: lastEffective.inputSnapshot as any,
    },
  });
}

export async function settleOnePending(settlementId: bigint) {
  // 抢占：PENDING -> RUNNING
  const claimed = await prisma.perfSettlement.updateMany({
    where: { id: settlementId, status: "PENDING" },
    data: { status: "RUNNING" },
  });
  if (claimed.count === 0) return;

  const s = await prisma.perfSettlement.findUnique({ where: { id: settlementId } });
  if (!s) return;

  try {
    if (s.settlementType === "reversal") {
      await processReversal(s);
    } else if (s.settlementType === "adjustment") {
      await processAdjustment(s);
    } else {
      await processRuleSettlement(s);
    }
    await prisma.perfSettlement.update({
      where: { id: settlementId },
      data: { status: "SUCCEEDED", settledAt: new Date() },
    });
  } catch (e: any) {
    logger.error(`[perf] settle failed id=${settlementId.toString()}: ${e?.message ?? e}`);
    await prisma.perfSettlement.update({
      where: { id: settlementId },
      data: { status: "FAILED", errorMessage: e?.message ?? String(e) },
    });
  }
}

function aggregatePostings(postings: any[] = []) {
  const m = new Map<string, number>();
  for (const p of postings) {
    const key = `${p.subjectType ?? "USER"}:${p.subjectId}:${p.pointsType}`;
    m.set(key, (m.get(key) ?? 0) + Number(p.amount ?? 0));
  }
  return m;
}

async function processReversal(s: any) {
  if (!s.replacesSettlementId) throw new Error("reversal missing replacesSettlementId");
  const originalId = s.replacesSettlementId.toString();

  // 查原结算所有流水并等额反向冲正
  const originalEntries = await prisma.pointsLedgerEntry.findMany({
    where: { bizType: "task_settlement", bizId: originalId },
  });

  await prisma.$transaction(async (tx) => {
    for (const e of originalEntries) {
      await tx.pointsLedgerEntry.create({
        data: {
          accountId: e.accountId,
          bizType: "reversal",
          bizId: s.id.toString(),
          projectId: e.projectId,
          taskId: e.taskId,
          ruleSetVersionId: e.ruleSetVersionId,
          pointsType: e.pointsType,
          amount: -e.amount,
          occurredAt: s.occurredAt,
          idempotencyKey: `${s.id.toString()}:rev:${e.id.toString()}`,
          explain: {
            kind: "reversal",
            originalEntryId: e.id.toString(),
            originalSettlementId: originalId,
          } as any,
        },
      });
    }
  });
}

async function processRuleSettlement(s: any) {
  if (!s.ruleSetVersionId) throw new Error("missing ruleSetVersionId");
  const v = await prisma.ruleSetVersion.findUnique({ where: { id: s.ruleSetVersionId } });
  if (!v) throw new Error("ruleSetVersion not found");

  const def = v.definition as any as RuleSetDefinition;
  const outputSnapshot = simulateRuleSetDefinition(def, s.inputSnapshot ?? {});
  const { postings, metrics } = outputSnapshot as any;
  await prisma.perfSettlement.update({
    where: { id: s.id },
    data: { outputSnapshot: outputSnapshot as any },
  });

  await prisma.ruleExecution.create({
    data: {
      ruleSetVersionId: v.id,
      triggerType: "TaskAccepted",
      triggerId: s.id.toString(),
      status: "SUCCEEDED",
      inputSnapshot: s.inputSnapshot as any,
      outputSnapshot: outputSnapshot as any,
      endedAt: new Date(),
    },
  });

  await prisma.$transaction(async (tx) => {
    for (const p of postings) {
      const account = await ensurePointsAccount(tx, "USER", p.subjectId);
      const entry = await tx.pointsLedgerEntry.create({
        data: {
          accountId: account.id,
          bizType: "task_settlement",
          bizId: s.id.toString(),
          projectId: s.projectId,
          taskId: s.taskId,
          ruleSetVersionId: v.id,
          pointsType: p.pointsType,
          amount: p.amount,
          occurredAt: s.occurredAt,
          idempotencyKey: `${s.id.toString()}:${p.ruleId}:${p.subjectId}:${p.pointsType}:${p.amount}`,
          explain: { reasonCode: p.reasonCode, ruleId: p.ruleId } as any,
        },
      });

      await tx.perfItem.create({
        data: {
          settlementId: s.id,
          subjectType: "USER",
          subjectId: p.subjectId,
          metricCode: `points_${p.pointsType}`,
          value: p.amount,
          sourceLedgerEntryId: entry.id,
          explain: { kind: "posting", reasonCode: p.reasonCode, ruleId: p.ruleId } as any,
        },
      });
    }

    for (const m of metrics) {
      await tx.perfItem.create({
        data: {
          settlementId: s.id,
          subjectType: m.subjectType,
          subjectId: m.subjectId,
          metricCode: m.metricCode,
          value: m.value,
          explain: { kind: "metric", reasonCode: m.reasonCode, ruleId: m.ruleId } as any,
        },
      });
    }
  });
}

async function processAdjustment(s: any) {
  if (!s.ruleSetVersionId) throw new Error("missing ruleSetVersionId for adjustment");
  if (!s.replacesSettlementId) throw new Error("missing replacesSettlementId for adjustment");

  const v = await prisma.ruleSetVersion.findUnique({ where: { id: s.ruleSetVersionId } });
  if (!v) throw new Error("ruleSetVersion not found");

  const baseSettlement = await prisma.perfSettlement.findUnique({
    where: { id: s.replacesSettlementId },
  });
  if (!baseSettlement) throw new Error("base settlement not found");

  const def = v.definition as any as RuleSetDefinition;
  const expected = simulateRuleSetDefinition(def, s.inputSnapshot ?? {});
  const expectedAgg = aggregatePostings(expected.postings);
  const baseAgg = aggregatePostings((baseSettlement.outputSnapshot as any)?.postings ?? []);

  const diffPostings: any[] = [];
  const allKeys = new Set([...expectedAgg.keys(), ...baseAgg.keys()]);
  for (const key of allKeys) {
    const expectedAmount = expectedAgg.get(key) ?? 0;
    const baseAmount = baseAgg.get(key) ?? 0;
    const delta = expectedAmount - baseAmount;
    if (!delta) continue;
    const [subjectType, subjectIdText, pointsType] = key.split(":");
    diffPostings.push({
      subjectType,
      subjectId: Number(subjectIdText),
      pointsType,
      amount: delta,
      reasonCode: "ADJUSTMENT_DIFF",
      ruleId: "ADJUSTMENT_DIFF",
    });
  }

  const outputSnapshot = {
    expectedPostings: expected.postings,
    basePostings: (baseSettlement.outputSnapshot as any)?.postings ?? [],
    postings: diffPostings,
    metrics: expected.metrics ?? [],
    explains: expected.explains ?? [],
  };

  await prisma.perfSettlement.update({
    where: { id: s.id },
    data: { outputSnapshot: outputSnapshot as any },
  });

  await prisma.ruleExecution.create({
    data: {
      ruleSetVersionId: v.id,
      triggerType: "Adjustment",
      triggerId: s.id.toString(),
      status: "SUCCEEDED",
      inputSnapshot: s.inputSnapshot as any,
      outputSnapshot: outputSnapshot as any,
      endedAt: new Date(),
    },
  });

  await prisma.$transaction(async (tx) => {
    for (const p of diffPostings) {
      const account = await ensurePointsAccount(tx, "USER", p.subjectId);
      const entry = await tx.pointsLedgerEntry.create({
        data: {
          accountId: account.id,
          bizType: "adjustment",
          bizId: s.id.toString(),
          projectId: s.projectId,
          taskId: s.taskId,
          ruleSetVersionId: v.id,
          pointsType: p.pointsType,
          amount: p.amount,
          occurredAt: s.occurredAt,
          idempotencyKey: `${s.id.toString()}:adj:${p.subjectId}:${p.pointsType}:${p.amount}`,
          explain: {
            reasonCode: p.reasonCode,
            ruleId: p.ruleId,
            replacesSettlementId: s.replacesSettlementId?.toString?.(),
          } as any,
        },
      });

      await tx.perfItem.create({
        data: {
          settlementId: s.id,
          subjectType: "USER",
          subjectId: p.subjectId,
          metricCode: `points_${p.pointsType}`,
          value: p.amount,
          sourceLedgerEntryId: entry.id,
          explain: { kind: "adjustment", reasonCode: p.reasonCode, ruleId: p.ruleId } as any,
        },
      });
    }
  });
}

