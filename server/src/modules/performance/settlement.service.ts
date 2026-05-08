import { coefficientFromTaskComplexityTier } from "../task/taskComplexityTier";
import prisma from "../../core/prisma";
import logger from "../../core/logger";
import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { pushJsonToUser } from "@/core/wsHub";

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
    /** 任务时间线 QA_REJECTED 次数；规则变量 rejectCount 同源 */
    rejectCount: number;
    testCaseBugCount: number;
    delayHours: number;
    aheadDays: number;
    baseScore: number;
    /** 与 Prisma TaskComplexityTier 一致 */
    complexityTier: string;
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
      /** 单人入账（主责任人等） */
      subject?: { ref?: string; refMany?: string };
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
  variables?: { code: string; expr: Expr; label?: string; name?: string }[];
  rules: Rule[];
};

/** JSON.rules 偶发为「类数组对象」；与对象键顺序无关，按数字键序还原为数组 */
function normalizeRulesList(rules: unknown): Rule[] {
  if (Array.isArray(rules)) return rules as Rule[];
  if (rules != null && typeof rules === "object") {
    const o = rules as Record<string, unknown>;
    return Object.keys(o)
      .sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return a.localeCompare(b);
      })
      .map((k) => o[k])
      .filter((x): x is Rule => x != null && typeof x === "object");
  }
  return [];
}

function normalizeThenList(rule: Rule): RuleAction[] {
  const thenRaw = (rule as any).then ?? (rule as any).actions;
  return Array.isArray(thenRaw) ? thenRaw : thenRaw ? [thenRaw] : [];
}

function actionKind(t: unknown): string {
  return String(t ?? "")
    .replace(/[-_\s]/g, "")
    .toLowerCase();
}

function isEmitPostingAction(act: any): boolean {
  return actionKind(act?.type) === "emitposting";
}

function isEmitMetricAction(act: any): boolean {
  return actionKind(act?.type) === "emitmetric";
}

/** 流水 explain.ruleId 占位符，不是 DSL 里的规则 id，不参与「优先规则」解析 */
function isSyntheticLedgerRuleId(id: unknown): boolean {
  const s = String(id ?? "").trim().toUpperCase().replace(/-/g, "_");
  return s === "ADJUSTMENT_DIFF";
}

