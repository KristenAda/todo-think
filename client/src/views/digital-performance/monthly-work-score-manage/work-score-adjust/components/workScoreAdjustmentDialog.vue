<template>
  <dh-dialog ref="dialogRef" :title="props.title">
    <div class="appeal-dialog-main">
      <super-form
        v-if="props.showBasicForm"
        ref="formRef1"
        :model-value="formData"
        :schema="formSchema"
        :cols="4"
      >
      </super-form>

      <super-form
        v-if="props.showExtraForm"
        ref="formRef2"
        :model-value="formData2"
        :schema="formSchema2"
        :cols="4"
      >
        <template #totalScore>
          <div class="flex-row">
            <div class="num">0</div>
            分
          </div>
        </template>
      </super-form>

      <div v-if="props.showAdjustHistory" class="common-title">
        <c-title name="当月调整历史"></c-title>
      </div>

      <c-table
        v-if="props.showAdjustTable"
        style="max-height: 350px"
        :headers="tableHeader"
        :loading="loading"
        :table-options="{ data: tableData }"
        :border="true"
        :page-data="pageData"
        :show-index="true"
        :show-excel="false"
        @page-change="handlePage"
      >
      </c-table>
    </div>
    <!-- 表单底部按钮插槽 -->
    <template #footer>
      <div class="dialog-footer-center">
        <el-button @click="dialogRef.close()">取消</el-button>
        <el-button type="primary" @click="confirm"> 确认 </el-button>
      </div>
    </template>
  </dh-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';

import { type TableRowData } from '../index';

//= ========== 类型定义 ===========
interface Prop {
  title: string;
  data: TableRowData;
  // 第一个super-form显隐
  showBasicForm: boolean;
  // 控制第一个super-form禁用状态
  basicFormDisabled: boolean;
  // 控制第二个super-form（额外加减分）显隐
  showExtraForm: boolean;
  // 控制第二个super-form禁用状态
  extraFormDisabled: boolean;
  // 控制调整历史表格显隐
  showAdjustTable: boolean;
  // 控制调整历史标题显隐
  showAdjustHistory: boolean;
  // 控制第一个表单姓名是否禁用
  nameInput: boolean;
}

//= ========== Props 与 Emit 定义 ===========
const props = withDefaults(defineProps<Prop>(), {
  title: '',
  showBasicForm: true,
  basicFormDisabled: true,
  showExtraForm: true,
  extraFormDisabled: false,
  showAdjustTable: true,
  showAdjustHistory: true,
  nameInput: true,
});
const emit = defineEmits(['confirm']);

//= ========== 组件引用与基础状态 ===========
// 弹窗引用
const dialogRef = ref();
// 表格加载状态
const loading = ref(false);
// 表单引用（两个form分别定义ref）
const formRef1 = ref();
const formRef2 = ref();
// 表格数据
const tableData = ref([]);

//= ========== 表格列配置 ===========
const tableHeader = [
  {
    prop: 'extraBonus',
    label: '额外加分',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'extraDeduction',
    label: '额外减分',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'totalScore',
    label: '合计',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'adjustmentDescription',
    label: '加减分说明',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'adjustmentTime',
    label: '调整时间',
    'show-overflow-tooltip': true,
    align: 'center',
  },
];

//= ========== 分页相关配置与逻辑 ===========
// 分页数据
const pageData = reactive({
  pageSize: 10,
  pageNo: 1,
  total: 0,
});

// 分页切换触发：更新分页参数并重新获取数据
const handlePage = (val: PageProp) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};

//= ========== 业务逻辑函数 ===========
// 获取表格数据
const getTableData = async () => {
  loading.value = true;
  try {
    // 补充接口请求逻辑
  } catch (error) {
    console.error('获取数据失败：', error);
  } finally {
    loading.value = false;
  }
};

// 确认提交
function confirm() {
  emit('confirm');
}

// 数据初始化：根据弹窗标题（新增/编辑）赋值表单数据
function initData() {
  if (props.title === '新增' || props.title === '编辑') {
    Object.assign(formData, props.data);
    Object.assign(formData2, props.data);
  }
}

//= ========== 表单相关配置 ===========
// 表单数据1
const formData = reactive({
  mgtOrgCode: '',
  yearMonth: '',
  userName: '',
  teamType: '',
  teamName: '',
  position: '',
  jobPost: '',
  currentMonthTotalScore: '',
  actualCurrentMonthTotalScore: '',
  latestAdjustmentTime: '',
});

// 表单数据2
const formData2 = reactive({
  extraBonus: '',
  extraDeduction: '',
  totalScore: '',
  adjustmentDescription: '',
});

// 表单schema1：基本信息
const formSchema = [
  { type: 'section', label: '基本信息' },
  {
    prop: 'yearMonth',
    label: '年月',
    type: 'input',
    disabled: () => props.basicFormDisabled,
  },
  {
    prop: 'userName',
    label: '姓名',
    type: 'input',
    disabled: () => props.basicFormDisabled && props.nameInput,
  },
  {
    prop: 'teamType',
    label: '班组类型',
    type: 'input',
    disabled: () => props.basicFormDisabled,
  },
  {
    prop: 'teamName',
    label: '班组名称',
    type: 'input',
    disabled: () => props.basicFormDisabled,
  },
  {
    prop: 'position',
    label: '职务',
    type: 'input',
    disabled: () => props.basicFormDisabled,
  },
  {
    prop: 'jobPost',
    label: '岗位',
    type: 'input',
    disabled: () => props.basicFormDisabled,
  },
  {
    prop: 'currentMonthTotalScore',
    label: '当月总分',
    type: 'input',
    disabled: () => props.basicFormDisabled,
  },
  {
    prop: 'actualCurrentMonthTotalScore',
    label: '实际当月总分',
    type: 'input',
    disabled: () => props.basicFormDisabled,
  },
  {
    prop: 'latestAdjustmentTime',
    label: '最新调整时间',
    type: 'input',
    disabled: () => props.basicFormDisabled,
  },
];

// 表单schema2：额外加减分
const formSchema2 = [
  { type: 'section', label: '额外加减分' },
  {
    prop: 'extraBonus',
    label: '额外加分',
    type: 'input',
    props: {
      placeholder: '不输入默认为0',
    },
    disabled: () => props.extraFormDisabled,
  },
  {
    prop: 'extraDeduction',
    label: '额外减分',
    type: 'input',
    props: {
      placeholder: '不输入默认为0',
    },
    disabled: () => props.extraFormDisabled,
  },
  {
    prop: 'totalScore',
    label: '合计',
    type: 'slot',
  },
  {
    prop: 'adjustmentDescription',
    label: '加减分说明',
    disabled: () => props.extraFormDisabled,
    span: 24,
    props: {
      rows: 3,
      type: 'textarea',
    },
    type: 'textarea',
  },
];

//= ========== 初始化逻辑 ===========
onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
.num {
  color: red;
  margin-right: 20px;
}
:deep(.component-wrapper) {
  width: 100% !important;
}
</style>
