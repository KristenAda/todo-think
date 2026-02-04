<!--
 * @description: Web端分页组件
 * @Author: TFG
 * @Date: 2026-01-14
 * @remark：--
 -->
<template>
  <ul class="table-bottom">
    <li class="left-content"></li>
    <li class="table-pager">
      <el-button
        :type="disabledFirst ? 'default' : 'primary'"
        plain
        :disabled="disabledFirst"
        @click="goFirst"
        >首页</el-button
      >
      <el-button
        :type="disabledPrev ? 'default' : 'primary'"
        plain
        :disabled="disabledPrev"
        @click="goPrev"
        >上一页</el-button
      >
      <label class="pager-cur-total-page"
        >{{ currentPageIndex }}/{{ totalPageCount }}</label
      >
      <el-button
        :type="disabledNext ? 'default' : 'primary'"
        plain
        :disabled="disabledNext"
        @click="goNext"
        >下一页</el-button
      >
      <el-button
        :type="disabledLast ? 'default' : 'primary'"
        plain
        :disabled="disabledLast"
        @click="goLast"
        >尾页</el-button
      >
      <el-input
        v-model="pagerJumpValue"
        type="number"
        class="pager-input"
        @keyup.enter="pagerJump"
      />
      <el-button
        :type="disabledPagerJump ? 'default' : 'primary'"
        plain
        :disabled="disabledPagerJump"
        @click="pagerJump"
        >跳转</el-button
      >
      <span
        >每页显示<el-select
          v-model="pageSize"
          class="pager-change-size"
          placeholder="请选择"
          @change="pageSizesChange"
        >
          <el-option
            v-for="item in pageSizes"
            :key="item"
            :label="item"
            :value="item"
          ></el-option></el-select
        >条</span
      >
      <span
        >共<i class="pager-total-count">{{ totalRowCount ?? 0 }}</i
        >条记录</span
      >
    </li>
  </ul>
</template>

<script setup>
// #region 引用

// #endregion

// #region props/emit

const props = defineProps({
  // 数据总条数（必传）
  totalRowCount: {
    type: Number,
    required: true,
  },
  // 当前页（非必传）
  currentPageIndex: {
    type: Number,
    default: 1,
  },
  // 分页大小数组（非必传）
  pageSizes: {
    type: Array,
    default: () => {
      return [5, 10, 20, 50, 100, 500];
    },
  },
  // 分页大小（非必传）
  pageSize: {
    type: Number,
    default: 20,
  },
});

const emit = defineEmits(['onChanged']);

// #endregion

// #region 变量/常量

// v-model：跳转到
const pagerJumpValue = ref();
// 分页大小
const pageSize = ref(props.pageSize);
// 当前页
const currentPageIndex = ref(props.currentPageIndex);
// 总页数（根据总行数与分页大小自动计算）
const totalPageCount = computed(() => {
  let result = Math.ceil(props.totalRowCount / pageSize.value);
  result = result === 0 || !result ? 1 : result;
  return result;
});

// 按钮禁用控制：首页
const disabledFirst = computed(() => {
  return currentPageIndex.value === 1 || totalPageCount.value === 1;
});
// 按钮禁用控制：尾页
const disabledLast = computed(() => {
  return (
    currentPageIndex.value === totalPageCount.value ||
    totalPageCount.value === 1
  );
});
// 按钮禁用控制：上一页
const disabledPrev = computed(() => {
  return currentPageIndex.value === 1 || totalPageCount.value === 1;
});
// 按钮禁用控制：下一页
const disabledNext = computed(() => {
  return (
    currentPageIndex.value === totalPageCount.value ||
    totalPageCount.value === 1
  );
});
// 按钮禁用控制：跳转
const disabledPagerJump = computed(() => {
  return totalPageCount.value === 1;
});

// #endregion

// #region 业务方法

/**
 * 回传事件
 * @param {string} tag 回传标识
 */
const emitOnChanged = (tag) => {
  emit('onChanged', {
    currentPageIndex: currentPageIndex.value,
    totalPageCount: totalPageCount.value,
    pageSize: pageSize.value,
    tag,
  });
};

/**
 * 提供外部：更改当前页
 * @param {number} value 值
 */
const updatePageIndex = (value) => {
  currentPageIndex.value = value;
  emitOnChanged('updatePageIndex');
};

/**
 * 提供外部：更改每页显示条数
 * @param {*} value 值
 * @param {*} resetCurrentPageIndexFlag 是否重置当前页
 */
const updatePageSize = (value, resetCurrentPageIndexFlag) => {
  pageSize.value = value;
  if (!resetCurrentPageIndexFlag) {
    currentPageIndex.value = 1;
  }
  emitOnChanged('updatePageSize');
};

// 暴露方法
defineExpose({ updatePageIndex, updatePageSize });

/**
 * 切换每页显示条数
 */
const pageSizesChange = () => {
  currentPageIndex.value = 1;
  emitOnChanged('pageSizesChange');
};
/**
 * 跳转首页
 */
const goFirst = () => {
  currentPageIndex.value = 1;
  emitOnChanged('goFirst');
};
/**
 * 跳转尾页
 */
const goLast = () => {
  currentPageIndex.value = totalPageCount.value;
  emitOnChanged('goLast');
};
/**
 * 跳转上一页
 */
const goPrev = () => {
  if (currentPageIndex.value === 1) {
    return;
  }
  currentPageIndex.value -= 1;
  emitOnChanged('goPrev');
};
/**
 * 跳转下一页
 */
const goNext = () => {
  if (currentPageIndex.value >= totalPageCount.value) {
    return;
  }
  currentPageIndex.value += 1;
  emitOnChanged('goNext');
};
/**
 * 跳转自定义页码
 */
const pagerJump = () => {
  const jumpValue = parseInt(pagerJumpValue.value, 10);
  if (jumpValue && jumpValue > 0 && jumpValue <= totalPageCount.value) {
    currentPageIndex.value = jumpValue;
    emitOnChanged('pagerJump');
  }
  pagerJumpValue.value = null;
};

// #endregion
</script>

<style lang="scss" scoped>
/* 数字输入框样式沉淀 */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  appearance: none !important;
}

input[type='number'] {
  appearance: textfield;
}

/* 分页样式 */
.table-bottom::after {
  display: block;
  clear: both;
  content: '';
}

.table-bottom .left-content {
  position: relative;
  float: left;
  padding: 0 8px 0 32px;
  margin: 8px 0;
  line-height: 32px;

  /* background: #e8f4ff; */
  background: var(--el-color-info-light-8);
  border-radius: 4px;
}

.table-bottom .left-content.text-tips {
  display: block !important;
  padding-left: 0;
  margin: 0;
  line-height: 32px;
  background: var(--el-color-white);
}

.table-bottom .left-content .bottom-tips {
  position: absolute;
  top: 0;
  left: 8px;
  width: 30px;
  height: 30px;
  background: var(--el-base-icons) -25px -113px;
}

.table-bottom .table-pager {
  float: right;
  padding: 8px 0 0;
}

.table-pager > * {
  margin-left: 8px;
  line-height: 30px;
}

.table-pager:first-child {
  margin-left: 0;
}

.table-pager > button {
  padding: 0 4px;
}

.table-pager .pager-input {
  width: 60px;
}

.table-pager .pager-change-size {
  width: 70px;
  margin: 0 3px;
  vertical-align: top;
}

.table-pager .pager-total-count {
  margin: 0 3px;
  color: var(--el-color-danger);
}
</style>
