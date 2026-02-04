<template>
  <dh-dialog ref="dialogRef" @opened="onOpened">
    <div class="edit-dialog-main">
      <SuperForm
        ref="formRef"
        v-model="formData"
        :schema="schema"
        :cols="2"
        label-width="120px"
      />
    </div>
    <template #footer>
      <el-button plain @click="handleCancel">取消</el-button>
      <el-button @click="reset">重置</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </dh-dialog>
</template>

<script setup>
import { saveQualificationTaskConfig } from '@/apis/modules/persona/required-dimension-config/qualification-task-config';

// #region props/emit
const props = defineProps({
  // 接收弹窗回显数据（新增编辑共用）
  info: {
    type: Object,
    default: () => ({}),
  },
});
const emits = defineEmits(['confirm', 'close']);
// #endregion

// #region 核心变量
const dialogRef = ref(); // 弹窗实例
const formRef = ref(null); // 表单实例
const submitting = ref(false); // 提交状态

// 表单数据模型（对应新增/编辑字段）
const formData = reactive({
  mgtOrgCode: '', // 供电单位
  taskType: '', // 任务类型
  validityPeriodUnit: '',
  qualification: [], // 所需资质（多选下拉，值为数组）
});

// 表单配置schema
const schema = [
  {
    label: '供电单位',
    prop: 'mgtOrgCode',
    type: 'choose-unit', // 供电单位默认使用输入框，如需下拉可自行修改type为select并添加options
  },
  {
    label: '任务类型',
    prop: 'taskType',
    type: 'input', // 明确指定为输入框
    rules: [{ required: true, message: '请输入任务类型', trigger: 'blur' }],
  },
  {
    label: '所需资质',
    prop: 'qualification',
    type: 'select', // 多选下拉
    span: 24, // 占满整行，提升体验
    props: {
      multiple: true, // 开启多选
      placeholder: '请选择所需资质',
    },
    // 示例选项，你可根据实际业务替换为接口请求或静态数据
    options: [
      { label: '资质A', value: 'A' },
      { label: '资质B', value: 'B' },
      { label: '资质C', value: 'C' },
    ],
    rules: [{ required: true, message: '请选择所需资质', trigger: 'change' }],
  },
];
// #endregion

// #region 核心方法
/**
 * 表单提交
 */
const submit = async () => {
  if (!formRef.value) return;

  try {
    // 表单校验
    await formRef.value.validate();
    submitting.value = true;
    // 调用保存接口
    const res = await saveQualificationTaskConfig(formData);
    if (res.code !== 200) {
      ElMessage.error(res.msg);
      return;
    }
    ElMessage.success('保存成功');
    dialogRef.value.close();
  } catch (error) {
    // ElMessage.error('表单校验失败，请检查输入');
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
  }
};

/**
 * 表单重置
 */
const reset = () => {
  if (formRef.value) {
    formRef.value.resetFields();
    ElMessage.info('表单已重置');
  }
};

/**
 * 取消弹窗
 */
const handleCancel = () => {
  dialogRef.value.close();
  emits('close');
};

/**
 * 弹窗打开事件（用于编辑时回显数据）
 */
const onOpened = () => {
  // 编辑场景：将传入的info数据赋值给表单
  if (props.info) {
    Object.assign(formData, props.info);
  }
};
// #endregion
</script>

<style lang="scss" scoped>
.edit-dialog-main {
  padding: 10px 0;
}
</style>