/** 从 amount 表达式树中递归取出 formula 文本（支持 round(mul(formula(...))) 等嵌套） */
function extractFormulaTextFromExpr(amount: any, depth = 0): string | null {
  if (depth > 16 || amount == null) return null;
  if (typeof amount === "string") {
    const t = amount.trim();
    return t || null;
  }
  if (typeof amount !== "object") return null;
  const fn = String((amount as any).fn ?? "").toLowerCase();
  if (fn === "formula") {
    const arg0 = (amount as any).args?.[0];
    if (typeof arg0 === "string") {
      const t = arg0.trim();
      if (t) return t;
    }
    if (arg0 != null && typeof arg0 === "object") {
      const inner = extractFormulaTextFromExpr(arg0, depth + 1);
      if (inner) return inner;
    }
    return null;
  }
  const args = (amount as any).args;
  if (Array.isArray(args)) {
    for (const a of args) {
      const hit = extractFormulaTextFromExpr(a, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

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

  const rules = normalizeRulesList(def.rules).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  for (const r of rules) {
    const ok = evalCondition(r.when, ctx);
    if (!ok) continue;
    for (const act of normalizeThenList(r)) {
      const a = act as any;
      if (isEmitPostingAction(act)) {
        const amount = Math.round(evalExpr(a.amount, ctx));
        if (!amount) continue;

        const refMany = a.subject?.refMany ? String(a.subject.refMany).trim() : "";
        if (refMany) {
          const rawIds = getPath(ctx, refMany);
          const subjectIds = normalizePostingSubjectIds(rawIds);
          for (const subjectId of subjectIds) {
            postings.push({
              subjectType: "USER",
              subjectId,
              pointsType: a.pointsType,
              amount,
              reasonCode: a.reasonCode ?? r.id,
              ruleId: r.id,
            });
          }
          continue;
        }

        const refOne = a.subject?.ref ? String(a.subject.ref).trim() : "";
        const subjectId = refOne ? Number(getPath(ctx, refOne) ?? 0) : 0;
        if (!subjectId) continue;
        postings.push({
          subjectType: "USER",
          subjectId,
          pointsType: a.pointsType,
          amount,
          reasonCode: a.reasonCode ?? r.id,
          ruleId: r.id,
        });
      }
      if (isEmitMetricAction(act)) {
        const subjectId = Number(getPath(ctx, a.subject.ref) ?? 0);
        if (!subjectId) continue;
        metrics.push({
          subjectType: "USER",
          subjectId,
          metricCode: a.metricCode,
          value: evalExpr(a.value, ctx),
          reasonCode: a.reasonCode ?? r.id,
          ruleId: r.id,
        });
      }
    }
    explains.push({ ruleId: r.id, ok: true });
  }

  return { postings, metrics, explains };
}

/** 定义里任意位置出现 formula DSL 时兜底取出（兼容 type/then 字段名不标准） */
function deepFindFormulaInDefinition(
  root: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet(),
): string | null {
  if (depth > 48 || root == null) return null;
  if (typeof root !== "object") return null;
  if (seen.has(root as object)) return null;
  seen.add(root as object);
  const o = root as any;
  const fn = String(o.fn ?? "").toLowerCase();
  if (fn === "formula" && Array.isArray(o.args) && typeof o.args[0] === "string") {
    const t = o.args[0].trim();
    if (t.length > 0) return t;
  }
  for (const v of Object.values(o)) {
    if (v != null && typeof v === "object") {
      const hit = deepFindFormulaInDefinition(v, depth + 1, seen);
      if (hit) return hit;
    }
  }
  return null;
}

/** 与 simulate 一致按 priority 从高到低；若提供 preferredRuleId 则优先从该条规则的 then 中取公式 */
function extractPrimaryFormulaExpression(
  def: RuleSetDefinition,
  preferredRuleId?: string | null,
): string | null {
  const rulesSorted = normalizeRulesList(def.rules).sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );

  const tryRule = (r: Rule): string | null => {
    for (const act of normalizeThenList(r)) {
      const a = act as any;
      const postingLike =
        isEmitPostingAction(act) ||
        (a &&
          typeof a === "object" &&
          typeof a.pointsType === "string" &&
          Object.prototype.hasOwnProperty.call(a, "amount"));
      if (!postingLike) continue;
      const text = extractFormulaTextFromExpr(a.amount);
      if (text) return text;
    }
    return null;
  };

  const prefId =
    preferredRuleId && !isSyntheticLedgerRuleId(preferredRuleId) ? preferredRuleId : null;
  if (prefId) {
    const pref = rulesSorted.find((r) => String(r.id) === String(prefId));
    if (pref) {
      const hit = tryRule(pref);
      if (hit) return hit;
    }
  }
  for (const r of rulesSorted) {
    const hit = tryRule(r);
    if (hit) return hit;
  }
  return deepFindFormulaInDefinition(def);
}

function escapeRegExpIdent(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 与 emitPosting formula 分支一致：params + 规则变量 + task 扁平字段参与运算 */
function buildFormulaEvalMerged(ctx: any): Record<string, any> {
  const taskVars = (ctx?.task ?? {}) as Record<string, any>;
  return {
    ...(ctx.__params ?? {}),
    ...(ctx.__vars ?? {}),
    ...taskVars,
    max: Math.max,
    min: Math.min,
    abs: Math.abs,
    round: Math.round,
  };
}

function evalFormulaStringStandalone(formulaText: string, ctx: any): number {
  const merged = buildFormulaEvalMerged(ctx);
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

/** 仅数值绑定（用于把公式里的标识符替换为字面量，便于展示） */
function buildFormulaNumericMap(ctx: any): Record<string, number> {
  const taskVars = (ctx?.task ?? {}) as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries((ctx?.__params ?? {}) as Record<string, unknown>)) {
    const n = Number(v);
    if (!Number.isNaN(n)) out[k] = n;
  }
  for (const [k, v] of Object.entries((ctx?.__vars ?? {}) as Record<string, unknown>)) {
    const n = Number(v);
    out[k] = Number.isFinite(n) ? n : 0;
  }
  for (const [k, v] of Object.entries(taskVars)) {
    const n = Number(v);
    if (!Number.isNaN(n)) out[k] = n;
  }
  return out;
}

function formatScalarForFormulaDisplay(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return String(Number(n.toFixed(4)));
}

/** 将公式中的标识符替换为当前数值（长标识符优先，避免短名误伤） */
function substituteIdentifiersInFormula(formulaText: string, numericMap: Record<string, number>): string {
  const keys = Object.keys(numericMap).sort((a, b) => b.length - a.length);
  let out = formulaText;
  for (const key of keys) {
    const disp = formatScalarForFormulaDisplay(numericMap[key]!);
    const re = new RegExp(`\\b${escapeRegExpIdent(key)}\\b`, "g");
    out = out.replace(re, disp);
  }
  return out;
}

/** 基于规则定义 + 结算输入快照，推导公式、变量取值、规则命中与模拟分录（用于积分日志说明） */
export function buildRuleEvaluationDetail(
  def: RuleSetDefinition | null | undefined,
  inputSnapshot: any,
  opts?: { preferredRuleId?: string | null },
): {
  formulaExpression: string | null;
  /** 将标识符替换为实际数值后的公式文本（便于阅读） */
  formulaWithValues: string | null;
  /** 与引擎一致的公式求值结果（取整前） */
  formulaEvalRaw: number | null;
  /** 与入账 Math.round 一致 */
  formulaEvalRounded: number | null;
  variableRows: { code: string; name?: string; sourcePath?: string; value: number }[];
  triggeredRules: { ruleId: string; name?: string; matched: boolean }[];
  simulatedPostings: any[];
  simulatedMetrics: any[];
} | null {
  if (!def) return null;
  const formulaExpression = extractPrimaryFormulaExpression(def, opts?.preferredRuleId ?? null);
  const ctx: any = {
    ...(inputSnapshot ?? {}),
    __params: def.params ?? {},
    __vars: {},
  };
  const variableRows: { code: string; name?: string; sourcePath?: string; value: number }[] = [];
  for (const vv of def.variables ?? []) {
    const val = evalExpr(vv.expr, ctx);
    ctx.__vars[vv.code] = val;
    let sourcePath: string | undefined;
    if (vv.expr && typeof vv.expr === "object" && "path" in vv.expr) {
      sourcePath = String((vv.expr as any).path);
    }
    const rawLabel = (vv as { label?: string; name?: string }).label ?? (vv as { name?: string }).name;
    const nameFromDef =
      typeof rawLabel === "string" && rawLabel.trim() ? rawLabel.trim() : undefined;
    variableRows.push({ code: vv.code, name: nameFromDef, sourcePath, value: Number(val) });
  }
  const rules = normalizeRulesList(def.rules).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const triggeredRules = rules.map((r) => ({
    ruleId: r.id,
    name: r.name,
    matched: evalCondition(r.when, ctx),
  }));
  const sim = simulateRuleSetDefinition(def, inputSnapshot);

  const numericMap = buildFormulaNumericMap(ctx);
  let formulaWithValues: string | null = null;
  let formulaEvalRaw: number | null = null;
  let formulaEvalRounded: number | null = null;
  if (formulaExpression) {
    formulaWithValues =
      substituteIdentifiersInFormula(formulaExpression, numericMap) || formulaExpression;
    const raw = evalFormulaStringStandalone(formulaExpression, ctx);
    formulaEvalRaw = Number.isFinite(raw) ? raw : null;
    formulaEvalRounded =
      formulaEvalRaw != null && Number.isFinite(formulaEvalRaw) ? Math.round(formulaEvalRaw) : null;
  }

  return {
    formulaExpression,
    formulaWithValues,
    formulaEvalRaw,
    formulaEvalRounded,
    variableRows,
    triggeredRules,
    simulatedPostings: sim.postings,
    simulatedMetrics: sim.metrics,
  };
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

/** refMany：coAssigneeIds 等路径解析为去重后的正整数用户 ID */
function normalizePostingSubjectIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const ids = new Set<number>();
  for (const x of raw) {
    const n = Number(x);
    if (Number.isFinite(n) && n > 0) ids.add(Math.trunc(n));
  }
  return [...ids];
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
  const effectiveWindow: any = {
    OR: [
      { effectiveFrom: null, effectiveTo: null },
      {
        AND: [
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: occurredAt } }] },
          { OR: [{ effectiveTo: null }, { effectiveTo: { gte: occurredAt } }] },
        ],
      },
    ],
  };

  const projectRow = await prisma.project.findUnique({
    where: { id: projectId },
    select: { activeRuleSetVersionId: true },
  });

  if (projectRow?.activeRuleSetVersionId) {
    const pinned = await prisma.ruleSetVersion.findFirst({
      where: {
        id: projectRow.activeRuleSetVersionId,
        ...effectiveWindow,
      },
      include: {
        ruleSet: { select: { status: true, scope: true, projectId: true } },
      },
    });
    if (pinned && pinned.ruleSet.status === "ACTIVE") {
      const rs = pinned.ruleSet;
      const applies =
        rs.scope === "GLOBAL" ||
        (rs.scope === "PROJECT" && rs.projectId === projectId);
      if (applies) return pinned.id;
    }
  }

  // 1) 先取项目规则（同项目下如有多个规则集，取最新版本）
  const projectRuleSets = await prisma.ruleSet.findMany({
    where: { scope: "PROJECT", projectId, status: "ACTIVE" },
    select: { id: true },
  });
  if (projectRuleSets.length) {
    const projectVersion = await prisma.ruleSetVersion.findFirst({
      where: {
        ruleSetId: { in: projectRuleSets.map((x) => x.id) },
        ...effectiveWindow,
      },
      orderBy: [{ publishedAt: "desc" }, { version: "desc" }],
    });
    if (projectVersion) return projectVersion.id;
  }

  // 2) 再取用户配置的全局规则（而不是直接回退内置10分规则）
  const globalRuleSets = await prisma.ruleSet.findMany({
    where: { scope: "GLOBAL", status: "ACTIVE" },
    select: { id: true },
  });
  if (globalRuleSets.length) {
    const globalVersion = await prisma.ruleSetVersion.findFirst({
      where: {
        ruleSetId: { in: globalRuleSets.map((x) => x.id) },
        ...effectiveWindow,
      },
      orderBy: [{ publishedAt: "desc" }, { version: "desc" }],
    });
    if (globalVersion) return globalVersion.id;
  }

  // 3) 最后兜底内置全局默认规则
  const builtinGlobal = await ensureGlobalDefaultRuleSet();
  const builtinGlobalVersion = await ensureGlobalDefaultRuleSetVersion(builtinGlobal.id);
  return builtinGlobalVersion.id;
}

