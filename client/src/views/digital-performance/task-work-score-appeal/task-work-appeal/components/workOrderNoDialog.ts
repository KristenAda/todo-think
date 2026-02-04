// 环节进度详情类型
export interface StepDetail {
  orderCreateTime?: string;
  orderAssignPerson?: string;
  orderAssignTime?: string;
  orderHandlePerson?: string;
  orderHandleTime?: string;
  orderEvaluatePerson?: string;
  orderEvaluateTime?: string;
  orderArchivePerson?: string;
  orderArchiveTime?: string;
}

// 工单信息核心类型
export interface WorkOrderInfo {
  orderNo?: string;
  orderSource?: string;
  orderType?: string;
  linkName?: string;
  orderStatus?: string;
  difficulty?: string;
  priority?: string;
  workType?: string;
  workContent?: string;
  workAddress?: string;
  planStartTime?: string;
  planEndTime?: string;
  warningStatus?: string;
  warningTime?: string;
  overdueStatus?: string;
  overdueTime?: string;
}

// 工单标签类型
export interface WorkOrderTag {
  key: string;
  label: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
}

// 描述项配置类型 用于数据驱动el-descriptions
export interface DescItemConfig {
  label: string;
  prop: keyof WorkOrderInfo;
  span?: number;
}

// 对话框标题
export const dialogTitle = '工单详情';

// 环节进度详情默认值
export const defaultStepDetail = {
  orderCreateTime: '2026-02-01 09:00:00',
  orderAssignPerson: '张三',
  orderAssignTime: '2026-02-01 09:30:00',
};

// 工单核心信息默认值
export const defaultWorkOrderInfo = {
  orderNo: 'WO20260203001',
  orderSource: '系统自动生成',
  orderType: '日常维护',
  linkName: '工单派单',
  orderStatus: '处理中',
  difficulty: '中等',
  priority: '普通',
  workType: '设备检修',
  workContent: '对厂区3号机房的服务器进行常规巡检和故障排查',
  workAddress: 'XX市XX区XX路XX号厂区3号机房',
  planStartTime: '2026-02-03 10:00:00',
  planEndTime: '2026-02-03 16:00:00',
};

// 工单信息 descriptions数据配置
export const workOrderDescConfig: DescItemConfig[] = [
  { label: '工单编号', prop: 'orderNo' },
  { label: '工单来源', prop: 'orderSource' },
  { label: '工单类型', prop: 'orderType' },
  { label: '环节名称', prop: 'linkName' },
  { label: '工单状态', prop: 'orderStatus' },
  { label: '难度系数', prop: 'difficulty' },
  { label: '优先级', prop: 'priority' },
  { label: '作业类别', prop: 'workType' },
  { label: '作业内容', prop: 'workContent', span: 4 },
  { label: '作业地点', prop: 'workAddress', span: 2 },
  { label: '计划开始时间', prop: 'planStartTime' },
  { label: '计划结束时间', prop: 'planEndTime' },
  { label: '预警状态', prop: 'warningStatus' },
  { label: '预警时间', prop: 'warningTime' },
  { label: '超期状态', prop: 'overdueStatus' },
  { label: '超期时间', prop: 'overdueTime' },
];

// 工单标签
export const workOrderTags: WorkOrderTag[] = [
  { key: 'highRiskCustomer', label: '高危重要客户', type: 'warning' },
  { key: 'group', label: '组团', type: 'info' },
];

// 工单关联五要素tabs
export const workOrderAssTabs = [
  { label: '车辆信息', name: '车辆信息' },
  { label: '工器具', name: '工器具' },
  { label: '备品备件', name: '备品备件' },
  { label: '计量资产', name: '计量资产' },
  { label: '票卡', name: '票卡' },
];

// 其他信息tabs
export const otherTabs = [
  { label: '业务信息', name: '业务信息' },
  { label: '派工信息', name: '派工信息' },
  { label: '现场处理信息', name: '现场处理信息' },
  { label: '工单风险', name: '工单风险' },
  { label: '处理记录', name: '处理记录' },
];

