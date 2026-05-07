/** 段位字面量（与资源 `rank-[tier].webp` 一致） */
export type RankTier = 'C' | 'B' | 'A' | 'S' | 'S+' | 'SS' | 'SSS';

/** 绩效 compositeTier 全量（含 `S-`） */
export type RankIconTier = RankTier | 'S-';
