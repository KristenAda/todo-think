<template>
  <dh-dialog ref="dialogRef" :title="props.title">
    <div class="edit-dialog-main">
      <super-form
        ref="formRef"
        :model-value="formData"
        :schema="formSchema"
        :cols="4"
      >
        <!-- 有效期组合控件的自定义插槽 -->
        <template #validityPeriod="{ model, loading }">
          <div class="flex-row justify-between">
            <el-input
              v-model="model.validityPeriod"
              placeholder="请输入有效期"
              v-loading="loading"
            />
            <el-select
              style="width: 80px !important"
              v-model="model.validityPeriodUnit"
              placeholder="请选择"
              v-loading="loading"
            >
              <el-option
                v-for="item in validityPeriodUnitList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </template>

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
import { ValidityPeriod } from '@/configs/enums/qualification-info-management';
import { getEnumEntriesForElementUI } from '@/utils/common/enum-util';

// 有效期单位
const validityPeriodUnitList = getEnumEntriesForElementUI(ValidityPeriod);
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
    label: '供电单位',
    type: 'choose-unit',
    placeholder: '请输入供电单位',
    rules: [{ required: true, message: '请输入任务类型', trigger: 'blur' }],
  },
  {
    prop: 'qualificationName',
    label: '资质名称',
    type: 'input',
    placeholder: '请输入资质名称',
  },
  {
    prop: 'applicablePost',
    label: '适用岗位',
    type: 'input',
    placeholder: '请输入适用岗位',
  },
  {
    prop: 'qualificationLevel',
    label: '资质等级',
    type: 'input',
    placeholder: '请输入资质等级',
  },
  {
    prop: 'issuingAuthority',
    label: '颁发机构',
    type: 'input',
    placeholder: '请输入颁发机构',
  },
  {
    prop: 'validityPeriod',
    label: '有效期',
    type: 'slot',
  },
  {
    prop: 'reviewReminderCycle',
    label: '复审提醒周期',
    type: 'input',
    placeholder: '请输入复审提醒周期',
  },
  {
    prop: 'status',
    label: '状态',
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
    Object.assign(formData, {
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
  } else if (props.title === '编辑') {
    Object.assign(formData, {
      mgtOrgCode: props.data.mgtOrgCode,
      qualificationName: props.data.qualificationName,
      applicablePost: props.data.applicablePost,
      qualificationLevel: props.data.qualificationLevel,
      issuingAuthority: props.data.issuingAuthority,
      validityPeriod: props.data.validityPeriod,
      reviewReminderCycle: props.data.reviewReminderCycle,
      status: props.data.status,
      validityPeriodUnit: props.data.validityPeriodUnit,
    });
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
