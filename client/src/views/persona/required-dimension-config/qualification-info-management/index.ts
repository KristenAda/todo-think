import { ValidityPeriod } from '@/configs/enums/qualification-info-management';

// 查询表单数据
export interface SearchQueryType {
  mgtOrgCode: string;
  userId: string;
  userName: string;
  type: string;
  startTime: string;
  endTime: string;
  time: string[] | [];
}

// 表格行数据类型
export interface TableRowData {
  mgtOrgCode: string; //供电单位
  qualificationName: string; // 资质名称
  applicablePost: string; // 适用岗位
  qualificationLevel: string; // 资质等级
  issuingAuthority: string; // 颁发机构
  validityPeriod: string; // 有效期
  reviewReminderCycle: string; // 复审提醒周期
  status: string; // 状态
  createTime?: string; // 创建时间
  validityPeriodUnit: ValidityPeriod; //有效期单位
  operation?: string; // 操作列
}

export const tableHeader = [
  {
    prop: 'qualificationName',
    label: '资质名称',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'applicablePost',
    label: '适用岗位',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'qualificationLevel',
    label: '资质等级',
    'show-overflow-tooltip': true,
    align: 'center',
    sortable: true,
  },
  {
    prop: 'issuingAuthority',
    label: '颁发机构',
    'show-overflow-tooltip': true,
    align: 'center',
  },

  {
    prop: 'validityPeriod',
    label: '有效期',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'reviewReminderCycle',
    label: '复审提醒周期',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'status',
    label: '状态',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'createTime',
    label: '创建时间',
    'show-overflow-tooltip': true,
    align: 'center',
    sortable: true,
  },
  {
    prop: 'operation',
    label: '操作',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];

export const getSearchConfig = (searchQuery: SearchQueryType) => {
  return [
    {
      label: '供电单位',
      prop: 'mgtOrgCode',
      type: 'choose-unit',
      props: {
        isRadio: true,
        formProp: false,
      },
      events: {
        getCode: (val: string) => {
          searchQuery.mgtOrgCode = val;
        },
      },
    },
    {
      label: '资质名称',
      prop: 'qualificationName',
      type: 'input',
      props: { placeholder: '请输入资质名称' },
    },
    {
      label: '适用岗位',
      prop: 'applicablePost',
      type: 'select',
      props: {
        filterable: true,
      },
      options: [{ label: '全部', value: 1 }],
    },
    {
      label: '资质等级',
      prop: 'qualificationLevel',
      type: 'select',
      props: {
        filterable: true,
      },
      options: [{ label: '全部', value: 1 }],
    },
    {
      label: '状态',
      prop: 'status',
      type: 'select',
      props: {
        filterable: true,
      },
      options: [
        { label: '全部', value: 1 },
        { label: '启用', value: 2 },
        { label: '停用', value: 3 },
      ],
    },
  ];
};
// 批量带入表头
export const batchImportDialogTableHeader: any = [
  {
    prop: 'qualificationName',
    label: '资质名称',
    'show-overflow-tooltip': true,
    align: 'center',
    type: 'input',
    rules: [{ required: true, message: '资质名称必须填写' }],
  },
  {
    prop: 'applicablePost',
    label: '适用岗位',
    'show-overflow-tooltip': true,
    align: 'center',
    type: 'input',
    rules: [{ required: true, message: '适用岗位必须填写' }],
  },
  {
    prop: 'qualificationLevel',
    label: '资质等级',
    'show-overflow-tooltip': true,
    align: 'center',
    type: 'select',
    options: [
      {
        label: '11',
        value: '11',
      },
    ],
    rules: [{ required: true, message: '资质等级必须选择' }],
  },
];
