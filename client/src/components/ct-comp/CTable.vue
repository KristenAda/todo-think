<template>
  <div class="ctable-wrapper">
    <el-table
      ref="table"
      v-loading="loading"
      :border="border"
      :highlight-current-row="false"
      :show-summary="showSummary"
      :sum-text="sumText"
      class="normal-table"
      height="100%"
      style="width: 100%"
      v-bind="tableOptions || {}"
      empty-text="暂无数据"
      :row-key="rowKey"
      :default-sort="defaultSort"
      scrollbar-always-on
      @row-click="handleClickRow"
      @sort-change="handleSortChange"
      @select="handleSelectChange"
      @select-all="handleSelectAllChange"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        v-if="isSelect"
        type="selection"
        reserve-selection
        width="40"
        fixed="left"
      ></el-table-column>
      <!-- <el-table-column
        v-if="isSelect2"
        type="selection"
        width="20"
        :selectable="isSelectable"
        fixed="left"
      ></el-table-column>
      <el-table-column
        v-if="isSelect4"
        type="selection"
        width="20"
        :selectable="isSelectable4"
        fixed="left"
      ></el-table-column>
      <el-table-column
        v-if="isSelect3"
        fixed="left"
        type="selection"
        width="20"
      ></el-table-column> -->
      <el-table-column v-if="isRadio && showRadio" fixed="left" width="55">
        <template #default="{ row }">
          <el-radio v-model="selectRadio" :value="row"></el-radio>
        </template>
      </el-table-column>
      <el-table-column
        v-if="showOrder"
        type="index"
        label="名次"
        width=""
        fixed="left"
      />
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="60"
        fixed="left"
        align="center"
      />

      <!-- <el-table-column   type="selection" v-if="isRadio&&showRadio"  width="20" :selectable="handleSelectable">
        
      </el-table-column> -->

      <el-table-column
        v-for="item in headers"
        :key="item?.prop"
        v-bind="item"
        :align="item.align"
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
          v-model="pageComputedData.pageSize"
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
          v-if="showExcel"
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
          layout="prev, pager, next"
          :total="pageData.total"
          :current-page="pageData.pageNo"
          :page-size="pageData.pageSize"
          @current-change="handleChange"
        />
        <div class="normal-pagination__right__Go">
          前往<el-input-number
            v-model="pageComputedData.pageNo"
            :min="min"
            :max="max"
            :controls="false"
            size="small"
            style="width: 50px; margin: 0 10px"
            @input="handleChange"
          />页
        </div>
      </div>
      <div v-if="showPageLayout2" class="normal-pagination__right">
        <el-pagination
          class="normal-pagination__right__buttons2"
          size="small"
          background
          layout="prev, pager, next"
          :total="pageData.total"
          :current-page="pageData.pageNo"
          :page-size="pageData.pageSize"
          @current-change="handleChange"
        />
        <div class="normal-pagination__right__Go">
          前往<el-input-number
            v-model="pageComputedData.pageNo"
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

    <ExportExcelDialog
      ref="exportExcelDialogRef"
      :end-page="endPage"
      @export="exportClick"
    />
  </div>
</template>
<script setup lang="ts" name="CTable">
import { excelDownload } from '@/apis/modules/common';
import downloadFiles from '@/utils/common/downloadFiles';
import filterExportData from '@/utils/common/filterExportData';

const emit = defineEmits([
  'pageChange',
  'downloadFile',
  'select',
  'sortChange',
  'clickRow',
]);
defineOptions({ name: 'CTable2' });
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
  showExcel?: boolean;
  loading?: boolean;
  isSelect?: boolean;
  // isSelect2?: boolean;
  // isSelect3?: boolean;
  // isSelect4?: boolean;
  isShowUser?: boolean;
  isRadio?: boolean;
  showRadio?: boolean;
  showOrder?: boolean;
  showIndex?: boolean;
  border?: boolean;
  showPagination?: boolean;
  showPageLayout?: boolean;
  showPageLayout2?: boolean;
  showSummary?: boolean;
  sumText?: string;
  searchQuery?: any; // 查询参数 导出时使用
  exportUrl?: string; // 导出url
  exportFileName?: string; // 导出的文件名
  // downLoadType?:boolean
  rowKey?: string; // 行key
  defaultSort?: any;
};
// 接受父组件参数，配置默认值
const props = withDefaults(defineProps<Props>(), {
  tableOptions: () => {},
  total: 0,
  pageSizes: () => [5, 10, 20, 50],
  headers: () => [],
  pageData: () => ({}),
  showExcel: true,
  loading: false,
  isSelect: false,
  // isSelect3:false,
  isRadio: false,
  showRadio: false,
  showOrder: false,
  showIndex: false,
  showPagination: true,
  border: true,
  showPageLayout: true,
  showPageLayout2: false,
  showSummary: false,
  sumText: '合计',
  // downLoadType:false,
  rowKey: 'id',
  defaultSort: {
    prop: '',
    order: '',
  },
});

