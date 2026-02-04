<template>
  <dh-fixed-header-table-frame>
    <template #search>
      <div class="common-title">
        <c-title name="查询条件" />
      </div>
      <c-search-panel
        v-model="searchQuery"
        :columns="state.searchConfig"
        @search="handleSearch"
      />
    </template>

    <template #operate-bottom>
      <el-button
        type="primary"
        plain
        icon="plus"
        @click="handleEditPop($event, null)"
      >
        新增因子
      </el-button>
      <el-button
        type="danger"
        :disabled="delBtnDisabled"
        plain
        icon="delete"
        @click="handleDelete($event, state.selection)"
      >
        批量删除
      </el-button>
    </template>

    <c-table
      :headers="tableHeader"
      :loading="loading"
      :search-query="searchQuery"
      export-file-name="因子信息"
      export-url="/member/factormanage/export"
      :table-options="{ data: tableData }"
      is-select
      border
      :page-data="pageData"
      :default-sort="{ prop: 'createTime', order: 'ascending' }"
      :show-index="true"
      show-excel
      row-key="pOrderFactorId"
      @download-file="handleDownloadFile"
      @page-change="handlePage"
      @select="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <template #operation="scope">
        <el-space size="large">
          <el-link type="primary" @click="handleDetail(scope.data.row)">
            查看
          </el-link>
          <el-link
            type="primary"
            @click="handleEditPop($event, scope.data.row)"
          >
            编辑
          </el-link>
          <el-link
            type="danger"
            @click="handleDelete($event, [scope.data.row])"
          >
            删除
          </el-link>
        </el-space>
      </template>
    </c-table>

    <detail-view-dialog
      v-if="state.detail.visible"
      v-model="state.detail.visible"
      :title="state.detail.title"
      :data="state.detail.data"
      :column="2"
      :group-config="state.detail.groupConfig"
      width="800px"
    />

    <edit-pop
      v-if="state.edit.visible"
      v-model="state.edit.visible"
      :title="state.edit.title"
      :info="state.edit.data"
      width="900px"
      @confirm="handleEditConfirm"
    />
  </dh-fixed-header-table-frame>
</template>

<script setup>
/**
 * 因子管理页面
 * @description 用于维护各种评价因子、参考分值及说明
 */

import {
  deleteFactorConfig,
  getFactorConfigList,
} from '@/apis/modules/digital-performance/task-work-point-factor-config/task-work-point-factor-management';
import { useAuthorityStore } from '@/stores/authority';
import { FactorType } from '@/configs/enums/commons';
import { getEnumEntriesForElementUI } from '@/utils/common/enum-util';
import {
  ProcessStep,
  RegionType,
  TimeUnit,
} from '@/configs/enums/digital-performance';
import { SUCCESS_CODE } from '@/configs/const/basic';
import EditPop from './components/Edit.vue';

const authorityStore = useAuthorityStore();
const currentOrg = authorityStore.orgDto;

/**
 * 通用解析器：处理后端返回的 JSON 字符串或普通字符串
 * @param val 接口返回的值
 * @param type 因子类型
 */
const parseRefValue = (val, type) => {
  if (!val) return '-';

  // 1. 处理距离和时段 (JSON数组字符串 -> 格式化文本)
  if ([FactorType.距离, FactorType.时段].includes(type)) {
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      if (Array.isArray(parsed)) {
        return `[${parsed.join(' - ')}]`;
      }
    } catch (e) {
      return val; // 解析失败直接显示
    }
  }

  // 2. 处理地域 (枚举映射)
  if ([FactorType.地域].includes(type)) {
    return RegionType[val] || val;
  }

  // 3. 其他 (直接显示)
  return val;
};

const parseUnit = (val, type) => {
  if (FactorType.超期 === type) {
    return TimeUnit[val];
  }
  if (FactorType.工序 === type) {
    return ProcessStep[val];
  }
  return val;
};

