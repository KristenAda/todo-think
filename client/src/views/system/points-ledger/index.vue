<template>
  <div class="points-ledger art-full-height">
    <ElCard shadow="never" class="toolbar-card">
      <div class="toolbar">
        <el-select
          v-model="ledgerSearch.projectId"
          placeholder="全部项目"
          clearable
          filterable
          style="width: 200px"
          @change="refreshData"
        >
          <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-select
          v-model="ledgerSearch.bizType"
          placeholder="业务类型"
          clearable
          style="width: 150px"
          @change="refreshData"
        >
          <el-option
            v-for="o in POINTS_LEDGER_BIZ_TYPE_OPTIONS"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
        <el-input-number
          v-model="ledgerSearch.taskId"
          :min="1"
          :step="1"
          controls-position="right"
          placeholder="任务 ID"
          clearable
          style="width: 140px"
          @change="refreshData"
        />
        <el-input-number
          v-model="ledgerSearch.userOwnerId"
          :min="1"
          :step="1"
          controls-position="right"
          placeholder="用户 ID"
          clearable
          style="width: 140px"
          @change="refreshData"
        />
        <el-date-picker
          v-model="periodRange"
          type="datetimerange"
          value-format="YYYY-MM-DDTHH:mm:ssZ"
          range-separator="至"
          start-placeholder="业务时间起"
          end-placeholder="业务时间止"
          style="width: 360px"
          @change="onPeriodChange"
        />
        <el-button @click="resetFilters">重置</el-button>
      </div>
      <div class="summary-row">
        <art-svg-icon icon="mdi:sigma" class="summary-icon" />
        <span
          >当前筛选下积分变动合计：<b :class="ledgerSummary.sumAmount >= 0 ? 'sum-pos' : 'sum-neg'">{{
            ledgerSummary.sumAmount
          }}</b>
          （全部分页数据之和，非仅本页）</span
        >
      </div>
    </ElCard>

    <ElCard class="art-table-card" shadow="never" style="margin-top: 12px">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData" />
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <PointsLedgerDetailDialog v-model:visible="detailVisible" :entry-id="selectedEntryId" />
  </div>
</template>