const pageComputedData = computed(() => {
  return props.pageData;
});
const selectedRow = ref();
const selectRadio: any = ref(null);
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
    emit('select', val);
  },
  { deep: true },
);
// 表格数据多选或单选
const handleSelectionChange = (val: any) => {
  if (props.isRadio) {
    // 单选
    console.log(selectRadio.value);
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
  // emit('select', selectedRow.value);
};

const handleSelectChange = (selection: any) => {
  emit('select', selection);
};
const handleSelectAllChange = (selection: any) => {
  emit('select', selection);
};

const handleSortChange = (col: any, prop: any, order: any) => {
  emit('sortChange', col, prop, order);
};

// const isSelectable = (row: any) => {
//   return row.isSelectable;
// };
// const isSelectable4 = (row: any) => {
//   // eslint-disable-next-line eqeqeq
//   if (row.treatedStatus == '0') {
//     return true;
//   }
//   return false;
// };
// 点击行操作
const handleClickRow = (row: any) => {
  emit('clickRow', row);
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
  exportExcelDialogRef.value.openExportDialog();
  emit('downloadFile');
};
// 导出相关
const exportExcelDialogRef = ref();
// 结束页
const endPage = computed(() => {
  const { total = 0, pageSize = 1 } = props.pageData || {};
  // 计算总页数：向上取整，避免pageSize为0
  return pageSize > 0 ? Math.ceil(total / pageSize) : 1;
});

// 导出
const exportClick = async (e: any) => {
  try {
    let url: string;
    const localEnvList = ['locala', 'development'];
    const isLocalEnv = localEnvList.includes(import.meta.env.MODE); // 环境判断true=本地
    if (isLocalEnv) {
      url = props.exportUrl;
    } else {
      url = import.meta.env.VITE_PROD_API_URL_PREFIX + props.exportUrl;
    }

    const res = await excelDownload({
      excelHeader: {
        columns: filterExportData(props.headers),
        params: {
          ...props.searchQuery,
          startPageNo: e.startPageNo,
          endPageNo: e.endPageNo,
          pageSize: props.pageData.pageSize,
          pageNum: props.pageData.pageNum,
        },
        url,
        fileName: props.exportFileName,
      },
    });
    downloadFiles(res, props.exportFileName);
    exportExcelDialogRef.value.closeExportDialog();
  } catch (err) {
    ElMessage.error(err);
  }
};
</script>

<style scoped lang="scss">
:deep(.el-table--border th.el-table__cell) {
  border: none !important;
  // text-align: center;
}

.ctable-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.normal-table {
  width: 100%;
  // height: calc(100% - 60px);
  flex: 1;
  /* 占据 ctable-wrapper 中除去分页后的所有空间 */
  --el-table-header-bg-color: #ebf4ff;
  --el-table-header-text-color: #000;
  --el-table-header-border: 0;
  --el-table-border: solid 1px #ebf4ff;
  border: 1px solid #c6e2ff;

  :deep(.el-table__border-left-patch) {
    display: none;
  }
  &::before {
    display: none;
  }
  &::after {
    display: none;
  }

  :deep(.el-scrollbar) {
    padding-bottom: 28px !important;
  }

  :deep(.el-scrollbar__bar.is-horizontal > div) {
    height: 24px;
  }

  :deep(.el-scrollbar__thumb) {
    --el-scrollbar-bg-color: #c6e2ff !important;
    --el-text-color-secondary: #c6e2ff !important;

    bottom: 16px;

    &:hover {
      --el-scrollbar-hover-bg-color: #c6e2ff !important;
    }
  }
  :deep(.el-table__header-wrapper) {
    border-bottom: 1px solid #c6e2ff;
  }
  // border: 1px solid var(--el-table-border-color);
  // :deep(.el-table__header-wrapper th.el-table__cell) {
  //   border-bottom: 1px solid #c6e2ff; /* 给表头下方加一条蓝色的线 */
  //   border-right: 1px solid #c6e2ff; /* 给表头列之间加边框 */
  // }

  /* 去除表头最后一个单元格的右边框（美观建议） */
  // :deep(.el-table__header-wrapper th.el-table__cell:last-child) {
  //   border-right: none;
  // }

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
  margin: 18px 8px;
  flex-shrink: 0;
  background-color: #fff;
  /* 防止背景透明看到滚动的内容 */
}

.normal-pagination__left {
  font-size: 12px;
  display: flex;
  align-items: center;
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

// .normal-pagination__right__buttons {
//   :deep(.btn-prev),
//   :deep(.btn-next) {
//     // background-color: transparent !important;
//     // border: 1px solid #c6e2ff;
//     // border-radius: 4px;
//   }
// }

.normal-pagination__right__buttons2 {
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

.iconfont {
  color: #3a96fe;
  margin-left: 15px;
  cursor: pointer;
}
</style>
