const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

async function main() {
  const prisma = new PrismaClient();

  const def = {
    params: {},
    variables: [{ code: "delayHours", expr: { path: "task.delayHours" } }],
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

  const checksum = crypto
    .createHash("sha256")
    .update(JSON.stringify(def))
    .digest("hex");

  let rs = await prisma.ruleSet.findUnique({ where: { code: "global-default" } });
  if (!rs) {
    rs = await prisma.ruleSet.create({
      data: { code: "global-default", name: "全局默认规则", scope: "GLOBAL" },
    });
  }

  let rsv = await prisma.ruleSetVersion.findFirst({
    where: { ruleSetId: rs.id },
    orderBy: { version: "desc" },
  });
  if (!rsv) {
    rsv = await prisma.ruleSetVersion.create({
      data: { ruleSetId: rs.id, version: 1, checksum, definition: def },
    });
  }

  const now = new Date();
  const settlement = await prisma.perfSettlement.create({
    data: {
      settlementKey: `smoke:${now.toISOString()}`,
      settlementType: "first",
      projectId: 1,
      taskId: 1,
      occurredAt: now,
      status: "PENDING",
      ruleSetVersionId: rsv.id,
      inputSnapshot: {
        task: {
          id: 1,
          projectId: 1,
          workDomain: "GENERAL",
          priority: "P2",
          dueDate: null,
          acceptedAt: now.toISOString(),
          estimatedHours: null,
          actualHours: 1,
          mainAssigneeId: 1,
          testerId: 1,
          coAssigneeIds: [],
          testCaseBugCount: 0,
          delayHours: 0,
        },
      },
    },
  });

  console.log("[smoke] created settlement:", settlement.id.toString());
  await new Promise((r) => setTimeout(r, 5000));

  const entries = await prisma.pointsLedgerEntry.findMany({
    where: { bizId: settlement.id.toString() },
  });
  console.log(
    "[smoke] ledger entries:",
    entries.map((e) => ({
      id: e.id.toString(),
      pointsType: e.pointsType,
      amount: e.amount,
      occurredAt: e.occurredAt,
    })),
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[smoke] failed:", e);
  process.exit(1);
});

