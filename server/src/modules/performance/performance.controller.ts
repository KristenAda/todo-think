import { Context } from "koa";
import { Prisma } from "@prisma/client";
import prisma from "@/core/prisma";
import { Result } from "@/core/result";
import {
  CreateTaskAdjustmentDto,
  RuleVariableUpsertDto,
  RuleSetCreateDto,
  RuleSetUpdateDto,
  RuleSetPublishDto,
  RuleSetDraftDto,
  RuleSetSimulateDto,
} from "./performance.dto";
import { simulateRuleSetDefinition } from "./settlement.service";
import { createHash } from "crypto";
import { createAdjustmentSettlementForTask } from "./settlement.service";

function currentUserId(ctx: Context): number {
  return Number(ctx.state?.user?.id ?? 0);
}

function toNumberOrNull(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === "object" && typeof value.toNumber === "function") {
    const n = Number(value.toNumber());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

class PerformanceRuleController {
  async ruleSetList(ctx: Context) {
    const projectId = ctx.query.projectId ? Number(ctx.query.projectId) : undefined;
    const list = await prisma.ruleSet.findMany({
      where: {
        status: "ACTIVE",
        ...(projectId ? { OR: [{ scope: "GLOBAL" }, { scope: "PROJECT", projectId }] } : {}),
      } as any,
      orderBy: [{ scope: "asc" }, { updatedAt: "desc" }],
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 3,
          select: { id: true, version: true, publishedAt: true, checksum: true },
        },
      },
    });
    ctx.body = Result.success(list);
  }

  async ruleSetCreate(ctx: Context) {
    const parsed = RuleSetCreateDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const { code, name, scope, projectId } = parsed.data;
    if (scope === "PROJECT" && !projectId) {
      ctx.body = Result.error("projectId 必填（PROJECT 规则集）");
      return;
    }

    const created = await prisma.ruleSet.create({
      data: {
        code,
        name,
        scope,
        projectId: scope === "PROJECT" ? projectId : null,
        status: "ACTIVE",
      },
    });
    ctx.body = Result.success(created, "创建成功");
  }

  async ruleSetUpdate(ctx: Context) {
    const id = Number(ctx.params.id);
    if (!id) {
      ctx.body = Result.error("规则集ID错误");
      return;
    }
    const parsed = RuleSetUpdateDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const data: any = { ...parsed.data };
    if (data.scope === "GLOBAL") data.projectId = null;
    const updated = await prisma.ruleSet.update({
      where: { id },
      data,
    });
    ctx.body = Result.success(updated, "更新成功");
  }

  async ruleSetDelete(ctx: Context) {
    const id = Number(ctx.params.id);
    if (!id) {
      ctx.body = Result.error("规则集ID错误");
      return;
    }
    // 软删除，保留历史版本审计
    const updated = await prisma.ruleSet.update({
      where: { id },
      data: { status: "DISABLED" },
    });
    ctx.body = Result.success(updated, "删除成功");
  }

  async ruleSetVersionList(ctx: Context) {
    const ruleSetId = Number(ctx.params.id);
    const list = await prisma.ruleSetVersion.findMany({
      where: { ruleSetId },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        publishedAt: true,
        publishedBy: true,
        effectiveFrom: true,
        effectiveTo: true,
        checksum: true,
      },
    });
    ctx.body = Result.success(list);
  }

  async ruleSetVersionDetail(ctx: Context) {
    const versionId = Number(ctx.params.versionId);
    if (!versionId) {
      ctx.body = Result.error("versionId 参数错误");
      return;
    }
    const detail = await prisma.ruleSetVersion.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        ruleSetId: true,
        version: true,
        publishedAt: true,
        publishedBy: true,
        effectiveFrom: true,
        effectiveTo: true,
        checksum: true,
        definition: true,
      },
    });
    if (!detail) {
      ctx.body = Result.error("规则版本不存在", 404);
      return;
    }
    ctx.body = Result.success(detail);
  }

  async ruleSetPublish(ctx: Context) {
    const ruleSetId = Number(ctx.params.id);
    const parsed = RuleSetPublishDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }

    const userId = currentUserId(ctx);
    const def = parsed.data.definition;
    const defText = JSON.stringify(def);
    const checksum = sha256(defText);

    const latest = await prisma.ruleSetVersion.findFirst({
      where: { ruleSetId },
      orderBy: { version: "desc" },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    const created = await prisma.ruleSetVersion.create({
      data: {
        ruleSetId,
        version: nextVersion,
        publishedBy: userId,
        checksum,
        definition: def,
        effectiveFrom: parsed.data.effectiveFrom ? new Date(parsed.data.effectiveFrom) : null,
        effectiveTo: parsed.data.effectiveTo ? new Date(parsed.data.effectiveTo) : null,
      },
    });
    await prisma.ruleSet.update({
      where: { id: ruleSetId },
      data: {
        draftDefinition: Prisma.JsonNull,
        draftVariables: Prisma.JsonNull,
        draftUpdatedAt: null,
      },
    });
    ctx.body = Result.success(created, "发布成功");
  }

  async ruleSetDraftSave(ctx: Context) {
    const ruleSetId = Number(ctx.params.id);
    if (!ruleSetId) {
      ctx.body = Result.error("规则集ID错误");
      return;
    }
    const parsed = RuleSetDraftDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const data: Record<string, unknown> = { draftUpdatedAt: new Date() };
    if (parsed.data.definition !== undefined) data.draftDefinition = parsed.data.definition;
    if (parsed.data.variables !== undefined) data.draftVariables = parsed.data.variables;
    const updated = await prisma.ruleSet.update({
      where: { id: ruleSetId },
      data: data as any,
    });
    ctx.body = Result.success(updated, "草稿已保存");
  }

  async ruleSetSimulate(ctx: Context) {
    const parsed = RuleSetSimulateDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }

    let def: any = parsed.data.definition;
    if (!def && parsed.data.ruleSetVersionId) {
      const v = await prisma.ruleSetVersion.findUnique({ where: { id: parsed.data.ruleSetVersionId } });
      if (!v) {
        ctx.body = Result.error("规则版本不存在", 404);
        return;
      }
      def = v.definition;
    }
    if (!def) {
      ctx.body = Result.error("definition 或 ruleSetVersionId 必须提供一个");
      return;
    }

    const output = simulateRuleSetDefinition(def, parsed.data.inputSnapshot);
    ctx.body = Result.success(output);
  }

  async createTaskAdjustment(ctx: Context) {
    const parsed = CreateTaskAdjustmentDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }

    const { taskId, ruleSetVersionId, occurredAt } = parsed.data;
    const settlement = await createAdjustmentSettlementForTask(
      taskId,
      ruleSetVersionId,
      occurredAt ? new Date(occurredAt) : new Date(),
    );
    ctx.body = Result.success(settlement, "已创建补差结算任务");
  }

  async variableList(ctx: Context) {
    const projectId = ctx.query.projectId ? Number(ctx.query.projectId) : undefined;
    const where: any = {
      enabled: true,
      ...(projectId
        ? {
            OR: [{ scope: "GLOBAL" }, { scope: "PROJECT", projectId }],
          }
        : {}),
    };
    let list = await prisma.ruleVariable.findMany({
      where,
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    });
    if (!list.length) {
      const defaults = [
        { code: "baseScore", label: "基础积分", valueType: "Number", sourcePath: "task.baseScore", defaultValue: 20, sort: 1 },
        { code: "complexity", label: "难度系数", valueType: "Float", sourcePath: "task.complexity", defaultValue: 1, sort: 2 },
        { code: "rejectCount", label: "验收驳回次数", valueType: "Integer", sourcePath: "task.rejectCount", defaultValue: 0, sort: 3 },
        { code: "aheadDays", label: "提前完成天数", valueType: "Integer", sourcePath: "task.aheadDays", defaultValue: 0, sort: 4 },
      ] as const;
      await prisma.$transaction(
        defaults.map((d) =>
          prisma.ruleVariable.upsert({
            where: { code: d.code },
            create: {
              ...d,
              description: null,
              scope: "GLOBAL",
              projectId: null,
              enabled: true,
            },
            update: {},
          }),
        ),
      );
      list = await prisma.ruleVariable.findMany({
        where,
        orderBy: [{ sort: "asc" }, { id: "asc" }],
      });
    }
    const normalized = list.map((item: any) => ({
      ...item,
      defaultValue: toNumberOrNull(item.defaultValue),
    }));
    ctx.body = Result.success(normalized);
  }

  async variableUpsert(ctx: Context) {
    const parsed = RuleVariableUpsertDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const payload = parsed.data.variables;
    if (!payload.length) {
      ctx.body = Result.error("variables 不能为空");
      return;
    }

    const results = await prisma.$transaction(
      payload.map((v) =>
        prisma.ruleVariable.upsert({
          where: v.id ? { id: v.id } : { code: v.code },
          create: {
            code: v.code,
            label: v.label,
            valueType: v.valueType,
            description: v.description ?? null,
            sourcePath: v.sourcePath,
            defaultValue: v.defaultValue ?? null,
            scope: v.scope,
            projectId: v.projectId ?? null,
            enabled: v.enabled,
            sort: v.sort,
          },
          update: {
            code: v.code,
            label: v.label,
            valueType: v.valueType,
            description: v.description ?? null,
            sourcePath: v.sourcePath,
            defaultValue: v.defaultValue ?? null,
            scope: v.scope,
            projectId: v.projectId ?? null,
            enabled: v.enabled,
            sort: v.sort,
          },
        }),
      ),
    );
    const normalized = results.map((item: any) => ({
      ...item,
      defaultValue: toNumberOrNull(item.defaultValue),
    }));
    ctx.body = Result.success(normalized, "变量配置保存成功");
  }
}

export const performanceRuleController = new PerformanceRuleController();

