import prisma from "../../core/prisma";
import logger from "../../core/logger";
import { settleOnePending } from "./settlement.service";

let started = false;

export function startPerformanceSettlementJob() {
  if (started) return;
  started = true;

  const intervalMs = 2000;
  logger.info(`[perf] settlement job started, interval=${intervalMs}ms`);

  // 简单轮询：适合 MVP；后续可替换成 MQ/队列
  setInterval(async () => {
    try {
      const pending = await prisma.perfSettlement.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 5,
      });

      for (const s of pending) {
        await settleOnePending(s.id);
      }
    } catch (e: any) {
      logger.error(`[perf] settlement job tick failed: ${e?.message ?? e}`);
    }
  }, intervalMs);
}

