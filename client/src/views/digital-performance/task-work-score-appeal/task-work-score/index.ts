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

//=========== 表格行数据类型定义（与新prop完全对应） ===========
export interface TableRowData {
  workOrderNo: string; // 工单编号
  taskName: string; // 任务名称
  appellant: string; // 申诉人
  teamType: string; // 班组类型
  teamName: string; // 班组名称
  position: string; // 职务
  jobPost: string; // 岗位
  workScore: string; // 工分
  appealTime: string; // 申诉时间
  auditStatus: string; // 审核状态
  operation?: string; // 操作列
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
    prop: 'teamType',
    label: '班组类型',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'teamName',
    label: '班组名称',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'position',
    label: '职务',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'jobPost',
    label: '岗位',
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
      label: '申诉人',
      prop: 'appellant',
      type: 'input',
      props: { placeholder: '请输入申诉人' },
    },
    {
      label: '班组类型',
      prop: 'teamType',
      type: 'select',
      props: {
        filterable: true,
      },
      options: [{ label: '全部', value: 1 }],
    },
    {
      label: '班组类型',
      prop: 'teamType',
      type: 'input',
      props: { placeholder: '请输入班组类型' },
    },
    {
      label: '职务',
      prop: 'position',
      type: 'select',
      props: {
        filterable: true,
      },
      options: [{ label: '全部', value: 1 }],
    },
    {
      label: '岗位',
      prop: 'jobPost',
      type: 'select',
      props: {
        filterable: true,
      },
      options: [{ label: '全部', value: 1 }],
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
      props: { placeholder: '请选择申诉时间' },
    },
  ];
};
