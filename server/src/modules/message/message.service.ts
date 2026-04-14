import prisma from "@/core/prisma";
import { pushJsonToUser } from "@/core/wsHub";
import type { MessagePageDtoType, SendMessageDtoType } from "./message.dto";

/**
 * 消息服务：
 * - sendRealTimeMessage：先写库 -> 检查在线 -> 在线则 WS 推送
 * - list / unreadCount / markRead：提供 REST API 能力
 */
class MessageService {
  async sendRealTimeMessage(dto: SendMessageDtoType, senderId: number | null) {
    // 需要给前端 WS 推送带上 sender 信息，避免 UI 只能展示空头像/空发送者
    const created = await prisma.message.create({
      data: {
        title: dto.title ?? null,
        content: dto.content,
        receiverId: dto.receiverId,
        senderId: senderId ?? null,
        // messageType 为 enum；这里按字符串写入，非法值由 Prisma 在运行时拦截
        messageType: (dto.messageType as any) ?? "SYSTEM",
        extra: dto.extra ?? undefined,
      } as any,
      include: {
        sender: {
          select: { id: true, userName: true, nickName: true, avatar: true },
        },
      },
    });

    // 在线则推送（不影响写库结果）
    pushJsonToUser(dto.receiverId, {
      event: "message",
      data: created,
    });

    return created;
  }

  async page(dto: MessagePageDtoType, receiverId: number) {
    const { page, pageSize, isRead, messageType } = dto;
    const where: any = {
      receiverId,
      deletedAt: null,
    };
    if (isRead !== undefined) where.isRead = isRead;
    if (messageType) where.messageType = messageType;

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createTime: "desc" },
        include: {
          sender: {
            select: { id: true, userName: true, nickName: true, avatar: true },
          },
        },
      }),
      prisma.message.count({ where }),
    ]);

    return { list, total };
  }

  async unreadCount(receiverId: number) {
    return prisma.message.count({
      where: { receiverId, isRead: false, deletedAt: null },
    });
  }

  async markRead(id: number, receiverId: number) {
    const now = new Date();
    const result = await prisma.message.updateMany({
      where: { id, receiverId, deletedAt: null, isRead: false },
      data: { isRead: true, readTime: now },
    });
    return result.count > 0;
  }

  async markAllRead(receiverId: number) {
    const now = new Date();
    const result = await prisma.message.updateMany({
      where: { receiverId, deletedAt: null, isRead: false },
      data: { isRead: true, readTime: now },
    });
    return result.count;
  }
}

export const messageService = new MessageService();

