<template>
  <dh-dialog ref="dialogRef" :title="props.title">
    <div class="edit-dialog-main">
      <super-form
        ref="formRef"
        :model-value="formData"
        :schema="formSchema"
        :cols="4"
      >
        <!-- 表单底部按钮插槽 -->
        <template #footer="{ validate }">
          <div class="dialog-footer-center">
            <el-button @click="dialogRef.close()">取消</el-button>
            <el-button type="primary" @click="() => confirm(validate)">
              确认
            </el-button>
          </div>
        </template>
      </super-form>
    </div>
  </dh-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { type TableRowData } from '../index';

interface Prop {
  title: string;
  data: TableRowData;
}

const props = withDefaults(defineProps<Prop>(), {
  title: '',
});
const emit = defineEmits(['confirm']);
const dialogRef = ref();

// 表单引用
const formRef = ref();

// 表单数据（与原逻辑保持一致）
const formData = reactive({
  mgtOrgCode: '',
  qualificationName: '',
  applicablePost: '',
  qualificationLevel: '',
  issuingAuthority: '',
  validityPeriod: '',
  reviewReminderCycle: '',
  status: '',
  validityPeriodUnit: '年',
});

const formSchema = [
  {
    prop: 'mgtOrgCode',
    label: '申诉人',
    type: 'choose-unit',
    placeholder: '请输入供电单位',
    rules: [{ required: true, message: '请输入任务类型', trigger: 'blur' }],
  },
  {
    prop: 'qualificationName',
    label: '部门',
    type: 'input',
    placeholder: '请输入资质名称',
  },
  {
    prop: 'applicablePost',
    label: '班组',
    type: 'input',
    placeholder: '请输入适用岗位',
  },
  {
    prop: 'qualificationLevel',
    label: '岗位',
    type: 'input',
    placeholder: '请输入资质等级',
  },
  {
    prop: 'issuingAuthority',
    label: '申诉说明',
    type: 'input',
    placeholder: '请输入颁发机构',
  },
  {
    prop: 'validityPeriod',
    label: '关联场景',
    type: 'input',
  },
  {
    prop: 'reviewReminderCycle',
    label: '分值',
    type: 'input',
    placeholder: '请输入复审提醒周期',
  },
  {
    prop: 'status',
    label: '申诉时间',
    type: 'input',
    placeholder: '请输入状态',
  },
];

// 确认提交
function confirm(validate: () => Promise<boolean>) {
  validate().then((valid) => {
    if (valid) {
      emit('confirm', formData);
      dialogRef.value.close();
    }
  });
}

// 数据初始化
function initData() {
  if (props.title === '新增') {
    Object.assign(formData, props.data);
  } else if (props.title === '编辑') {
    Object.assign(formData, props.data);
  }
}

onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
.flex-row {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.dialog-footer-center {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
