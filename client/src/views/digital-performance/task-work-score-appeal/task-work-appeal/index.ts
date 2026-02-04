//=========== 导入依赖 ===========
import { ValidityPeriod } from '@/configs/enums/qualification-info-management';

//=========== 查询表单数据类型定义 ===========
export interface SearchQueryType {
  mgtOrgCode: string;
  userId: string;
  userName: string;
  type: string;
  startTime: string;
  endTime: string;
  time: string[] | [];
}

//=========== 表格行数据类型定义 ===========
export interface TableRowData {
  workOrderNo: string; // 工单编号
  taskName: string; // 任务名称
  appellant: string; // 申诉人
  appealDescription: string; // 申诉说明
  relatedScene: string; // 关联场景
  workScore: string; // 工分
  appealTime: string; // 申诉时间
  auditStatus: string; // 审核状态
}

//=========== 表格列配置 ===========
export const tableHeader = [
  {
    prop: 'workOrderNo',
    label: '工单编号',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'taskName',
    label: '任务名称',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'appellant',
    label: '申诉人',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'appealDescription',
    label: '申诉说明',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'relatedScene',
    label: '关联场景',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'workScore',
    label: '工分',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'appealTime',
    label: '申诉时间',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'auditStatus',
    label: '审核状态',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'operation',
    label: '操作',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];

//=========== 搜索表单配置函数 ===========
export const getSearchConfig = (searchQuery: SearchQueryType) => {
  return [
    {
      label: '工单编号',
      prop: 'workOrderNo',
      type: 'input',
      props: { placeholder: '请输入工单编号' },
    },
    {
      label: '任务名称',
      prop: 'taskName',
      type: 'input',
      props: { placeholder: '请输入任务名称' },
    },
    {
      label: '审核状态',
      prop: 'auditStatus',
      type: 'select',
      props: {
        filterable: true,
      },
      options: [{ label: '全部', value: 1 }],
    },
    {
      label: '申诉时间',
      prop: 'appealTime',
      type: 'date',
      props: { placeholder: '请输入任务名称' },
    },
  ];
};
