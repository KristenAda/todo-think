import { Context } from "koa";
import { Result } from "@/core/result";
import { MessagePageDto, SendMessageDto } from "./message.dto";
import { messageService } from "./message.service";

/** 从 JWT 中取当前用户 ID */
function currentUserId(ctx: Context): number {
  return (ctx.state as any).user?.id as number;
}

class MessageController {
  async page(ctx: Context) {
    const parsed = MessagePageDto.safeParse(ctx.query);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const uid = currentUserId(ctx);
    const { list, total } = await messageService.page(parsed.data, uid);
    ctx.body = Result.page(list, total, parsed.data.page, parsed.data.pageSize);
  }

  async unreadCount(ctx: Context) {
    const uid = currentUserId(ctx);
    ctx.body = Result.success(await messageService.unreadCount(uid));
  }

  async markRead(ctx: Context) {
    const id = Number(ctx.params.id);
    if (!id || Number.isNaN(id)) {
      ctx.body = Result.error("参数错误");
      return;
    }
    const ok = await messageService.markRead(id, currentUserId(ctx));
    ctx.body = Result.success(ok, ok ? "已读" : "消息不存在或已读");
  }

  async markAllRead(ctx: Context) {
    const count = await messageService.markAllRead(currentUserId(ctx));
    ctx.body = Result.success(count, "已全部标记已读");
  }

  /**
   * 可选：通过 REST 发送一条站内消息（便于联调/后台运营）
   * - senderId 从 token 推导，避免伪造
   */
  async send(ctx: Context) {
    const parsed = SendMessageDto.safeParse(ctx.request.body);
    if (!parsed.success) {
      ctx.body = Result.error(parsed.error.issues?.[0]?.message ?? "参数错误");
      return;
    }
    const uid = currentUserId(ctx);
    const created = await messageService.sendRealTimeMessage(parsed.data, uid);
    ctx.body = Result.success(created, "发送成功");
  }
}

export const messageController = new MessageController();

