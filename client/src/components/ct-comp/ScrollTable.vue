<template>
  <div class="auto-loop-table">
    <el-table
      ref="tableRef"
      v-loading="loading"
      stripe
      class="normal-table"
      v-bind="tableOptions || {}"
      empty-text="暂无数据"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="showIndex" type="index" width="60" label="序号" />

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
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, watch, computed } from 'vue';

// 组件参数
const props = defineProps({
  columns: {
    // 表格列配置
    type: Array,
    required: true,
    default: () => [],
  },
  tableData: {
    // 固定的表格数据
    type: Array,
    required: true,
    default: () => [],
  },
  tableOptions: {
    type: Object,
    default: () => {},
  },
  headers: {
    type: Array,
    required: true,
    default: () => [],
  },
  showIndex: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  tableHeight: {
    // 表格高度（决定可视区域大小）
    type: Number,
    default: 500,
  },
  scrollSpeed: {
    // 滚动速度(ms)，值越小越快
    type: Number,
    default: 50,
  },
  pauseOnHover: {
    // 鼠标悬停时是否暂停滚动
    type: Boolean,
    default: true,
  },
  pageData: {
    type: Object,
    // eslint-disable-next-line vue/require-valid-default-prop
    default: {},
  },
  showPagination: {
    // 鼠标悬停时是否暂停滚动
    type: Boolean,
    default: true,
  },
  showPageLayout: {
    // 鼠标悬停时是否暂停滚动
    type: Boolean,
    default: true,
  },
  hideExcel: {
    // 鼠标悬停时是否暂停滚动
    type: Boolean,
    default: true,
  },
});

// 状态管理
const tableRef = ref(null);
const scrollTimer = ref(null); // 滚动计时器
const isPaused = ref(false); // 是否暂停滚动

const pageComputedData = computed(() => {
  return {
    ...props.pageData,
    total: props.tableData.length,
  };
});

// 自动滚动逻辑
// const startAutoScroll = () => {
//     // 清除之前的计时器
//     if (scrollTimer.value) clearInterval(scrollTimer.value);
//     const table = tableRef.value.layout.table.refs;

//     const tableWrapper = table.bodyWrapper.firstElementChild.firstElementChild;
//     scrollTimer.value = setInterval(() => {
//         if (isPaused.value) return;  // 暂停状态不滚动

//         nextTick(() => {
//             const tableBody = tableRef.value?.$el.querySelector('.el-table__body-wrapper');
//             if (!tableBody) {
//                 console.log('1111')
//                 return;
//             }

//             tableWrapper.scrollTop += 30
//             if (tableWrapper.clientHeight + tableWrapper.scrollTop >= tableWrapper.scrollHeight - 1) {

//                 tableWrapper.scrollTop = 0; // 回到顶部，实现循环

//             }
//             // const { scrollTop, scrollHeight, clientHeight } = tableBody;
//             // console.log(scrollTop, scrollHeight, clientHeight)
//             // // 当滚动到接近底部时，重置到顶部（循环滚动）
//             // if (scrollTop >= scrollHeight - clientHeight - 1) {
//             //     tableBody.scrollTop = 0;  // 回到顶部
//             // } else {
//             //     tableBody.scrollTop += 1;  // 每次滚动1px
//             // }
//         });
//     }, 1000);
// };