async function buildTaskFact(task: any): Promise<TaskFact> {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const acceptedAt = task.acceptedAt ? new Date(task.acceptedAt) : new Date(task.updatedAt);
  const delayHours =
    dueDate && acceptedAt ? Math.max(0, (acceptedAt.getTime() - dueDate.getTime()) / 3600000) : 0;
  const aheadDays =
    dueDate && acceptedAt ? Math.floor((dueDate.getTime() - acceptedAt.getTime()) / (24 * 3600000)) : 0;

  const bugCount = (task.testCases ?? []).reduce((sum: number, tc: any) => sum + (tc.bugCount ?? 0), 0);
  const coAssigneeIds = (task.coAssignees ?? []).map((r: any) => r.userId);

  const rejectCount = await prisma.taskTimeline.count({
    where: { taskId: task.id, eventType: "QA_REJECTED" },
  });

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
      rejectCount,
      testCaseBugCount: bugCount,
      delayHours,
      aheadDays,
      baseScore:
        (task as any).baseScore ??
        (task as any).suggestedBaseScore ??
        task.estimatedHours ??
        0,
      complexityTier: String((task as any).complexityTier ?? "STANDARD"),
      complexity: coefficientFromTaskComplexityTier(
        (task as any).complexityTier as string | undefined,
        (task as any).complexity,
      ),
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

  const inputSnapshot = await buildTaskFact(task);
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

async function getUserTotalPointsSnapshot(userId: number): Promise<number> {
  const account = await prisma.pointsAccount.findUnique({
    where: { ownerType_ownerId: { ownerType: "USER", ownerId: userId } },
    select: { id: true },
  });
  if (!account) return 0;
  const agg = await prisma.pointsLedgerEntry.aggregate({
    where: { accountId: account.id },
    _sum: { amount: true },
  });
  return Number(agg._sum.amount ?? 0);
}

/** 结算入账完成后，向受影响用户推送 WS（驱动前端粒子结算动效 + 顶栏积分刷新） */
async function notifyPointsSettlementWebSocket(settlementId: bigint, taskId: number) {
  try {
    const entries = await prisma.pointsLedgerEntry.findMany({
      where: { bizId: settlementId.toString() },
      include: { account: { select: { ownerType: true, ownerId: true } } },
    });

    const deltaByUser = new Map<number, number>();
    for (const e of entries) {
      if (e.account.ownerType !== "USER") continue;
      const uid = e.account.ownerId;
      deltaByUser.set(uid, (deltaByUser.get(uid) ?? 0) + e.amount);
    }

    if (deltaByUser.size === 0) return;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true },
    });

    for (const [userId, earnedPoints] of deltaByUser) {
      if (!earnedPoints) continue;
      const totalPoints = await getUserTotalPointsSnapshot(userId);
      pushJsonToUser(userId, {
        event: "points_settlement",
        data: {
          settlementId: settlementId.toString(),
          taskId,
          taskTitle: task?.title ?? null,
          earnedPoints,
          totalPoints,
        },
      });
    }
  } catch (e: any) {
    logger.error(`[perf] notifyPointsSettlementWebSocket failed: ${e?.message ?? e}`);
  }
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
    await notifyPointsSettlementWebSocket(settlementId, s.taskId);
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