/* ------------------  页面状态  ------------------ */
const state = reactive({
  /** 编辑弹窗状态 */
  edit: {
    visible: false,
    data: {},
    title: '新增因子',
  },

  /** 详情弹窗状态 */
  detail: {
    visible: false,
    data: [],
    title: '因子详情',
    groupConfig: [
      {
        title: '基础信息',
        column: 2,
        fields: [
          {
            field: 'factorType',
            label: '因子类型',
            formatter: (val) => FactorType[val] || val, // 兼容英文Key
          },
          { field: 'factorName', label: '因子名称' },

          {
            field: 'refValue',
            label: '规则阈值',
            formatter: (val, row) => parseRefValue(val, row.factorType),
          },
          {
            field: 'measureUnit',
            label: '计量单位',
            formatter: (val, row) => parseUnit(val, row.factorType),
          },
          { field: 'refScore', label: '参考工分' },
          { field: 'createTime', label: '创建时间' },
          { field: 'factorDesc', label: '说明', span: 2 },
        ],
      },
    ],
  },

  /** 查询配置 */
  searchConfig: [
    {
      label: '供电单位',
      prop: 'orgNo',
      type: 'choose-unit',
      props: {
        showCurrentUnit: true,
        isRadio: true,
        isChild: false,
      },
      // events: {
      //   getCode: (val) => {
      //     console.log('val :>> ', val);
      //     if (typeof val === 'string' || typeof val === 'number') {
      //       searchQuery.orgNo = [val];
      //     } else {
      //       searchQuery.orgNo = val;
      //     }
      //   },
      //   start: () => {
      //     startSearch();
      //   },
      // },
    },
    {
      label: '因子类型',
      prop: 'factorType',
      type: 'select',
      options: getEnumEntriesForElementUI(FactorType),
    },
    {
      label: '因子名称',
      prop: 'factorName',
      type: 'input',
      props: {
        placeholder: '请输入因子名称',
        clearable: true,
      },
    },
    {
      label: '创建时间',
      prop: 'createTimeRange',
      type: 'date',
      props: {
        type: 'daterange',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
    },
  ],

  /** 表格选中数据 */
  selection: [],
});

/** 查询参数 */
const searchQuery = reactive({
  orgNo: [currentOrg.mgtOrgCode],
  factorName: '',
  factorType: null,
  createTimeRange: [],
});

const tableHeader = [
  {
    prop: 'factorType',
    label: '因子类型',
    width: 120,
    formatter: (row) => FactorType[row.factorType] || row.factorType,
  },
  {
    prop: 'factorName',
    label: '因子名称',
    'show-overflow-tooltip': true,
    'min-width': 150,
  },
  {
    prop: 'refValue',
    label: '规则阈值',
    width: 180,
    formatter: (row) => parseRefValue(row.refValue, row.factorType),
  },
  {
    prop: 'measureUnit',
    label: '计量单位',
    width: 100,
    formatter: (row) => parseUnit(row.measureUnit, row.factorType),
  },
  {
    prop: 'refScore',
    label: '参考工分',
    width: 120,
    sortable: true,
    formatter: (row) =>
      row.refScore ? Number(row.refScore).toFixed(1) : '0.0',
  },
  {
    prop: 'factorDesc',
    label: '说明',
    'show-overflow-tooltip': true,
    'min-width': 200,
  },
  { prop: 'createTime', label: '创建时间', sortable: true, width: 180 },
  {
    prop: 'operation',
    label: '操作',
    align: 'center',
    fixed: 'right',
    width: 180,
  },
];

/** 加载状态 */
const loading = ref(false);

/** 删除按钮禁用状态 */
const delBtnDisabled = computed(() => !state.selection.length);

/** 表格数据 */
const tableData = ref([]);

/** 分页数据 */
const pageData = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
  sortType: 'descending',
  sortField: 'refScore',
});

/* ------------------  方法定义  ------------------ */

/** 获取列表数据 */
const getTableData = async () => {
  const [beginTime, endTim] = searchQuery.createTimeRange || [];
  const params = {
    ...searchQuery,
    beginTime,
    endTime: endTim,
    pageSize: pageData.pageSize,
    pageNum: pageData.pageNo,
    sortType: pageData.sortType,
    sortField: pageData.sortField,
  };
  if (typeof params.orgNo === 'string' || typeof params.orgNo === 'number') {
    params.orgNo = [params.orgNo];
  }
  delete params.createTimeRange;

  loading.value = true;
  try {
    const res = await getFactorConfigList(params);
    if (res.code === SUCCESS_CODE) {
      tableData.value = res.data.records || [];
      pageData.total = res.data.total || 0;
    }
  } catch (error) {
    console.log('error :>> ', error);

    tableData.value = [];
    pageData.total = 0;
  } finally {
    loading.value = false;
  }
};

/** 查询 */
const startSearch = () => {
  pageData.pageNo = 1;
  getTableData();
};

/** 查看详情 */
const handleDetail = (row) => {
  state.detail.data = row;
  state.detail.visible = true;
};

const handleSortChange = (data) => {
  pageData.sortField = data.prop;
  pageData.sortType = data.order;
  startSearch();
};

/** 查询按钮回调 */
const handleSearch = () => {
  startSearch();
};

/** 新增/编辑弹窗 */
const handleEditPop = (_, row) => {
  if (row) {
    // 拷贝 row 数据，避免直接修改表格
    state.edit.data = JSON.parse(JSON.stringify(row));
    state.edit.title = '编辑因子';
  } else {
    state.edit.data = {};
    state.edit.title = '新增因子';
  }
  state.edit.visible = true;
};

/** 编辑完成后刷新列表 */
const handleEditConfirm = () => {
  getTableData();
};

/** 分页变化 */
const handlePage = (val) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};

/** 表格选中变化 */
const handleSelectionChange = (selection) => {
  console.log('selection :>> ', selection);
  state.selection = selection;
};

/** 导出/下载 */
const handleDownloadFile = (val) => {
  // ElMessage.success('导出成功');
};

/** 删除 */
const handleDelete = async (e, selection) => {
  if (!selection.length) return;
  console.log('selection :>> ', state.selection);
  await ElMessageBox.confirm(
    `确认删除选中的 ${selection.length} 个因子吗？`,
    '风险提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  );

  const ids = selection.map((item) => item.pOrderFactorId);
  try {
    const res = await deleteFactorConfig({ pOrderFactorIdList: ids });
    if (res.code === SUCCESS_CODE) {
      ElMessage.success('删除成功');
      getTableData();
      state.selection = [];
    }
  } catch (err) {
    // 模拟成功 (如果没有真实后端，可打开此注释)
    // ElMessage.success('模拟删除成功');
    // state.selection = [];
    // getTableData();
    console.error(err);
  }
};

/* ------------------  生命周期  ------------------ */
onMounted(() => {
  getTableData();
});
</script>

<style scoped lang="scss">
.common-title {
  margin-bottom: 12px;
}
</style>