const startAutoScroll = () => {
  if (scrollTimer.value) {
    cancelAnimationFrame(scrollTimer.value);
  }

  const table = tableRef.value.layout.table.refs;
  const tableWrapper = table.bodyWrapper.firstElementChild.firstElementChild;

  let lastScrollTime = 0;
  const scrollInterval = 1000; // 滚动间隔
  const scrollDistance = 30; // 每次滚动距离
  let isAnimating = false;
  // 动画循环
  const animateScroll = (timestamp) => {
    if (isPaused.value) {
      scrollTimer.value = requestAnimationFrame(animateScroll);
      return;
    }

    // 控制滚动频率
    if (!lastScrollTime) lastScrollTime = timestamp;
    const elapsed = timestamp - lastScrollTime; // 计算距离上次滚动的时间间隔

    if (elapsed >= scrollInterval && !isAnimating) {
      // 达到滚动间隔且没有正在进行的动画
      lastScrollTime = timestamp;
      isAnimating = true;

      const startScrollTop = tableWrapper.scrollTop;
      let targetScrollTop = startScrollTop + scrollDistance;

      // 检查是否到达底部 可视区域高度+已滚动高度》=总的高度
      if (
        tableWrapper.clientHeight + targetScrollTop >=
        tableWrapper.scrollHeight - 1
      ) {
        targetScrollTop = 0;
      }

      // 执行平滑滚动动画
      const animateStep = (currentTime) => {
        const animationElapsed = currentTime - timestamp;
        const progress = Math.min(animationElapsed / 300, 1); // 300ms 动画时长

        // 缓动函数
        const ease = 1 - (1 - progress) ** 3;
        const currentScroll =
          startScrollTop + (targetScrollTop - startScrollTop) * ease;

        tableWrapper.scrollTop = currentScroll;

        if (progress < 1) {
          requestAnimationFrame(animateStep);
        } else {
          isAnimating = false;
        }
      };

      requestAnimationFrame(animateStep);
    }

    scrollTimer.value = requestAnimationFrame(animateScroll);
  };

  scrollTimer.value = requestAnimationFrame(animateScroll);
};
const emit = defineEmits([
  'pageChange',
  'downloadFile',
  'select',
  'sortChange',
]);
// 暂停/恢复滚动
const toggleScroll = (pause) => {
  isPaused.value = pause;
};

// 组件挂载时初始化滚动
onMounted(() => {
  // 确保表格渲染完成后再开始滚动
  nextTick(() => {
    startAutoScroll();
  });
});

// 组件卸载时清理计时器
onUnmounted(() => {
  if (scrollTimer.value) {
    clearInterval(scrollTimer.value);
  }
});

// 监听数据变化，重新初始化滚动
watch(
  () => props.tableData,
  () => {
    nextTick(() => {
      // 数据变化后回到顶部重新滚动
      const tableBody = tableRef.value?.$el.querySelector(
        '.el-table__body-wrapper',
      );
      if (tableBody) {
        tableBody.scrollTop = 0;
      }
      startAutoScroll();
    });
  },
);

// 暂停滚动
if (props.pauseOnHover) {
  watch(tableRef, (newVal) => {
    if (newVal) {
      const tableEl = newVal.$el;
      tableEl.addEventListener('mouseenter', () => toggleScroll(true));
      tableEl.addEventListener('mouseleave', () => toggleScroll(false));
    }
  });
}
const pageSizes = [2, 10, 20, 50];
// 最小页数
const min = computed(() => {
  return props.pageData.total > 0 ? 1 : 0;
});
// 最大页数
const max = computed(() => {
  return Math.ceil(props.pageData.total / props.pageData.pageSize || 1);
});
const handleSizeChange = (val) => {
  emit('pageChange', { pageSize: val });
};
const handleChange = (val) => {
  if (val && val > max.value) return;
  emit('pageChange', { pageNum: val });
};
</script>

<style scoped lang="scss">
.auto-loop-table {
  width: 100%;
  height: 100%;
  // height: calc(100% - 2.5rem);
  // max-width: 1200px;
  display: flex;
  flex-direction: column;
  // margin: 20px auto;
  padding: 12px 0;

  .normal-table {
    width: 100%;
    // height: 100% !important;
    flex: 1;
    overflow: auto;
    --el-table-header-bg-color: #c0dcf6;
    --el-table-header-text-color: #000;
    --el-table-border: 0;
    // border: 1px solid #c6e2ff;

    :deep(.el-table__cell) {
      text-align: left;
    }

    // :deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell){
    //     background: #f3f8fd !important;
    // }
    --el-fill-color-lighter: #f3f8fd !important;

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
    margin-top: 10px;
  }
}

/* 美化滚动条 */
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

// .normal-pagination {
//   display: flex;
//   justify-content: space-between;
//   margin-top: 10px;
// }

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
:deep(.el-table__body-wrapper) {
  scroll-behavior: smooth;
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

.ctable-wrapper {
  height: 100%;
}

.iconfont {
  color: #3a96fe;
  margin-left: 15px;
  cursor: pointer;
}
</style>
