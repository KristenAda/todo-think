<template>
  <dh-fixed-header-table-frame>
    <template #search>
      <div class="common-title">
        <c-title name="查询条件"></c-title>
      </div>
      <c-search-panel
        v-model="searchQuery"
        :columns="searchConfig"
        @search="handleSearch"
        @reset="handleReset"
      >
        <!-- <template #rating>
          <el-rate v-model="searchQuery.rating" text-color="#ff9900" />
          <span style="font-size: 12px; color: #999"></span>
        </template> -->
      </c-search-panel>
    </template>
    <template #operate>

    </template>
    
    
      <c-table
        :headers="tableHeader"
        :loading="loading"
        :table-options="{ data: tableData }"
        :border="true"
        :page-data="pageData"
        :show-index="true"
        @page-change="handlePage"
      >
      </c-table>
    
    <EditPop
      v-if="state.edit.visible"
      v-model="state.edit.visible"
      :title="state.edit.title"
      width="900px"
    >
    </EditPop>

  </dh-fixed-header-table-frame>
</template>

<script setup lang="ts">
import { useAuthorityStore } from '@/stores/authority';
import {tableHeader} from './components/tableHeaders'
// import searchForm from './components/searchForm.vue';

// import searchForm2 from './components/searchForm2.vue';

const useAuthority = useAuthorityStore();
const userInfo = useAuthority.loginInfo;
const currentOrg = useAuthority.orgDto;

const editRowData = ref({})
const state = reactive({
  edit: {
    visible: false,
    data: {},
    title: '新增数据集',
  },
    
});

const searchQuery = reactive({
  mgtOrgCode: currentOrg.mgtOrgCode,
  userName: '',
 
});

const searchConfig = [
  /** :is-radio="false"
              :form-prop="false" */
  {
    label: '供电单位',
    prop: 'mgtOrgCode',
    type: 'choose-unit', // 这里调用你的自定义组件
    props: {
      isRadio: true,
    
      formProp: false,
    },
    events: {
      getCode: (val) => {
        console.log('val :>> ', val);
        searchQuery.mgtOrgCode = val;
      },
    },
  },
  {
    label: '操作人',
    prop: 'userName',
    type: 'input',
    props: { placeholder: '请输入' },
  },
 
];


const loading = ref(false);
const tableData: any = ref([
  {
    oprateUser: '张三',
    exportContent: '导出资质信息：序号1~5，共计5条',
    exportTime: '2023-10-10 10:10:10',
  },
]);
const getTableData = async () => {
  loading.value = true;
};

// 分页数据
const pageData = reactive({ pageSize: 10, pageNo: 1, total: 0 });

const handleSearch = (val) => {
  console.log('searchQuery :>> ', searchQuery, 'val :>> ', val);
  getTableData();
};
const handleReset = () => {
  pageData.pageNo = 1;
  pageData.pageSize = 10;
  console.log('searchQuery :>> ', searchQuery);
};

interface pageProp {
  pageSize: number;
  pageNum: number;
}
// 分页器数据变化
const handlePage = (val: pageProp) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};

onMounted(() => {
  getTableData();
});
const handleDelete = () => {};
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