<script setup lang="ts">
  import { ref, h, onMounted } from 'vue';
  import { ElButton, ElTag } from 'element-plus';
  import { useTable } from '@/hooks/core/useTable';
  import { fetchPointsLedgerPage, fetchProjectList } from '@/api/task';
  import { formatDateTime } from '@/utils/date';
  import {
    POINTS_LEDGER_BIZ_TYPE_OPTIONS,
    pointsLedgerBizTypeLabel,
    pointsLedgerPointsTypeLabel
  } from '@/enums/modules/pointsLedgerEnum';
  import PointsLedgerDetailDialog from './components/PointsLedgerDetailDialog.vue';

  defineOptions({ name: 'PointsLedgerLog' });

  type LedgerRow = Api.Task.PointsLedgerListRow;
  type LedgerSearchParams = Api.Task.PointsLedgerPageParams & { page: number; pageSize: number };

  const projectList = ref<Api.Task.SimpleProject[]>([]);
  const periodRange = ref<[string, string] | null>(null);
  const ledgerSummary = ref({ sumAmount: 0 });
  const detailVisible = ref(false);
  const selectedEntryId = ref<string | null>(null);

  async function fetchLedgerTableApi(params: Record<string, unknown>) {
    const res = await fetchPointsLedgerPage({
      page: Number(params.page) || 1,
      pageSize: Number(params.pageSize) || 20,
      projectId: params.projectId as number | undefined,
      taskId: params.taskId as number | undefined,
      userOwnerId: params.userOwnerId as number | undefined,
      bizType: params.bizType as Api.Task.PointsLedgerPageParams['bizType'],
      startAt: params.startAt as string | undefined,
      endAt: params.endAt as string | undefined
    });
    ledgerSummary.value = res.summary ?? { sumAmount: 0 };
    return res;
  }

  function onPeriodChange() {
    const r = periodRange.value;
    ledgerSearch.startAt = r?.[0];
    ledgerSearch.endAt = r?.[1];
    refreshData();
  }

  async function resetFilters() {
    periodRange.value = null;
    await resetSearchParams();
  }

  function openDetail(row: LedgerRow) {
    selectedEntryId.value = row.id;
    detailVisible.value = true;
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    searchParams: ledgerSearchRaw,
    refreshData,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchLedgerTableApi as any,
      paginationKey: { current: 'page', size: 'pageSize' },
      apiParams: {
        page: 1,
        pageSize: 20,
        projectId: undefined as number | undefined,
        bizType: undefined as Api.Task.PointsLedgerPageParams['bizType'],
        taskId: undefined as number | undefined,
        userOwnerId: undefined as number | undefined,
        startAt: undefined as string | undefined,
        endAt: undefined as string | undefined
      },
      columnsFactory: () => [
        { type: 'globalIndex', width: 60, label: '序号' },
        {
          prop: 'occurredAt',
          label: '业务时间',
          minWidth: 175,
          formatter: (row: LedgerRow) => formatDateTime(row.occurredAt)
        },
        {
          prop: 'ownerDisplayName',
          label: '用户',
          minWidth: 100,
          formatter: (row: LedgerRow) => row.ownerDisplayName ?? '—'
        },
        {
          prop: 'projectName',
          label: '项目',
          minWidth: 120,
          showOverflowTooltip: true,
          formatter: (row: LedgerRow) => row.projectName ?? '—'
        },
        {
          prop: 'taskTitle',
          label: '任务',
          minWidth: 140,
          showOverflowTooltip: true,
          formatter: (row: LedgerRow) => row.taskTitle ?? '—'
        },
        {
          prop: 'bizType',
          label: '业务类型',
          width: 110,
          formatter: (row: LedgerRow) =>
            h(ElTag, { size: 'small', type: 'info' }, () => pointsLedgerBizTypeLabel(row.bizType))
        },
        {
          prop: 'pointsType',
          label: '积分科目',
          width: 110,
          formatter: (row: LedgerRow) => pointsLedgerPointsTypeLabel(row.pointsType)
        },
        {
          prop: 'amount',
          label: '变动',
          width: 88,
          align: 'center',
          formatter: (row: LedgerRow) =>
            h(
              'span',
              { class: row.amount >= 0 ? 'cell-amt-plus' : 'cell-amt-minus' },
              String(row.amount)
            )
        },
        {
          prop: 'ruleVersion',
          label: '规则版本',
          minWidth: 160,
          showOverflowTooltip: true,
          formatter: (row: LedgerRow) =>
            row.ruleSetName ? `${row.ruleSetName} v${row.ruleVersionNo ?? ''}` : '—'
        },
        {
          prop: 'op',
          label: '操作',
          width: 100,
          fixed: 'right',
          formatter: (row: LedgerRow) =>
            h(
              ElButton,
              { type: 'primary', link: true, onClick: () => openDetail(row) },
              { default: () => '详情' }
            )
        }
      ]
    }
  });

  const ledgerSearch = ledgerSearchRaw as unknown as LedgerSearchParams;

  onMounted(async () => {
    projectList.value = (await fetchProjectList()) ?? [];
  });
</script>

<style scoped lang="scss">
  .points-ledger {
    padding: 16px;
    display: flex;
    flex-direction: column;
  }
  .toolbar-card :deep(.el-card__body) {
    padding-bottom: 12px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .summary-row {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
  .summary-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }
  .sum-pos {
    color: var(--el-color-success);
  }
  .sum-neg {
    color: var(--el-color-danger);
  }
  :deep(.cell-amt-plus) {
    color: var(--el-color-success);
    font-weight: 600;
  }
  :deep(.cell-amt-minus) {
    color: var(--el-color-danger);
    font-weight: 600;
  }
</style>
