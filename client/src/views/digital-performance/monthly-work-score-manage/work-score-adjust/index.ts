// 查询表单数据（同步更新查询项的prop为小驼峰，匹配搜索配置）
export interface SearchQueryType {
  mgtOrgCode: string;
  userId: string;
  userName: string;
  type: string;
  startTime: string;
  endTime: string;
  time: string[] | [];
  // 新增搜索配置对应的小驼峰字段（按需补充，保持查询逻辑完整）
  yearMonth?: string;
  teamType?: string | number;
  teamName?: string;
  position?: string | number;
  post?: string | number;
  adjustmentTime?: string;
}

// 表格行数据类型（同步更新表格列对应的prop为小驼峰）
export interface TableRowData {
  mgtOrgCode: string; // 供电单位
  yearMonth: string; // 年月
  teamType: string; // 班组类型
  teamName: string; // 班组名称
  userName: string; // 姓名
  position: string; // 职务
  post: string; // 岗位
  currentMonthTotalScore: string; // 当月总分
  totalExtraBonus: string; // 额外加分（总）
  totalExtraDeduction: string; // 额外减分（总）
  actualCurrentMonthTotalScore: string; // 实际当月总分
  latestAdjustment: string; // 最新调整（
}

export const tableHeader = [
  {
    prop: 'yearMonth',
    label: '年月',
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
    prop: 'userName',
    label: '姓名',
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
    prop: 'post',
    label: '岗位',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'currentMonthTotalScore',
    label: '当月总分',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'totalExtraBonus',
    label: '额外加分（总）',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'totalExtraDeduction',
    label: '额外减分（总）',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'actualCurrentMonthTotalScore',
    label: '实际当月总分',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'latestAdjustment',
    label: '最新调整',
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

export const getSearchConfig = () => {
  return [
    {
      label: '年月',
      prop: 'yearMonth',
      type: 'date',
      props: { placeholder: '请选择年月' },
    },
    {
      label: '班组类型',
      prop: 'teamType',
      type: 'select',
      props: {
        filterable: true,
        placeholder: '请选择班组类型',
      },
      options: [{ label: '全部', value: 1 }],
    },
    {
      label: '班组名称',
      prop: 'teamName',
      type: 'input',
      props: {
        filterable: true,
        placeholder: '请输入班组名称',
      },
    },
    {
      label: '姓名',
      prop: 'userName',
      type: 'input',
      props: {
        filterable: true,
        placeholder: '请输入姓名',
      },
    },
    {
      label: '职务',
      prop: 'position',
      type: 'select',
      props: {
        filterable: true,
        placeholder: '请选择职务',
      },
      options: [{ label: '全部', value: 1 }],
    },
    {
      label: '岗位',
      prop: 'post',
      type: 'select',
      props: {
        filterable: true,
        placeholder: '请选择岗位',
      },
      options: [{ label: '全部', value: 1 }],
    },
    {
      label: '调整时间',
      prop: 'adjustmentTime',
      type: 'date',
      props: { placeholder: '请选择调整时间' },
    },
  ];
};
