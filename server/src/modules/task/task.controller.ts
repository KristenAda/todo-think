import { Context } from "koa";
import { Result } from "@/core/result";
import {
  projectService,
  taskService,
  performanceService,
} from "./task.service";
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectPageDto,
  CreateTaskDto,
  UpdateTaskDto,
  TaskPageDto,
  ProjectTaskRuleDto,
  SetActiveScoringRuleVersionDto,
  CreateWorkLogDto,
  CreateTaskCommentDto,
  SubmitTestDto,
  QaAuditDto,
  PerformancePageDto,
  PointsLedgerPageDto,
  PointsLedgerMinePageDto,
} from "./task.dto";

/** 从 JWT 中取当前用户 ID */
function currentUserId(ctx: Context): number {
  return (ctx.state as any).user?.id as number;
}

// ======================== Project Controller ========================

class ProjectController {
  async page(ctx: Context) {
    const parsed = ProjectPageDto.safeParse(ctx.query);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const uid = currentUserId(ctx);
    const { list, total } = await projectService.page(parsed.data, uid);
    ctx.body = Result.page(list, total, parsed.data.page, parsed.data.pageSize);
  }

  async list(ctx: Context) {
    ctx.body = Result.success(await projectService.list(currentUserId(ctx)));
  }

  async orgMembers(ctx: Context) {
    const uid = (ctx.state as any).user?.id as number;
    if (!uid) {
      ctx.status = 401;
      ctx.body = Result.error("未登录", 401);
      return;
    }
    ctx.body = Result.success(await projectService.orgMembers(uid));
  }

  async info(ctx: Context) {
    const id = Number(ctx.params.id);
    const data = await projectService.info(id, currentUserId(ctx));
    if (!data) {
      ctx.body = Result.error("项目不存在", 404);
      return;
    }
    ctx.body = Result.success(data);
  }

  async create(ctx: Context) {
    const parsed = CreateProjectDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const userId = currentUserId(ctx);
    try {
      ctx.body = Result.success(
        await projectService.create(parsed.data, userId),
        "创建成功"
      );
    } catch (e: any) {
      ctx.status = e.status ?? 400;
      ctx.body = Result.error(e.message ?? "创建失败", e.status ?? 400);
    }
  }

  async update(ctx: Context) {
    const id = Number(ctx.params.id);
    const parsed = UpdateProjectDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues[0]?.message ?? "参数错误");
      return;
    }
    try {
      ctx.body = Result.success(
        await projectService.update(id, parsed.data, currentUserId(ctx)),
        "更新成功"
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "更新失败", e.status ?? 500);
    }
  }

  // ======================== Project Task Rules ========================
  async taskRulesInfo(ctx: Context) {
    const id = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    const data = await projectService.taskRulesInfo(id, userId);
    ctx.body = Result.success(data);
  }

  async taskRulesUpdate(ctx: Context) {
    const id = Number(ctx.params.id);
    const parsed = ProjectTaskRuleDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const userId = currentUserId(ctx);
    await projectService.taskRulesUpdate(id, userId, parsed.data);
    ctx.body = Result.success(null, "规则更新成功");
  }

  /** 可选的验收计分规则版本（全局 + 当前项目下规则集已发布版本） */
  async scoringRuleVersions(ctx: Context) {
    const id = Number(ctx.params.id);
    try {
      const list = await projectService.scoringRuleVersionOptions(id, currentUserId(ctx));
      ctx.body = Result.success(list);
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "获取失败", e.status ?? 500);
    }
  }

  /** 指定本项目验收结算使用的规则版本（为空则按系统自动择优） */
  async setActiveScoringRuleVersion(ctx: Context) {
    const id = Number(ctx.params.id);
    const parsed = SetActiveScoringRuleVersionDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    try {
      const updated = await projectService.setActiveScoringRuleVersion(
        id,
        parsed.data.activeRuleSetVersionId,
        currentUserId(ctx),
      );
      ctx.body = Result.success(updated, "已更新生效规则版本");
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "更新失败", e.status ?? 500);
    }
  }

  async delete(ctx: Context) {
    const id = Number(ctx.params.id);
    try {
      await projectService.delete(id, currentUserId(ctx));
      ctx.body = Result.success(null, "删除成功");
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "删除失败", e.status ?? 500);
    }
  }
}

export const projectController = new ProjectController();

// ======================== Task Controller ========================

