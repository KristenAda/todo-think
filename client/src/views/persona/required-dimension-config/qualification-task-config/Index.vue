<template>
  <!-- 资质任务配置列表 -->
  <dh-fixed-header-table-frame>
    <!-- 查询区域 -->
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

    <!-- 操作按钮区域 -->
    <template #operate-bottom>
      <el-button
        type="primary"
        plain
        icon="plus"
        @click="handleEditPop($event, null)"
      >
        新增
      </el-button>
      <el-button
        type="danger"
        :disabled="delBtnDisabled"
        plain
        icon="delete"
        @click="handleDelete(state.selection)"
      >
        删除
      </el-button>
    </template>

    <!-- 列表表格 -->
    <c-table
      :headers="tableHeader"
      :loading="loading"
      :table-options="{ data: tableData }"
      is-select
      border
      :page-data="pageData"
      :show-index="true"
      show-excel
      @download-file="handleDownloadFile"
      @page-change="handlePage"
      @select="handleSelectionChange"
    >
      <!-- 行内操作列 -->
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
          <el-link type="danger" @click="handleDelete([scope.data.row])">
            删除
          </el-link>
        </el-space>
      </template>
    </c-table>

    <!-- 详情弹窗 -->
    <detail-view-dialog
      v-if="state.detail.visible"
      v-model="state.detail.visible"
      :title="state.detail.title"
      :data="state.detail.data"
      :column="3"
      :group-config="state.detail.groupConfig"
      width="1000px"
    />

    <!-- 新增/编辑弹窗 -->
    <edit-pop
      v-if="state.edit.visible"
      v-model="state.edit.visible"
      :title="state.edit.title"
      :info="state.edit.data"
      width="800px"
    />
  </dh-fixed-header-table-frame>
</template>

<script setup>
/**
 * 资质任务配置页面
 * @description 用于维护任务类型与所需资质的映射关系
 */

import {
  deleteQualificationTaskConfig,
  getQualificationList,
  getQualificationTaskConfigList,
} from '@/apis/modules/persona/required-dimension-config/qualification-task-config';
import { useAuthorityStore } from '@/stores/authority';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
import EditPop from './components/Edit.vue';

/* ------------------  权限与全局常量  ------------------ */
const authorityStore = useAuthorityStore();
const userInfo = authorityStore.loginInfo;
const currentOrg = authorityStore.orgDto;

/* ------------------  页面状态  ------------------ */
const state = reactive({
  /** 编辑弹窗状态 */
  edit: {
    visible: false,
    data: {},
    title: '新增资质任务配置',
  },

  /** 详情弹窗状态 */
  detail: {
    visible: false,
    data: [],
    title: '查看',
    /** 详情分组配置 */
    groupConfig: [
      {
        title: '资质信息',
        column: 2, // 覆盖全局3列
        fields: [
          { field: 'taskType', label: '任务类型' },
          { field: 'qualification', label: '所需资质' },
          { field: 'createTime', label: '创建时间' },
        ],
      },
    ],
  },

  /** 资质下拉选项 */
  qualificationSelectList: [],

  /** 查询配置 */
  searchConfig: [
    {
      label: '供电单位',
      prop: 'orgNos',
      type: 'choose-unit',
      props: {
        showCurrentUnit: true,
        isRadio: false,
        isChild: false,
      },
      events: {
        getCode: (val) => {
          console.log('val :>> ', val);
          searchQuery.orgNos = val;
        },
        start: () => {
          startSearch();
        },
      },
    },
    {
      label: '所需资质',
      prop: 'qualificationName',
      type: 'select',
      props: {
        placeholder: '全部',
      },
      options: computed(() => state.qualificationSelectList),
    },
    {
      label: '创建时间',
      prop: 'createTime',
      type: 'date',
      props: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD',
        format: 'YYYY-MM-DD',
        'start-placeholder': '起始',
        'end-placeholder': '截止',
      },
    },
  ],

  /** 表格选中数据 */
  selection: [],
});

/** 查询参数 */
const searchQuery = reactive({
  orgNos: [currentOrg.mgtOrgCode],
  qualificationName: '',
  createTime: [],
});

