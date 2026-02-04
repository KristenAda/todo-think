<template>
  <div class="ctable-wrapper">
    <el-table
      ref="table"
      v-loading="loading"
      class="normal-table"
      v-bind="tableOptions || {}"
      empty-text="暂无数据"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="showOrder" type="index" label="名次" width="50" />
      <el-table-column
        v-if="isSelect"
        type="selection"
        width="40"
      ></el-table-column>
      <el-table-column
        v-if="isSelect2"
        type="selection"
        width="40"
        :selectable="isSelectable"
      ></el-table-column>
      <el-table-column
        v-if="isSelect4"
        type="selection"
        width="40"
        :selectable="isSelectable4"
      ></el-table-column>
      <el-table-column
        v-if="isSelect3"
        type="selection"
        width="40"
      ></el-table-column>
      <el-table-column v-if="isRadio && showRadio" width="55">
        <template #default="{ row }">
          <el-radio v-model="selectRadio" :value="row"></el-radio>
        </template>
      </el-table-column>
      <!-- <el-table-column   type="selection" v-if="isRadio&&showRadio"  width="20" :selectable="handleSelectable">
       
      </el-table-column> -->

      <el-table-column
        v-for="item in headers"
        :key="item?.prop"
        v-bind="item"
        align="left"
      >
        <template v-if="$slots[item.prop]" #default="scope">
          <slot :name="item.prop" :data="scope"></slot>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="showPagination" class="normal-pagination">
      <div class="normal-pagination__left">
        共 {{ pageData?.total ?? 0 }} 条
        <el-select
          v-if="showPageLayout"
          v-model="pageData.pageSize"
          class="pagination-select"
          placeholder="Select"
          size="small"
          style="width: 100px"
          @change="handleSizeChange"
        >
          <el-option
            v-for="item in pageSizes"
            :key="item"
            :label="`${item}条/页`"
            :value="item"
          />
        </el-select>
        <el-icon
          v-if="hideExcel"
          size="20"
          class="iconfont icon-excel-full"
          @click="downloadFile"
        >
        </el-icon>
      </div>
      <div v-if="showPageLayout" class="normal-pagination__right">
        <el-pagination
          class="normal-pagination__right__buttons"
          size="small"
          background
          layout="prev, pager, next"
          :total="pageData.total"
          :current-page="pageData.pageNum"
          :page-size="pageData.pageSize"
          @current-change="handleChange"
        />
        <div class="normal-pagination__right__Go">
          前往<el-input-number
            v-model="pageData.pageNum"
            :min="min"
            :max="max"
            :controls="false"
            size="small"
            style="width: 50px; margin: 0 10px"
            @input="handleChange"
          />页
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts" name="CTableOld">
const emit = defineEmits(['pageChange', 'downloadFile', 'select']);
defineOptions({ name: 'CTable' });
interface pageDataDefault {
  pageSize: number;
  pageNum: number;
}
type Props = {
  tableOptions?: any;
  total?: number;
  pageSizes?: Array<number>;
  headers?: Array<any>;
  pageData?: pageDataDefault | any;
  hideExcel?: boolean;
  loading?: boolean;
  isSelect?: boolean;
  isSelect2?: boolean;
  isSelect3?: boolean;
  isSelect4?: boolean;
  isShowUser?: boolean;
  isRadio?: boolean;
  showRadio?: boolean;
  showOrder?: boolean;
  showPagination?: boolean;
  showPageLayout?: boolean;
  // downLoadType?:boolean
};
// 接受父组件参数，配置默认值
const props = withDefaults(defineProps<Props>(), {
  tableOptions: () => {},
  total: 0,
  pageSizes: () => [10, 20, 50],
  headers: () => [],
  pageData: () => ({}),
  hideExcel: true,
  loading: false,
  isSelect: false,
  // isSelect3:false,
  isRadio: false,
  showRadio: false,
  showOrder: false,
  showPagination: true,
  showPageLayout: true,
  // downLoadType:false,
});
const selectedRow = ref();
const selectRadio = ref(null);
const table = ref();
watch(
  () => props.isShowUser,
  (val) => {
    if (!val) {
      nextTick(() => {
        table.value.clearSelection();
      });
    }
  },
);
watch(
  () => selectRadio.value,
  (val) => {
    // console.log(val)
    emit('select', val);
  },
);
// 表格数据多选或单选
const handleSelectionChange = (val: any) => {
  if (props.isRadio) {
    // 单选
    // console.log(selectRadio.value)
    if (val.length > 0) {
      selectedRow.value = selectRadio.value;
      // selectedRow.value = val[0]
    } else {
      selectedRow.value = null;
    }
  } else {
    selectedRow.value = val;
  }

  // console.log(val)
  emit('select', selectedRow.value);
};
// const handleSelectable = (row: any) => {
//   return selectedRow.value == null || selectedRow.value.id === row.id;
// };
const isSelectable = (row: any) => {
  return row.isSelectable;
};
const isSelectable4 = (row: any) => {
  if (row.treatedStatus === '0') {
    return true;
  }
  return false;
};

// 最小页数
const min = computed(() => {
  return props.pageData.total > 0 ? 1 : 0;
});
// 最大页数
const max = computed(() => {
  return Math.ceil(props.pageData.total / props.pageData.pageSize || 1);
});
const handleSizeChange = (val: number) => {
  emit('pageChange', { pageSize: val });
};
const handleChange = (val: number | null | undefined) => {
  if (val && val > max.value) return;
  emit('pageChange', { pageNum: val });
};
// 文件下载
const downloadFile = () => {
  emit('downloadFile');
};
</script>

<style scoped lang="scss">
.normal-table {
  width: 100%;
  // height: 400px;
  height: calc(100% - 60px);
  --el-table-header-bg-color: #ebf4ff;
  --el-table-header-text-color: #000;
  --el-table-border: 0;
  border: 1px solid #c6e2ff;

  :deep(.el-table__cell) {
    text-align: left;
  }
  .custom-radio {
    display: flex;
    align-items: center;
    justify-content: center;
    :deep(.el-radio__inner) {
      margin-left: 15px;
      margin-right: 10px;
      border-radius: 50%;
      width: 15px;
      height: 15px;
    }
  }
}

.normal-pagination {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}

.normal-pagination__left {
  font-size: 12px;
  display: flex;
  align-items: center;
}

:deep(.el-table__cell) {
  border-bottom: 1px solid #c6e2ff !important;
}

.pagination-select {
  margin-left: 15px;
}

:deep(.el-table__inner-wrapper::before) {
  background-color: transparent;
}

:deep(.el-pagination.is-background .el-pager li) {
  background-color: transparent;
  border: 1px solid #c6e2ff;
  border-radius: 4px;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: var(--el-color-primary);
  border: 0;
}

.normal-pagination__right__buttons {
  :deep(.btn-prev),
  :deep(.btn-next) {
    background-color: transparent !important;
    border: 1px solid #c6e2ff;
    border-radius: 4px;
  }
}

.normal-pagination__right__Go {
  font-size: 12px;
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.normal-pagination__right {
  display: flex;
}

:deep(.el-select__placeholder.is-transparent) {
  text-align: center;
}

:deep(.el-select__placeholder) {
  text-align: center;
}

:deep(.el-scrollbar__view) {
  min-height: 200px;
}

:deep(.el-table__empty-block) {
  min-height: 200px;
}

.normal-pagination__doc {
  margin-left: 10px;
  color: #3a96fe;
  cursor: pointer;
}

.ctable-wrapper {
  height: 100%;
}
.iconfont {
  color: #3a96fe;
  margin-left: 15px;
  cursor: pointer;
}
</style>
