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
            <el-form-item label="每日执行时间" prop="excuteTime">
              <el-time-picker
                v-model="formData.excuteTime"
                value-format="HH:mm:ss"
                placeholder="选择时间"
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
import { scheduledTaskConfAddScheduledTaskConf } from '@/apis/modules/digital-performance/daily-work-point-management/daily-work-point-calculation';
import { SUCCESS_CODE } from '@/configs/const/basic';

const props = defineProps({
  date: {
    type: String,
    default: '',
  },
});
// const emits = defineEmits(['confirm', 'close']);

const dialogRef = ref();
const formRef = ref();
const submitting = ref(false);

// 表单初始数据
const formData = reactive({
  excuteTime: '',
});

// 校验规则
const rules = {
  excuteTime: [
    { required: true, message: '请选择执行时间', trigger: 'change' },
  ],
};

const onOpened = () => {
  formData.date = props.date;
};

const reset = () => {
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    const params = {
      excuteTime: formData.excuteTime,
    };
    const res = await scheduledTaskConfAddScheduledTaskConf(params);
    if (res.code === SUCCESS_CODE) {
      ElMessage.success(res.msg);
    }
    submitting.value = false;
    dialogRef.value.close();
  } catch (error) {
    console.error('Validate Error:', error);
  } finally {
    submitting.value = false;
  }
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
