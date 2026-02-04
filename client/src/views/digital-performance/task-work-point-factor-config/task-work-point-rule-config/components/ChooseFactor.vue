<template>
  <dh-dialog ref="dialogRef" title="选择关联因子" width="900px">
    <div class="choose-factor-container">
      <div class="filter-bar">
        <span class="label">因子类型：</span>
        <el-select
          v-model="filterType"
          placeholder="全部类型"
          clearable
          style="width: 200px"
          @change="handleSearch"
        >
          <el-option
            v-for="item in factorTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-model="filterName"
          placeholder="因子名称"
          style="width: 200px; margin-left: 10px"
          @keyup.enter="handleSearch"
        />
        <el-button
          type="primary"
          icon="search"
          plain
          style="margin-left: 10px"
          @click="handleSearch"
          >查询</el-button
        >
      </div>
      <div class="table-section">
        <c-table
          :headers="headers"
          :loading="loading"
          row-key="pOrderFactorId"
          :table-options="{ data: tableData }"
          :default-sort="{ prop: 'refScore', order: 'ascending' }"
          is-select
          :show-excel="false"
          :page-data="pageData"
          @select="handleSelectionChange"
          @page-change="handlePage"
          @sort-change="handleSortChange"
        />
      </div>
    </div>
    <template #footer>
      <el-button @click="dialogRef.close()">取消</el-button>
      <el-button
        type="primary"
        :disabled="!selection.length"
        @click="handleConfirm"
        >确定选择</el-button
      >
    </template>
  </dh-dialog>
</template>

<script setup>
import {
  getFactorConfigListForSelect,
  bindFactorsToTask,
} from '@/apis/modules/digital-performance/task-work-point-factor-config/task-work-point-rule-config';
import { getEnumEntriesForElementUI } from '@/utils/common/enum-util';
import { FactorType } from '@/configs/enums/commons';
import {
  ProcessStep,
  RegionType,
  TimeUnit,
} from '@/configs/enums/digital-performance';
import { SUCCESS_CODE } from '@/configs/const/basic';

const props = defineProps({
  typeCode: {
    type: String,
    default: '',
  },
  factorList: {
    type: Array,
    default: () => [],
  },
});

const emits = defineEmits(['confirm']);
const dialogRef = ref();
const loading = ref(false);
const tableData = ref([]);
const selection = ref([]);
const filterType = ref(''); // 这里现在存储的是 'DISTANCE' 等枚举值
const filterName = ref('');

// 生成下拉选项 [{label: '距离', value: 'DISTANCE'}, ...]
const factorTypeOptions = getEnumEntriesForElementUI(FactorType);

const factorIdList = computed(() =>
  props.factorList.map((item) => item.pOrderFactorId),
);

const pageData = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0,
  sortType: 'ascending',
  sortField: 'refScore',
});
/**
 * 通用解析器：处理后端返回的 JSON 字符串或普通字符串
 * @param val 接口返回的值
 * @param type 因子类型
 */
const parseRefValue = (val, type) => {
  if (!val) return '-';

  // 1. 处理距离和时段 (JSON数组字符串 -> 格式化文本)
  if (
    ['DISTANCE', 'TIME_PERIOD', FactorType.距离, FactorType.时段].includes(type)
  ) {
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      if (Array.isArray(parsed)) {
        return `[${parsed.join(' - ')}]`;
      }
    } catch (e) {
      return val; // 解析失败直接显示
    }
  }

  // 2. 处理地域 (枚举映射)
  if (['REGION', FactorType.地域].includes(type)) {
    return RegionType[val] || val;
  }

  // 3. 其他 (直接显示)
  return val;
};

const parseUnit = (val, type) => {
  if (FactorType.超期 === type) {
    return TimeUnit[val];
  }
  if (FactorType.工序 === type) {
    return ProcessStep[val];
  }
  return val;
};

const headers = [
  {
    prop: 'factorType',
    label: '因子类型',
    width: 120,
    formatter: (row) => FactorType[row.factorType] || row.factorType,
  },
  {
    prop: 'factorName',
    label: '因子名称',
    'show-overflow-tooltip': true,
    'min-width': 150,
  },
  {
    prop: 'refValue',
    label: '规则阈值',
    width: 180,
    formatter: (row) => parseRefValue(row.refValue, row.factorType),
  },
  {
    prop: 'measureUnit',
    label: '计量单位',
    width: 100,
    formatter: (row) => parseUnit(row.measureUnit, row.factorType),
  },
  {
    prop: 'refScore',
    label: '参考工分',
    width: 120,
    sortable: true,
    formatter: (row) =>
      row.refScore ? Number(row.refScore).toFixed(1) : '0.0',
  },
  {
    prop: 'factorDesc',
    label: '说明',
    'show-overflow-tooltip': true,
    'min-width': 200,
  },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getFactorConfigListForSelect({
      typeCode: props.typeCode,
      excludeIdList: factorIdList.value,
      factorType: filterType.value,
      factorName: filterName.value,
      pageNum: pageData.pageNo,
      pageSize: pageData.pageSize,
      sortType: pageData.sortType,
      sortField: pageData.sortField,
    });
    tableData.value = res.data.records;
    pageData.total = res.data.total;
  } catch (e) {
    console.error(e);
    tableData.value = [];
    pageData.total = 0;
  } finally {
    loading.value = false;
  }
};

/** 分页变化 */
const handlePage = (val) => {
  if ('pageNum' in val) pageData.pageNo = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  fetchData();
};

const handleSearch = () => {
  pageData.pageNo = 1;
  fetchData();
};

const handleSortChange = (data) => {
  pageData.sortKey = data.prop;
  pageData.sortType = data.order;
  handleSearch();
};

const handleSelectionChange = (val) => {
  selection.value = val;
};

const handleConfirm = async () => {
  if (!selection.value.length) return;

  loading.value = true;
  try {
    // 提取选中项的 pOrderFactorId 组成数组
    const factorIds = selection.value.map((item) => item.pOrderFactorId);

    // 调用绑定接口
    const res = await bindFactorsToTask({
      typeCode: props.typeCode,
      factorIds,
    });
    if (res.code === SUCCESS_CODE) {
      ElMessage.success('关联因子成功');

      // 通知父组件：操作成功并传递选中的原始数据（如果需要更新 UI）
      emits('confirm', selection.value);
      dialogRef.value.close();
    }
  } catch (error) {
    // 具体的错误处理，通常 http 拦截器已经处理了报错，这里做收尾
    console.error('绑定失败:', error);
    ElMessage.error('关联失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped lang="scss">
.choose-factor-container {
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}
.filter-bar {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.table-section {
  max-height: 600px;
}
</style>
