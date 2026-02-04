<template>
  <dh-dialog v-model="exportDialogRef" title="导出" class="cDialog" width="30%">
    <div class="cDialog--content not-granted-textarea">
      <div style="display: flex; gap: 20px; flex-direction: column">
        <el-form label-width="auto">
          <el-form-item label="起始页">
            <el-input-number v-model="startPageNo" :min="1" :max="endPageNo" />
          </el-form-item>
          <el-form-item label="结束页">
            <el-input-number v-model="endPageNo" :min="startPageNo" />
          </el-form-item>
        </el-form>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" @click="exportDialogRefConfirmed">
        导出
      </el-button>
    </template>
  </dh-dialog>
</template>

<script lang="ts" setup>
// 接收父组件传入的结束页默认值，默认值为1
const props = defineProps({
  endPage: {
    type: Number,
    default: 1,
    validator: (value: number) => value >= 1,
  },
});

const exportDialogRef = ref(false);
const startPageNo = ref<number>(1); // 导出开始页码
// 使用父组件传入的endPage作为初始值，若无则使用默认值1
const endPageNo = ref<number>(1);
const emit = defineEmits(['export']);

watch(
  () => props.endPage,
  (newEndPage) => {
    if (newEndPage > 0) {
      endPageNo.value = newEndPage;
    } else {
      endPageNo.value = 1;
    }
  },
);

// 确认导出
function exportDialogRefConfirmed() {
  emit('export', {
    startPageNo: startPageNo.value,
    endPageNo: endPageNo.value,
  });
}

// 打开对话框
function openExportDialog() {
  exportDialogRef.value = true;
}

// 关闭对话框
function closeExportDialog() {
  exportDialogRef.value = false;
}

defineExpose({
  openExportDialog,
  closeExportDialog,
});
</script>
