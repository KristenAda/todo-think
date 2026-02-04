<template>
  <dh-dialog :title="dialogTitle" width="800px">
    <div class="work-order-info-container">
      <div class="module-item">
        <c-title name="环节进度信息"></c-title>
        <div class="step-content">
          <el-steps :active="currentActiveStep" align-center>
            <el-step title="工单生成">
              <template #description>
                <div class="step-desc-item">
                  {{ stepDetail.orderCreateTime || '' }}
                </div>
              </template>
            </el-step>
            <el-step title="工单派单">
              <template #description>
                <div class="step-desc-item">
                  {{ stepDetail.orderAssignPerson || '' }}
                </div>
                <div class="step-desc-item">
                  {{ stepDetail.orderAssignTime || '' }}
                </div>
              </template>
            </el-step>
            <el-step title="工单处理">
              <template #description>
                <div class="step-desc-item">
                  {{ stepDetail.orderHandlePerson || '' }}
                </div>
                <div class="step-desc-item">
                  {{ stepDetail.orderHandleTime || '' }}
                </div>
              </template>
            </el-step>
            <el-step title="工单评价">
              <template #description>
                <div class="step-desc-item">
                  {{ stepDetail.orderEvaluatePerson || '' }}
                </div>
                <div class="step-desc-item">
                  {{ stepDetail.orderEvaluateTime || '' }}
                </div>
              </template>
            </el-step>
            <el-step title="工单归档">
              <template #description>
                <div class="step-desc-item">
                  {{ stepDetail.orderArchivePerson || '' }}
                </div>
                <div class="step-desc-item">
                  {{ stepDetail.orderArchiveTime || '' }}
                </div>
              </template>
            </el-step>
          </el-steps>
        </div>
      </div>

      <div class="module-item">
        <c-title name="工单信息"></c-title>
        <div class="desc-content">
          <el-descriptions :column="4">
            <el-descriptions-item
              v-for="item in workOrderDescConfig"
              :key="item.prop"
              :label="item.label + '：'"
              :span="item.span || 1"
            >
              {{ workOrderInfo[item.prop] || '' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <div class="module-item">
        <c-title name="工单标签"></c-title>
        <div class="tag-content">
          <el-space size="large">
            <el-tag
              v-for="tag in workOrderTags"
              :key="tag.key"
              :type="tag.type"
            >
              {{ tag.label }}
            </el-tag>
          </el-space>
        </div>
      </div>

      <div class="module-item">
        <c-title name="工单关联五要素"></c-title>
        <div class="border-box">
          <el-tabs v-model="activeWorkOrderAssName">
            <el-tab-pane
              v-for="value in workOrderAssTabs"
              :key="value.label"
              :label="value.label"
              :name="value.name"
            >
              <el-descriptions v-if="value.label === '车辆信息'" :column="4">
                <el-descriptions-item
                  v-for="item in workOrderAssDescConfig"
                  :key="item.prop"
                  :label="item.label + '：'"
                  :span="item.span || 1"
                >
                  {{ workOrderInfo[item.prop] || '' }}
                </el-descriptions-item>
              </el-descriptions>
              <c-table
                v-else
                style="height: 200px"
                :headers="workOrderAssTableHeader"
                :loading="workOrderAssLoading"
                :table-options="{ data: workOrderAssTableData }"
                :border="true"
                :show-index="true"
                :show-excel="false"
                :show-pagination="false"
              >
              </c-table>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <div class="module-item">
        <c-title name="其他信息"></c-title>
        <div class="border-box">
          <el-tabs v-model="otherName">
            <el-tab-pane
              v-for="value in otherTabs"
              :key="value.label"
              :label="value.label"
              :name="value.name"
            >
              <el-descriptions
                v-show="
                  otherName === '业务信息' ||
                  otherName === '派工信息' ||
                  otherName === '现场处理信息'
                "
                :column="4"
              >
                <el-descriptions-item
                  v-for="item in otherInformationConfig"
                  :key="item.prop"
                  :label="item.label + '：'"
                  :span="item.span || 1"
                >
                  {{ workOrderInfo[item.prop] || '' }}
                </el-descriptions-item>
              </el-descriptions>
              <c-title
                v-show="otherName === '业务信息'"
                name="人员列表"
              ></c-title>
              <c-table
                v-show="otherName === '业务信息' || otherName === '处理记录'"
                style="height: 300px"
                :headers="otherTableHeader"
                :loading="otherLoading"
                :table-options="{ data: otherTableData }"
                :border="true"
                :show-index="true"
                :show-excel="false"
                :show-pagination="false"
              >
              </c-table>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </dh-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import type { StepDetail, WorkOrderInfo } from './workOrderNoDialog';
import {
  dialogTitle,
  defaultStepDetail,
  defaultWorkOrderInfo,
  workOrderDescConfig,
  workOrderTags,
  workOrderAssTabs,
  otherTabs,
  workOrderAssDescConfig,
  sparePartsToolsHeader,
  measurementAssetHeader,
  ticketHeader,
  businessInfoTableHeader,
  handleRecordTableHeader,
  businessInfoDescConfig,
  dispatchInfoDescConfig,
  onSiteHandleInfoDescConfig,
} from './workOrderNoDialog';

// 当前激活步骤
const currentActiveStep = ref(0);

// 环节进度详情
const stepDetail = reactive<StepDetail>(defaultStepDetail);

// 工单核心信息
const workOrderInfo = reactive<WorkOrderInfo>(defaultWorkOrderInfo);

// 工单关联五要素tabs激活项
const activeWorkOrderAssName = ref('车辆信息');

// 其他信息tabs激活项
const otherName = ref('业务信息');

// 表格状态--工单关联五要素
// 表格加载状态
const workOrderAssLoading = ref(false);
// 表格数据
const workOrderAssTableData = ref([]);

// 表格状态--其他信息
// 表格加载状态
const otherLoading = ref(false);
// 表格数据
const otherTableData = ref([]);

// ---------------------- 提前定义表格表头变量（对应 otherTableHeader）----------------------
// 业务信息 表格表头
// 处理记录 表格表头

// ---------------------- 优化后的计算属性 ----------------------
const workOrderAssTableHeader = computed(() => {
  switch (activeWorkOrderAssName.value) {
    case '备品备件':
    case '工器具':
      return sparePartsToolsHeader;
    case '计量资产':
      return measurementAssetHeader;
    case '票卡':
      return ticketHeader;
    default:
      return [];
  }
});

const otherTableHeader = computed(() => {
  switch (otherName.value) {
    case '业务信息':
      return businessInfoTableHeader;
    case '处理记录':
      return handleRecordTableHeader;
    default:
      return [];
  }
});

const otherInformationConfig = computed(() => {
  switch (otherName.value) {
    case '业务信息':
      return businessInfoDescConfig;
    case '派工信息':
      return dispatchInfoDescConfig;
    case '现场处理信息':
      return onSiteHandleInfoDescConfig;
    default:
      return [];
  }
});
</script>

<style lang="scss" scoped>
.border-box {
  border: 1px solid #d1d0d0;
  border-radius: 8px;
  padding-bottom: 15px;
  box-sizing: border-box;
  min-height: 270px;
}

:deep(.el-tabs__header) {
  border-radius: 8px 8px 0 0;
  background-color: #ebf4ff;
  padding: 0 15px;
  box-sizing: border-box;
}
:deep(.el-tabs__nav-wrap:after) {
  display: none !important;
}
:deep(.el-tabs__content) {
  padding: 0 20px !important;
}
</style>
