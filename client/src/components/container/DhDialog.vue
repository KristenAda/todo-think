<template>
  <div>
    <el-dialog
      ref="dialogRef"
      class="dh-dialog"
      v-bind="$attrs"
      :draggable="true"
      :align-center="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      append-to-body
      :class="[
        isBodyScroll ? 'is-body-scroll' : '',
        isFullHeight ? 'is-full-height' : '',
      ]"
      @opened="handleOpened"
      @close="handleClose"
    >
      <slot></slot>
      <template #header>
        <div role="heading" class="el-dialog__title">
          <!-- <el-icon><Document /></el-icon> -->
          <!-- <i class="fa fa-fw fa-paper-plane"></i> -->
          <slot v-if="slots.title" name="title"></slot>
          <span v-else>{{ title }}</span>
        </div>
      </template>
      <template #footer>
        <slot name="footer"></slot>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// #region 引用
import { Document } from '@element-plus/icons-vue';
// #endregion

// #region props/emit
defineProps({
  /**
   * 弹窗标题
   */
  title: {
    type: String,
    default: null,
  },
});
const emit = defineEmits(['update:modelValue', 'close']);
// #endregion

// #region 变量/常量

const slots = useSlots(); // 弹窗插槽
const dialogRef = ref(); // 弹窗实例
const isBodyScroll = ref(false); // 是否为body滚动弹窗（即弹窗内容超出body高度）
const isFullHeight = ref(false); // 是否为全屏弹窗（即弹窗内容超出弹窗高度）
// #endregion

// #region 业务方法

/**
 * 处理固定表头相关
 */
const handleFixHeaderTable = () => {
  if (!dialogRef.value || !dialogRef.value.dialogContentRef) {
    return;
  }
  // 处理前先将弹窗高度初始化（即去掉height，仅设置max-height）
  isFullHeight.value = false;
  // 待样式生效后，之下下列计算
  nextTick(() => {
    // 判断是否为固定表头列表的弹窗
    const dialogContentRefChildren =
      dialogRef.value.dialogContentRef.$el.children;
    if (dialogContentRefChildren && dialogContentRefChildren.length > 0) {
      const elDialogBody = Array.from(dialogContentRefChildren).find((item) => {
        return item.classList.contains('el-dialog__body');
      });
      if (elDialogBody.children && elDialogBody.children.length > 0) {
        const fixedHeaderTableFrame = Array.from(elDialogBody.children).find(
          (item) => {
            return item.classList.contains('dh-fixed-header-table-frame__main');
          },
        );
        // 如果无需设置固定表头，则直接设置纵向滚动条即可
        if (!fixedHeaderTableFrame) {
          isBodyScroll.value = true;
          return;
        }
        isBodyScroll.value = false;
        // 获取FrameMainHeight的高度
        const fixedHeaderTableFrameHeight = fixedHeaderTableFrame.clientHeight;

        const elDialogHeader = Array.from(dialogContentRefChildren).find(
          (item) => {
            return item.classList.contains('el-dialog__header');
          },
        );
        const elDialogFooter = Array.from(dialogContentRefChildren).find(
          (item) => {
            return item.classList.contains('el-dialog__footer');
          },
        );
        // 如果FrameMainHeight的高度 > 页面高度 - 40(外部margin) - 15(padding-bottom) - 10(header-margin-bottom) - 弹窗头部高度 - 弹窗底部高度
        // 则设置is - full - height（弹窗定高 > 以触发flex布局的高度继承）
        if (
          fixedHeaderTableFrameHeight >=
          document.body.clientHeight -
            40 -
            15 -
            10 -
            (elDialogHeader?.clientHeight || 0) -
            (elDialogFooter?.clientHeight || 0)
        ) {
          isFullHeight.value = true;
        } else {
          isFullHeight.value = false;
        }
      }
    }
  });
};

onMounted(() => {
  window.addEventListener('resize', () => {
    handleFixHeaderTable();
  });
});

/**
 * 打开事件
 */
const handleOpened = () => {
  handleFixHeaderTable();
};

/**
 * 关闭事件（emit方式使用）
 */
const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};
// #endregion

// #region 生命周期
// 暴露方法（外部使用ref调用）
defineExpose({ close: handleClose });
// #endregion
</script>

<style lang="scss">
:deep(.el-overlay-dialog) {
  display: flex;
  align-content: center;
  align-items: center;
  overflow: hidden !important;
}
.dh-dialog {
  &.el-dialog {
    display: flex;
    flex-direction: column;
    max-height: calc(100% - 40px);
    padding-top: 0;
    padding-left: 0;
    padding-right: 0;
    padding-right: 0;
    padding-bottom: 15px;
    margin: auto !important;
    border-radius: 8px;
    .el-dialog__header {
      padding: 10px;
      border-radius: 8px 8px 0 0;
      background-color: #c6e2ff;
    }

    .el-dialog__title {
      display: flex;
      gap: 4px;
      font-weight: bold;
      font-size: 15px !important;
      padding-left: 6px;
      .fa {
        font-size: 12px;
      }
    }

    &.is-full-height {
      height: calc(100% - 40px);
    }

    .el-dialog__header {
      position: relative;
      padding: 10px 8px;
      margin-bottom: 10px;
      cursor: default !important;

      > .el-dialog__title {
        display: flex;
        align-items: center;

        > .el-icon {
          margin-right: 5px;
          color: var(--el-color-primary);
        }
      }
    }

    .el-dialog__body {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      padding: 0 15px !important;
      overflow: hidden !important;
      font-size: var(--el-font-size-base) !important;
    }

    &.is-body-scroll .el-dialog__body {
      overflow-y: auto !important;
    }

    .el-dialog__body .dh-fixed-header-table-frame__main {
      height: 100%;
    }
    .el-dialog__close {
      color: var(--el-color-grey-dark);
    }
    .el-dialog__headerbtn:focus .el-dialog__close,
    .el-dialog__headerbtn:hover .el-dialog__close {
      color: var(--el-color-danger-dark-2) !important;
      transform: scale(1.2);
    }

    .el-dialog__footer {
      padding-top: 15px !important;
      text-align: center !important;
      // padding-right: 30px;
    }

    .el-dialog__footer > button {
      margin-left: 15px !important;
      min-width: 100px;

      // &:last-child {
      //   margin-right: 15px !important;
      // }
    }
  }
}
</style>
