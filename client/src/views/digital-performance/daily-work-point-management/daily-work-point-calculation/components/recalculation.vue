<template>
  <dh-dialog ref="dialogRef" @opened="onOpened">
    <div class="edit-dialog-main">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="核算时间" prop="date">
              <el-date-picker
                v-model="formData.date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="reset">重置</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit"
        >确定</el-button
      >
    </template>
  </dh-dialog>
</template>

<script setup>
const props = defineProps({
  date: {
    type: String,
    default: '',
  },
});
const emits = defineEmits(['confirm', 'close']);

const dialogRef = ref();
const formRef = ref();
const submitting = ref(false);

// 表单初始数据
const formData = reactive({
  date: '',
});

// 校验规则
const rules = {
  date: [{ required: true, message: '请选择核算时间', trigger: 'change' }],
};

const onOpened = () => {
  formData.date = props.date;
};

const reset = () => {
  formRef.value?.resetFields();
  formData.date = props.date;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    submitting.value = true;
  } catch (error) {
    console.error('Validate Error:', error);
  } finally {
    submitting.value = false;
  }
  dialogRef.value.close();
  emits('close');
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
