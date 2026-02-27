<template>
  <dh-dialog
    :title="title"
    :model-value="modelValue"
    width="500px"
    @update:model-value="handleCancel"
    @opened="onOpened"
    @closed="onClosed"
  >
    <div v-loading="loading || submitting" class="dialog-content">
      <SuperForm
        ref="formRef"
        v-model="formData"
        :schema="formSchema"
        :cols="1"
        label-width="90px"
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
import { cloneDeep } from 'lodash-es';
// 【重点修改】不使用统一导出，直接导入 add 和 update 的方法
import { addUserApi, updateUserApi } from '@/apis/modules/system/user';

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '编辑用户信息' },
  detailData: { type: Object, default: () => null },
});

const emit = defineEmits(['update:modelValue', 'success']);

// #region 1. 表单初始化与 Schema 配置
const getInitialForm = () => ({
  id: undefined,
  username: '',
  password: '',
  deptId: undefined,
});

const formData = reactive(getInitialForm());

const isEdit = computed(() => !!formData.id);

const formSchema = computed(() => [
  {
    label: '用户名',
    prop: 'username',
    type: 'input',
    rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  },
  {
    label: '密码',
    prop: 'password',
    type: 'input',
    props: {
      type: 'password',
      showPassword: true,
      placeholder: isEdit.value ? '留空则不修改密码' : '默认初始密码: 123456',
    },
  },
  {
    label: '部门ID',
    prop: 'deptId',
    type: 'number',
    props: { min: 1, placeholder: '请输入部门ID' },
  },
]);
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

    const payload = { ...formData };
    if (!payload.password) {
      delete payload.password;
    }

    // 【重点修改】通过判断 isEdit 状态，分别调用引入的对应 API 函数
    if (isEdit.value) {
      await updateUserApi(payload);
    } else {
      await addUserApi(payload);
    }

    ElMessage.success('保存成功');
    emit('success');
    handleCancel();
  } catch (err) {
    console.error('保存失败:', err);
  } finally {
    submitting.value = false;
  }
};

/** 弹窗打开：回显 */
const onOpened = () => {
  if (props.detailData) {
    Object.assign(formData, cloneDeep(props.detailData));
    formData.password = ''; // 安全起见，修改时不回显密码
  }
};

/** 弹窗关闭：重置 */
const onClosed = () => {
  Object.assign(formData, getInitialForm());
  formRef.value?.resetFields();
};

const handleCancel = () => emit('update:modelValue', false);

const handleReset = () => {
  formRef.value?.resetFields();
  if (props.detailData) {
    Object.assign(formData, cloneDeep(props.detailData));
    formData.password = '';
  } else {
    Object.assign(formData, getInitialForm());
  }
};
// #endregion
</script>

<style lang="scss" scoped>
.dialog-content {
  padding: 10px 20px;
  max-height: 65vh;
  overflow-y: auto;
}
</style>
