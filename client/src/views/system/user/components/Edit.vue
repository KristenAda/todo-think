<template>
  <dh-dialog
    :title="title"
    :model-value="modelValue"
    width="800px"
    @update:model-value="handleCancel"
    @opened="onOpened"
    @closed="onClosed"
  >
    <div v-loading="loading || submitting" class="dialog-content">
      <SuperForm
        ref="formRef"
        v-model="formData"
        :schema="formSchema"
        :cols="2"
        label-width="110px"
      />
    </div>

    <template #footer>
      <el-button @click="handleCancel">取 消</el-button>
      <el-button @click="handleReset">重 置</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        保 存
      </el-button>
    </template>
  </dh-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { cloneDeep } from 'lodash-es';
import { ElMessage } from 'element-plus';
// import { saveApi } from '@/apis/modules/example';

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '编辑信息' },
  detailData: { type: Object, default: () => null },
});

const emit = defineEmits(['update:modelValue', 'success']);

// #region 1. 表单初始化与 Schema 配置
const getInitialForm = () => ({
  name: '',
  type: '',
  count: 0,
  status: true,
  tags: [],
  targetUnit: '',
  manager: '',
  remark: '',
});

const formData = reactive(getInitialForm());

const formSchema = [
  { type: 'section', label: '核心信息', subLabel: '基础配置项' },
  {
    label: '名称',
    prop: 'name',
    type: 'input',
    rules: [{ required: true, message: '必填' }],
  },
  {
    label: '分类',
    prop: 'type',
    type: 'select',
    options: [
      { label: '选项A', value: 'A' },
      { label: '选项B', value: 'B' },
    ],
  },
  { label: '数量', prop: 'count', type: 'number', props: { min: 0 } },
  { label: '启用', prop: 'status', type: 'switch' },

  { type: 'section', label: '业务关联', subLabel: '关联组织与人员' },
  { label: '所属单位', prop: 'targetUnit', type: 'choose-unit', span: 24 },
  { label: '负责人', prop: 'manager', type: 'choose-user', span: 24 },
  {
    label: '标签',
    prop: 'tags',
    type: 'select',
    props: { multiple: true },
    options: [{ label: '标签1', value: '1' }],
  },

  { type: 'section', label: '其他' },
  {
    label: '备注',
    prop: 'remark',
    type: 'textarea',
    span: 24,
    props: { rows: 3 },
  },
];
// #endregion

// #region 2. 核心逻辑
const formRef = ref(null);
const submitting = ref(false);
const loading = ref(false);

/** 提交保存 */
const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    submitting.value = true;

    // const res = await saveApi(formData);
    // 模拟接口响应
    setTimeout(() => {
      ElMessage.success('保存成功');
      emit('success');
      handleCancel();
      submitting.value = false;
    }, 500);
  } catch (err) {
    console.error('Validate Failed:', err);
  }
};

/** 弹窗打开：回显 */
const onOpened = () => {
  if (props.detailData) {
    Object.assign(formData, cloneDeep(props.detailData));
  }
};

/** 弹窗关闭：重置 */
const onClosed = () => {
  Object.assign(formData, getInitialForm());
  formRef.value?.resetFields();
};

const handleCancel = () => emit('update:modelValue', false);
const handleReset = () => formRef.value?.resetFields();
// #endregion
</script>

<style lang="scss" scoped>
.dialog-content {
  padding: 10px 20px;
  max-height: 65vh;
  overflow-y: auto;
}
</style>
