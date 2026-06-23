package com.todothink.modules.performance.job;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.todothink.modules.performance.entity.PerfSettlement;
import com.todothink.modules.performance.mapper.PerfSettlementMapper;
import com.todothink.modules.performance.service.SettlementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 绩效结算轮询任务（对齐 Node settlement.job.ts）。
 */
@Component
public class SettlementJob {

    private static final Logger log = LoggerFactory.getLogger(SettlementJob.class);

    private final PerfSettlementMapper perfSettlementMapper;
    private final SettlementService settlementService;

    public SettlementJob(PerfSettlementMapper perfSettlementMapper, SettlementService settlementService) {
        this.perfSettlementMapper = perfSettlementMapper;
        this.settlementService = settlementService;
    }

    @Scheduled(fixedDelay = 2000L, initialDelay = 3000L)
    public void run() {
        try {
            List<PerfSettlement> pending = perfSettlementMapper.selectList(new LambdaQueryWrapper<PerfSettlement>()
                    .eq(PerfSettlement::getStatus, "PENDING")
                    .orderByAsc(PerfSettlement::getCreateTime)
                    .last("LIMIT 5"));
            for (PerfSettlement settlement : pending) {
                settlementService.settleOnePending(settlement.getId());
            }
        } catch (Exception e) {
            log.error("[perf] settlement job tick failed: {}", e.getMessage(), e);
        }
    }
}
