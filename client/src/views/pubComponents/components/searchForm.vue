<template>
  <el-form :inline="true" :model="modelValue" class="search-form">
    <el-row>
      <el-col :span="8">
        <el-form-item label="供电单位">
          <chooseUnit
            ref="unit"
            :show-current-unit="true"
            :is-radio="false"
            :is-child="false"
            @get-code="getCode"
            @start="startSearch"
          ></chooseUnit>
          <!-- <el-input></el-input> -->
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="审核人员">
          <chooseUser
            ref="userFormRef"
            v-model="modelValue.user"
            :is-radio="false"
            :form-prop="false"
            @get-info="getInfo"
          ></chooseUser>
        </el-form-item>
      </el-col>

      <el-col class="search-buttons__col">
        <el-form-item>
          <div class="search-buttons">
            <el-button @click="onReset">重置</el-button>
            <el-button type="primary" @click="onSubmit">查询</el-button>
          </div>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { getSingleOrg } from '@/utils';

// 获取登录所属单位
const currentOrg = getSingleOrg();
// 父组件的参数
type Prop = {
  modelValue?: any;
};

const prop = withDefaults(defineProps<Prop>(), {
  modelValue: () => {},
});

onMounted(() => {});

const emit = defineEmits([
  'reset',
  'confirm',
  'start',
  'update:modelValue',
  'showThemeDia',
]);
// 清除时间
// const clearTime = () => {
//   prop.modelValue.startMadeDate = undefined;
//   prop.modelValue.endMadeDate = undefined;
//   prop.modelValue.closeStarTime = undefined;
//   prop.modelValue.closeEndTime = undefined;
// };
// 重置按钮
const unit = ref();
const userFormRef = ref();
const onReset = () => {
  // const { firstDay, lastDay } = getMonthDateRange()
  // prop.modelValue.company=undefined;
  prop.modelValue.tfrOutAcctOrg = currentOrg.mgtOrgCode || '51101';
  console.log(prop.modelValue.company);
  prop.modelValue.appDateStart = '';
  prop.modelValue.appDateEnd = '';
  prop.modelValue.wkOrderStat = '';

  // unit.value.refreshStatus()
  unit.value?.reset();
  userFormRef.value?.clearName();
  emit('reset');
  emit('update:modelValue', prop.modelValue);
};
// 获取本月的开始和结束的日期，用于重置
// const getMonthDateRange = () => {
//   const currentDate = new Date();
//   const year = currentDate.getFullYear();
//   const month = currentDate.getMonth();
//   // 当月第一天
//   const startDate = new Date(year, month, 1);
//   // 下个月第0天即为当月最后一天
//   const endDate = new Date(year, month + 1, 0);
//   const formatDate = (date: any) => {
//     const y = date.getFullYear();
//     const m = String(date.getMonth() + 1).padStart(2, '0');
//     const d = String(date.getDate()).padStart(2, '0');
//     return `${y}-${m}-${d}`;
//   };
//   return {
//     firstDay: formatDate(startDate),
//     lastDay: formatDate(endDate),
//   };
// };
// 确定按钮
const onSubmit = () => {
  // if (prop.modelValue.madeDate?.length > 0) {
  //     //创建时间
  //     prop.modelValue.startMadeDate = dayjs(prop.modelValue.madeDate[0]).format("YYYY-MM-DD");
  //     prop.modelValue.endMadeDate = dayjs(prop.modelValue.madeDate[1]).format("YYYY-MM-DD");
  // }
  // if (prop.modelValue.closeDate?.length > 0) {
  //     //执行时间()
  //     prop.modelValue.closeStarTime = dayjs(prop.modelValue.closeDate[0]).format("YYYY-MM-DD");
  //     prop.modelValue.closeEndTime = dayjs(prop.modelValue.closeDate[1]).format("YYYY-MM-DD");
  // }

  emit('confirm');
  emit('update:modelValue', prop.modelValue);
};
const startSearch = (keys: Array<string>) => {
  emit('start', keys); // 地区列表
  emit('update:modelValue', prop.modelValue);
};
// 获取选中的单位信息
const getCode = (val: any) => {
  prop.modelValue.mgtOrgCode = val;
  emit('update:modelValue', prop.modelValue);
};
// 获取选中的人员信息,
const getInfo = (val: any) => {
  console.log(val);
};
</script>

<style lang="scss" scoped>
.search-form {
  --el-border-color: #c6e2ff;

  :deep(.el-select__caret) {
    color: #c6e2ff;
  }

  :deep(.el-form-item) {
    margin: 0;
  }
}

:deep(
  .el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active
):before {
  content: '';
  display: block;
  width: 80%;
  position: absolute;
  bottom: 0;
  height: 2px;
  background-color: #2f90fd;
}

:deep(.el-tabs--border-card > .el-tabs__header) {
  border-bottom: 0 !important;
}

:deep(.el-form-item) {
  width: 100%;
}

:deep(
  .el-form-item.is-required:not(.is-no-asterisk).asterisk-left
    > .el-form-item__label:before
) {
  color: grey;
}

.search-form {
  --el-border-color: #c6e2ff;

  :deep(.el-select__caret) {
    color: #c6e2ff;
  }
}

.search-form {
  margin-bottom: 20px;

  .el-input__icon {
    color: #c6e2ff;
    cursor: pointer;
  }

  .el-form-item {
    width: 100%;
  }

  .el-form-item__label {
    width: 30%;
    font-size: 14px;
  }
}

.select-place {
  input {
    cursor: pointer;
  }
}
</style>
<style lang="scss">
.cDialog {
  --el-dialog-padding-primary: 0;

  .cDialog--buttons {
    padding: 20px 0;
    border-top: 1px solid #c6e2ff;
    display: flex;
    align-items: center;
    // justify-content: center;
  }

  .orgFilter-input {
    width: 100%;
  }

  .orgFilter-search {
    display: flex;
    align-items: center;
    padding: 15px 15px 0px 15px;
  }

  .orgFilter-contain {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 30px;

    label {
      margin-right: 5px;
    }
  }
}
</style>