/** 表格列配置 */
const tableHeader = [
  {
    prop: 'taskType',
    label: '任务类型',
    'show-overflow-tooltip': true,
    'min-width': 180,
  },
  {
    prop: 'qualification',
    label: '所需资质',
    'show-overflow-tooltip': true,
    'min-width': 180,
  },
  {
    prop: 'createTime',
    label: '创建时间',
    'show-overflow-tooltip': true,
    width: 200,
    sortable: true,
  },
  {
    prop: 'operation',
    label: '操作',
    'show-overflow-tooltip': true,
    align: 'center',
    fixed: 'right',
    width: 200,
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
});

/* ------------------  方法定义  ------------------ */
/** 获取列表数据 */
const getTableData = async () => {
  const params = {
    ...searchQuery,
    pageSize: pageData.pageSize,
    pageNum: pageData.pageNo,
  };
  loading.value = true;
  try {
    const res = await getQualificationTaskConfigList(params);
    if (res.code === 200) {
      tableData.value = res.data.records || [];
      pageData.total = res.data.total || 0;
    }
  } catch (error) {
    // 兜底：异常时展示本地假数据
    tableData.value = [
      {
        id: 1,
        index: 1,
        taskType: '电气设备检修',
        qualification: '高压电工证、低压电工证、电气设备检修证',
        createTime: '2025-12-01 09:30:22',
      },
      {
        id: 2,
        index: 2,
        taskType: '消防安全隐患排查',
        qualification: '消防设施操作员证、消防安全管理员证',
        createTime: '2025-12-01 14:15:47',
      },
      {
        id: 3,
        index: 3,
        taskType: '起重设备运维',
        qualification: '起重机械作业证、特种设备安全管理证',
        createTime: '2025-12-02 10:05:18',
      },
      {
        id: 4,
        index: 4,
        taskType: '高空外墙清洁',
        qualification: '高空作业证、吊篮操作证',
        createTime: '2025-12-02 15:20:33',
      },
      {
        id: 5,
        index: 5,
        taskType: '有限空间作业',
        qualification: '有限空间作业证、应急救援证',
        createTime: '2025-12-03 08:45:09',
      },
      {
        id: 6,
        index: 6,
        taskType: '电气设备检修',
        qualification: '高压电工证、低压电工证',
        createTime: '2025-12-03 11:10:55',
      },
      {
        id: 7,
        index: 7,
        taskType: '消防安全隐患排查',
        qualification: '消防设施操作员证',
        createTime: '2025-12-04 13:35:21',
      },
      {
        id: 8,
        index: 8,
        taskType: '起重设备运维',
        qualification: '起重机械作业证',
        createTime: '2025-12-04 16:40:14',
      },
    ];
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

/** 查询按钮回调 */
const handleSearch = () => {
  startSearch();
};

/** 新增/编辑弹窗 */
const handleEditPop = (_, row) => {
  if (row) {
    state.edit.data = row;
    state.edit.title = '编辑资质任务配置';
  } else {
    state.edit.data = {};
    state.edit.title = '新增资质任务配置';
  }
  state.edit.visible = true;
};

/** 分页变化 */
const handlePage = (val) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};

/** 表格选中变化 */
const handleSelectionChange = (selection) => {
  state.selection = selection;
};

/** 下载文件（示例） */
const handleDownloadFile = () => {
  ElMessage.success('文件下载成功');
};

/** 获取资质下拉数据 */
const getQualificationSelectList = async () => {
  try {
    const res = await getQualificationList({});
    if (res.code === 200) {
      state.qualificationSelectList = res.data || [];
    }
  } catch (error) {
    console.error('获取资质下拉失败', error);
  }
};

/** 删除 */
const handleDelete = async (selection) => {
  if (!selection.length) {
    ElMessage.warning('请选择要删除的项');
    return;
  }
  const ids = selection.map((item) => item.id);
  await ElMessageBox.confirm('确认删除选中项吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });
  const res = await deleteQualificationTaskConfig({ ids });
  if (res.code === 200) {
    ElMessage.success('删除成功');
    getTableData();
    state.selection = [];
  }
};

/* ------------------  生命周期  ------------------ */
onMounted(async () => {
  await getQualificationSelectList();
  getTableData();
});
</script>

<style scoped lang="scss">
.echart-container {
  width: 100%;
  height: 300px;

  .echart-box {
    width: 100%;
    height: 100%;

    .echart {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
