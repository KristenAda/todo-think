// 查询表单数据（同步更新查询项的prop为小驼峰，匹配搜索配置）
export interface SearchQueryType {
  month: string;
  unitId: string;
}

export const getSearchConfig = (searchQuery) => {
  return [
    {
      label: '选择单位',
      prop: 'unitId',
      type: 'choose-unit', // 这里调用你的自定义组件
      props: {
        showCurrentUnit: true,
        isRadio: false,
        isChild: false,
      },
      events: {
        getCode: (val) => {
          searchQuery.unitId = val;
        },
        // start: () => {
        //   startSearch();
        // },
      },
    },
    {
      label: '年月',
      prop: 'month',
      type: 'date',
      props: { placeholder: '请选择年月' },
    },
  ];
};
