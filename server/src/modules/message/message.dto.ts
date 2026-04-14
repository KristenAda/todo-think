import { z } from "zod";

/**
 * 消息分页查询参数
 * - 使用 zod 做入参校验，确保接口稳定
 */
export const MessagePageDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  isRead: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v == null ? undefined : v === "true")),
  messageType: z.string().optional(),
});
export type MessagePageDtoType = z.infer<typeof MessagePageDto>;

/**
 * 发送实时消息入参
 * - senderId 不从前端传，后端从 token 推导，避免伪造
 */
export const SendMessageDto = z.object({
  receiverId: z.coerce.number().int().positive(),
  title: z.string().max(200).optional(),
  content: z.string().min(1),
  messageType: z.string().optional(),
  extra: z.any().optional(),
});
export type SendMessageDtoType = z.infer<typeof SendMessageDto>;

