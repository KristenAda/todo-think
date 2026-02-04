<template>
  <dh-dialog ref="dialogRef" :title="props.title">
    <div class="appeal-dialog-main">
      <super-form
        ref="formRef"
        :model-value="formData"
        :schema="formSchema1"
        :cols="3"
      >
      </super-form>
      <super-form
        ref="formRef"
        :model-value="formData"
        :schema="formSchema2"
        :cols="4"
      >
        <template #btnSlot>
          <el-space size="large">
            <el-button>重置</el-button>
            <el-button type="primary"> 查询 </el-button>
          </el-space>
        </template>
      </super-form>
      <div class="sum">合计工分：<span class="num">0</span> 分</div>
      <c-table
        style="max-height: 350px"
        :headers="tableHeader"
        :loading="loading"
        :table-options="{ data: tableData }"
        :border="true"
        :page-data="pageData"
        :show-index="true"
        :show-excel="false"
        :is-select="true"
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
import { FactorType } from '@/configs/enums/commons';
import { getEnumEntriesForElementUI } from '@/utils/common/enum-util';
import { type TableRowData } from '../index';

//= ========== 类型定义 ===========
interface Prop {
  title: string;
  edit: boolean;
  data?: TableRowData;
}

//= ========== Props 与 Emit 定义 ===========
const props = withDefaults(defineProps<Prop>(), {
  title: '',
  edit: false,
});
const emit = defineEmits(['confirm']);

//= ========== 组件引用与基础状态 ===========
// 弹窗引用
const dialogRef = ref();
// 表格加载状态
const loading = ref(false);
// 表单引用
const formRef = ref();
// 表格数据
const tableData = ref([]);

//= ========== 表格列配置 ===========
const tableHeader = [
  {
    prop: 'sceneType',
    label: '场景类型',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'sceneName',
    label: '场景名称',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'referenceValue',
    label: '参考值',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'measurementUnit',
    label: '计量单位',
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'workScore',
    label: '工分',
    sortable: true,
    'show-overflow-tooltip': true,
    align: 'center',
  },
  {
    prop: 'description',
    label: '说明',
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
// eslint-disable-next-line no-undef
const handlePage = (val: PageProp) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getTableData();
};

//= ========== 业务逻辑函数 ===========
// 获取表格数据：后续可补充接口请求逻辑
const getTableData = async () => {
  // 开启加载状态
  loading.value = true;
  try {
    // 补充接口请求逻辑
    // const res = await getQualificationList({
    //   ...searchQuery,
    //   pageSize: pageData.pageSize,
    //   pageNo: pageData.pageNo
    // });
    // tableData.value = res.data.list;
    // pageData.total = res.data.total;
  } catch (error) {
    console.error('获取数据失败：', error);
  } finally {
    // 关闭加载状态
    loading.value = false;
  }
};

// 确认提交
function confirm() {}

// 数据初始化：根据弹窗标题（新增/编辑）赋值表单数据
function initData() {
  if (props.title === '新增') {
    Object.assign(formData, props.data);
  } else if (props.title === '编辑') {
    Object.assign(formData, props.data);
  }
}

//= ========== 表单相关配置 ===========
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

// 表单schema1：基本信息
const formSchema1 = [
  { type: 'section', label: '基本信息' },
  {
    prop: 'qualificationName',
    label: '工单编号',
    type: 'input',
    placeholder: '请输入资质名称',
    disabled: () => props.edit,
  },
  {
    prop: 'applicablePost',
    label: '任务名称',
    type: 'input',
    placeholder: '请输入适用岗位',
    disabled: () => props.edit,
  },
  {
    prop: 'qualificationLevel',
    label: '申诉人',
    type: 'input',
    placeholder: '请输入资质等级',
    disabled: () => props.edit,
  },
  {
    prop: 'qualificationLevel',
    label: '申诉说明',
    span: 24,
    props: {
      rows: 3,
      type: 'textarea',
    },
    type: 'textarea',
    placeholder: '请输入资质等级',
  },
];

// 表单schema2：关联场景
const formSchema2 = [
  { type: 'section', label: '关联场景' },
  {
    prop: 'qualificationName',
    label: '场景类型',
    type: 'select',
    options: getEnumEntriesForElementUI(FactorType),
    placeholder: '请输入资质名称',
  },
  {
    prop: 'applicablePost',
    label: '场景名称',
    type: 'input',
    placeholder: '请输入适用岗位',
  },
  {
    prop: 'btnSlot',
    type: 'slot',
  },
];

//= ========== 初始化逻辑 ===========
onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
.sum {
  margin: 8px 0;
  .num {
    color: red;
  }
}
:deep(.component-wrapper) {
  width: 100% !important;
}
</style>
