import { z } from 'zod';

export const AddManagersDto = z.object({
  userIds: z.array(z.number()).min(1, '至少选择一个用户'),
});
export type AddManagersDtoType = z.infer<typeof AddManagersDto>;

export const AddMembersDto = z.object({
  userIds: z.array(z.number()).min(1, '至少选择一个用户'),
});
export type AddMembersDtoType = z.infer<typeof AddMembersDto>;
