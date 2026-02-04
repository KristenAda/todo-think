<template>
  <dh-dialog ref="dialogRef" @opened="onOpened">
    <div class="edit-dialog-main">
      <div class="common-title">
        <c-title name="失败明细" style="font-weight: bold" />
      </div>
      <div style="height: 500px">
        <c-table
          :headers="tableHeader"
          :loading="loading"
          :table-options="{ data: tableData }"
          :show-index="true"
          border
          :page-data="pageData"
          show-excel
          :show-pagination="false"
          @download-file="handleDownloadFile"
          @page-change="handlePage"
          @select="handleSelectionChange"
        >
        </c-table>
      </div>
    </div>
    <template #footer>
      <el-button plain @click="handleClose">关闭</el-button>
      <!-- <el-button @click="reset">重置</el-button> -->
      <el-button type="primary" :loading="submitting" @click="submit"
        >确定</el-button
      >
    </template>
  </dh-dialog>
</template>

<script setup>
import { orderPersonScoreQueryDayWorkScoreFailDetail } from '@/apis/modules/digital-performance/daily-work-point-management/daily-work-point-calculation';
import { SUCCESS_CODE } from '@/configs/const/basic';

const props = defineProps({
  mgtOrgCode: {
    type: String,
    default: '',
  },
  date: {
    type: String,
    default: '',
  },
});
const emits = defineEmits(['confirm', 'close']);

const dialogRef = ref();
const submitting = ref(false);
// 表格数据
const onOpened = () => {
  getTableData();
};
const loading = ref(false);
const tableData = ref([]);
const getTableData = async () => {
  loading.value = true;
  const params = {
    mgtOrgCode: props.mgtOrgCode,
    checkYmd: props.date,
  };
  const res = await orderPersonScoreQueryDayWorkScoreFailDetail(params);
  if (res.code === SUCCESS_CODE) {
    tableData.value = res.data || [];
  }
  loading.value = false;
};
const tableHeader = [
  {
    label: '员工姓名',
    prop: 'empName',
  },
  {
    label: '完成任务数',
    prop: 'totalOrderNum',
  },
  {
    label: '任务失败数',
    prop: 'failOrderNum',
  },
  {
    label: '工分',
    prop: 'totalEmpScore',
  },
];

const pageData = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0,
});
const handlePage = (val) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};
const handleSelectionChange = (selection) => {
  console.log('selection :>> ', selection);
};
const submit = () => {
  dialogRef.value.close();
  emits('confirm');
};
const handleClose = () => {
  dialogRef.value.close();
};
</script>

<style lang="scss" scoped>
.edit-dialog-main {
  padding: 10px 20px;
}
.range-input-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .range-split {
    margin: 0 10px;
    color: #909399;
  }
}
</style>