class TaskController {
  async page(ctx: Context) {
    const parsed = TaskPageDto.safeParse(ctx.query);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues[0]?.message ?? "参数错误");
      return;
    }
    const { list, total } = await taskService.page(
      parsed.data,
      currentUserId(ctx),
    );
    ctx.body = Result.page(list, total, parsed.data.page, parsed.data.pageSize);
  }

  async info(ctx: Context) {
    const id = Number(ctx.params.id);
    const data = await taskService.info(id, currentUserId(ctx));
    if (!data) {
      ctx.body = Result.error("任务不存在", 404);
      return;
    }
    ctx.body = Result.success(data);
  }

  async create(ctx: Context) {
    const parsed = CreateTaskDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const userId = currentUserId(ctx);
    try {
      ctx.body = Result.success(
        await taskService.create(parsed.data, userId),
        "创建成功",
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "创建失败", e.status ?? 500);
    }
  }

  async update(ctx: Context) {
    const id = Number(ctx.params.id);
    const parsed = UpdateTaskDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues[0]?.message ?? "参数错误");
      return;
    }
    try {
      ctx.body = Result.success(
        await taskService.update(id, parsed.data, currentUserId(ctx)),
        "更新成功",
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "更新失败", e.status ?? 500);
    }
  }

  async delete(ctx: Context) {
    const id = Number(ctx.params.id);
    try {
      await taskService.delete(id, currentUserId(ctx));
      ctx.body = Result.success(null, "删除成功");
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "删除失败", e.status ?? 500);
    }
  }

  async startWork(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    try {
      ctx.body = Result.success(
        await taskService.startWork(taskId, userId),
        "已开始开发"
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "操作失败", e.status ?? 500);
    }
  }

  async addWorkLog(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    const parsed = CreateWorkLogDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues[0]?.message ?? "参数错误");
      return;
    }
    try {
      ctx.body = Result.success(
        await taskService.addWorkLog(taskId, userId, parsed.data),
        "工时登记成功"
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "操作失败", e.status ?? 500);
    }
  }

  async addComment(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    const parsed = CreateTaskCommentDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues[0]?.message ?? "参数错误");
      return;
    }
    try {
      ctx.body = Result.success(
        await taskService.addComment(taskId, userId, parsed.data),
        "评论发布成功"
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "操作失败", e.status ?? 500);
    }
  }

  async submitTest(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    const parsed = SubmitTestDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues[0]?.message ?? "参数错误");
      return;
    }
    try {
      ctx.body = Result.success(
        await taskService.submitTest(taskId, userId, parsed.data),
        "已提交验收"
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "操作失败", e.status ?? 500);
    }
  }

  async qaAudit(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    const parsed = QaAuditDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues[0]?.message ?? "参数错误");
      return;
    }
    try {
      ctx.body = Result.success(
        await taskService.qaAudit(taskId, userId, parsed.data),
        "验收完成"
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "操作失败", e.status ?? 500);
    }
  }

  // ==================== 以下为新增的状态流转(逆向)接口 ====================

  async pauseTask(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    try {
      ctx.body = Result.success(
        await taskService.pauseTask(taskId, userId),
        "任务已暂停"
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "操作失败", e.status ?? 500);
    }
  }

  async resumeTask(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    try {
      ctx.body = Result.success(
        await taskService.resumeTask(taskId, userId),
        "任务已恢复开发"
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "操作失败", e.status ?? 500);
    }
  }

  async reopenTask(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const userId = currentUserId(ctx);
    try {
      ctx.body = Result.success(
        await taskService.reopenTask(taskId, userId),
        "任务已重新打开",
      );
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "操作失败", e.status ?? 500);
    }
  }

}

export const taskController = new TaskController();

// ======================== Performance Controller ========================

class PerformanceController {
  async myTotalPoints(ctx: Context) {
    const data = await performanceService.myTotalPoints(currentUserId(ctx));
    ctx.body = Result.success(data);
  }

  async stats(ctx: Context) {
    const parsed = PerformancePageDto.safeParse(ctx.query);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const { list, total, summary } = await performanceService.stats(
      parsed.data,
      currentUserId(ctx),
    );
    const { page, pageSize } = parsed.data;
    ctx.body = {
      code: 200,
      message: "success",
      data: {
        list,
        total,
        page,
        pageSize,
        totalPage: Math.ceil(total / pageSize),
        summary,
      },
    };
  }

  async reconcileTask(ctx: Context) {
    const taskId = Number(ctx.params.id);
    if (!taskId) {
      ctx.body = Result.error("taskId 参数错误");
      return;
    }
    try {
      const data = await performanceService.reconcileTask(taskId, currentUserId(ctx));
      ctx.body = Result.success(data);
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "操作失败", e.status ?? 500);
    }
  }

  async pointsLedgerPage(ctx: Context) {
    const parsed = PointsLedgerPageDto.safeParse(ctx.query);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const { list, total, summary } = await performanceService.ledgerPage(
      parsed.data,
      currentUserId(ctx),
    );
    const { page, pageSize } = parsed.data;
    ctx.body = {
      code: 200,
      message: "success",
      data: {
        list,
        total,
        page,
        pageSize,
        totalPage: Math.ceil(total / pageSize),
        summary,
      },
    };
  }

  async pointsLedgerPageMine(ctx: Context) {
    const parsed = PointsLedgerMinePageDto.safeParse(ctx.query);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const { list, total, summary } = await performanceService.ledgerPageMine(
      parsed.data,
      currentUserId(ctx),
    );
    const { page, pageSize } = parsed.data;
    ctx.body = {
      code: 200,
      message: "success",
      data: {
        list,
        total,
        page,
        pageSize,
        totalPage: Math.ceil(total / pageSize),
        summary,
      },
    };
  }

  async pointsLedgerDetail(ctx: Context) {
    const entryId = String(ctx.params.entryId ?? "").trim();
    if (!entryId) {
      ctx.body = Result.error("记录 ID 不能为空");
      return;
    }
    try {
      const data = await performanceService.ledgerDetail(entryId, currentUserId(ctx));
      ctx.body = Result.success(data);
    } catch (e: any) {
      ctx.status = e.status ?? 500;
      ctx.body = Result.error(e.message ?? "操作失败", e.status ?? 500);
    }
  }
}

export const performanceController = new PerformanceController();
