/**
 * 任务领域（与后端 Prisma TaskWorkDomain / Api.Task.TaskWorkDomain 一致）
 */
export enum TaskWorkDomainEnum {
  SOFTWARE_DEVELOPMENT = 'SOFTWARE_DEVELOPMENT',
  PRODUCT_DESIGN = 'PRODUCT_DESIGN',
  OPERATIONS_SUPPORT = 'OPERATIONS_SUPPORT',
  DATA_ANALYTICS = 'DATA_ANALYTICS',
  GENERAL = 'GENERAL'
}

/** 选项与展示（绩效规则公式里用枚举值字符串） */
export const TASK_WORK_DOMAIN_OPTIONS: readonly { label: string; value: TaskWorkDomainEnum }[] = [
  { label: '软件开发', value: TaskWorkDomainEnum.SOFTWARE_DEVELOPMENT },
  { label: '产品与设计', value: TaskWorkDomainEnum.PRODUCT_DESIGN },
  { label: '运维与实施', value: TaskWorkDomainEnum.OPERATIONS_SUPPORT },
  { label: '数据分析', value: TaskWorkDomainEnum.DATA_ANALYTICS },
  { label: '综合与其他', value: TaskWorkDomainEnum.GENERAL }
] as const;