// 工单关联五要素 descriptions数据配置
export const workOrderAssDescConfig: DescItemConfig[] = [
  { label: '申请类型', prop: 'orderNo' },
  { label: '车辆来源', prop: 'orderSource' },
  { label: '申请人', prop: 'orderType' },
  { label: '申请人电话', prop: 'linkName' },
  { label: '用车人', prop: 'orderStatus' },
  { label: '用车人电话', prop: 'difficulty' },
  { label: '用车部门', prop: 'priority' },
  { label: '用车人职务', prop: 'workType' },
  { label: '用车性质', prop: 'workContent' },
  { label: '用车事由', prop: 'workAddress' },
  { label: '用车人数', prop: 'planStartTime' },
  { label: '预计用车时间', prop: 'planEndTime' },
  { label: '预计返回时间', prop: 'warningStatus' },
  { label: '用车范围', prop: 'warningTime' },
  { label: '是否跨天', prop: 'overdueStatus' },
  { label: '用车类型', prop: 'overdueTime' },
  { label: '上车地点', prop: 'overdueTime' },
  { label: '目的地', prop: 'overdueTime' },
  { label: '途径地点', prop: 'overdueTime', span: 2 },
  { label: '备注', prop: 'overdueTime', span: 4 },
];

// 表格列配置
// 备品备件 & 工器具 共用表头
export const sparePartsToolsHeader = [
  {
    prop: 'sceneType',
    label: '物资编号',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneName',
    label: '物资类型',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'referenceValue',
    label: '物资描述',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'measurementUnit',
    label: '规格型号',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'workScore',
    label: '单位',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'description',
    label: '已申请数量',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'description',
    label: '库房名称',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];

// 计量资产 表头
export const measurementAssetHeader = [
  {
    prop: 'sceneType',
    label: '计量资产编号',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneName',
    label: '计量资产名称',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'referenceValue',
    label: '描述',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'measurementUnit',
    label: '规格型号',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'workScore',
    label: '单位',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'description',
    label: '已申请数量',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'description',
    label: '库房名称',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];

// 票卡 表头
export const ticketHeader = [
  {
    prop: 'sceneType',
    label: '工作票编号',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneName',
    label: '工作票名称',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'referenceValue',
    label: '工作票类型',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'measurementUnit',
    label: '签发人',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'workScore',
    label: '许可人',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'description',
    label: '签发时间',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'description',
    label: '许可时间',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];

// 业务信息 表格表头
export const businessInfoTableHeader = [
  {
    prop: 'sceneType',
    label: '类型',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneType',
    label: '人员名称',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneType',
    label: '人员编号',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneType',
    label: '联系方式',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];

// 处理记录 表格表头
export const handleRecordTableHeader = [
  {
    prop: 'sceneType',
    label: '操作类型',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneType',
    label: '处理人',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneType',
    label: '处理时间',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneType',
    label: '处理结果',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneType',
    label: '处理情况说明',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];

// 业务信息 descriptions 配置
export const businessInfoDescConfig: DescItemConfig[] = [
  { label: '部门', prop: 'orderNo' },
  { label: '工作时间', prop: 'orderNo' },
  { label: '工作地点', prop: 'orderNo' },
  { label: '工作内容', prop: 'orderNo' },
  { label: '是否需要车辆', prop: 'orderNo' },
  { label: '是否需要工器具', prop: 'orderNo' },
  { label: '是否需要备品备件', prop: 'orderNo' },
];

// 派工信息 descriptions 配置
export const dispatchInfoDescConfig: DescItemConfig[] = [
  { label: '派单人', prop: 'orderNo' },
  { label: '派单时间', prop: 'orderNo' },
];

// 现场处理信息 descriptions 配置
export const onSiteHandleInfoDescConfig: DescItemConfig[] = [
  { label: '处理情况', prop: 'orderNo', span: 4 },
  { label: '处理附件', prop: 'orderNo', span: 4 },
];
