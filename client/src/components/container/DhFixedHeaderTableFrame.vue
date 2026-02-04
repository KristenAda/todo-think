<template>
  <div class="dh-fixed-header-table-frame__main">
    <div class="dh-fixed-header-table-frame__upper">
      <div v-if="showSearch" class="dh-fixed-header-table-frame__search">
        <dh-section-search><slot name="search"></slot></dh-section-search>
      </div>

      <div v-if="showOperate" class="dh-fixed-header-table-frame__operate">
        <slot name="operate"></slot>
      </div>

      <div class="dh-fixed-header-table-frame__table">
        <slot></slot>
      </div>
    </div>

    <div v-if="showLowerArea" class="dh-fixed-header-table-frame__lower">
      <div
        v-if="showOperateBottom"
        class="dh-fixed-header-table-frame__operate"
      >
        <slot name="operate-bottom"></slot>
      </div>

      <div v-if="showPager" class="dh-fixed-header-table-frame__pager">
        <slot name="pager"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSlots, computed } from 'vue';

const slots = useSlots();

// 是否展示搜索区域
const showSearch = !!slots.search;
// 是否展示中间操作区 (默认 operate 插槽)
const showOperate = !!slots.operate;
// 是否展示底部操作区 (新增 operate-bottom 插槽)
const showOperateBottom = !!slots['operate-bottom'];
// 是否展示分页器区域
const showPager = !!slots.pager;

// 只有当下半部分有内容时，才渲染下半部分的容器
const showLowerArea = computed(() => showOperateBottom || showPager);

// 移除了 operateToBottom prop，完全由插槽控制
</script>

<style lang="scss" scoped>
.dh-fixed-header-table-frame__main {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 12px; // 上下区域之间的间距
  overflow: hidden;

  /* 上半部分：包含搜索、中间操作、表格 */
  .dh-fixed-header-table-frame__upper {
    flex: 1; // 占满剩余空间
    display: flex;
    flex-direction: column;
    gap: 12px; // 内部元素间距
    overflow: hidden; // 关键：防止内部撑开父容器，强制由表格处理滚动
    min-height: 0; // 配合 flex:1 在某些浏览器下的兼容性
  }

  /* 下半部分：包含底部操作、分页 */
  .dh-fixed-header-table-frame__lower {
    flex-shrink: 0; // 防止被压缩
    display: flex;
    flex-direction: column;
    gap: 12px;
    .dh-fixed-header-table-frame__operate {
      margin-bottom: 12px;
    }
  }
}

/* 搜索、操作、分页的通用防压缩设置 */
.dh-fixed-header-table-frame__search,
.dh-fixed-header-table-frame__operate,
.dh-fixed-header-table-frame__pager {
  flex-shrink: 0;
  flex: 0 0 auto;
}

/* 操作区样式 (中间和底部共用) */
.dh-fixed-header-table-frame__operate {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  /* 移除了 padding，改用 flex gap 控制间距，布局更精准 */
  :deep(.el-button) {
    min-width: 70px;
  }
}

/* 表格容器样式 */
.dh-fixed-header-table-frame__table {
  flex: 1; /* 自动填充剩余高度 */
  min-height: 0; /* 核心：允许内部内容溢出，从而触发 el-table 的滚动 */
  display: flex;
  flex-direction: column;
}

.dh-fixed-header-table-frame__table > :deep(.el-table) {
  height: 100%;
}
</style>
