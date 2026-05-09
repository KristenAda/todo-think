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
        <div class="ledger-period-picker-wrap">
          <el-date-picker
            v-model="periodRange"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            range-separator="至"
            start-placeholder="业务时间起"
            end-placeholder="业务时间止"
            :default-time="ledgerDatetimerangeDefaultTime"
            :shortcuts="ledgerPeriodShortcuts"
            @change="onPeriodChange"
          />
        </div>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-collapse v-model="extraFiltersActive" class="extra-filters-collapse">
        <el-collapse-item
          :title="ledgerSelfOnly ? '更多筛选（任务编号）' : '更多筛选（内部编号）'"
          name="extra"
        >
          <div class="extra-filters-inner">
            <el-input-number
              v-model="ledgerSearch.taskId"
              :min="1"
              :step="1"
              controls-position="right"
              placeholder="任务编号"
              clearable
              style="width: 160px"
              @change="refreshData"
            />
            <el-input-number
              v-if="!ledgerSelfOnly"
              v-model="ledgerSearch.userOwnerId"
              :min="1"
              :step="1"
              controls-position="right"
              placeholder="用户编号"
              clearable
              style="width: 160px"
              @change="refreshData"
            />
            <span class="extra-filters-hint">{{ extraFiltersHint }}</span>
          </div>
        </el-collapse-item>
      </el-collapse>

      <div class="summary-row">
        <art-svg-icon icon="mdi:sigma" class="summary-icon" />
        <span>
          当前筛选条件下，全部符合条件记录的积分变动合计（含所有分页，与上方项目/类型/时间等筛选一致）：<b
            :class="ledgerSummary.sumAmount >= 0 ? 'sum-pos' : 'sum-neg'"
            >{{ ledgerSummary.sumAmount }}</b
          >
        </span>
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
  import { ref, h, onMounted, computed, watch, nextTick } from 'vue';
  import { useRoute } from 'vue-router';
  import { ElTag } from 'element-plus';
  import { useTable } from '@/hooks/core/useTable';
  import { fetchPointsLedgerPage, fetchPointsLedgerMinePage, fetchProjectList } from '@/api/task';
  import { formatDateTime } from '@/utils/date';
  import {
    POINTS_LEDGER_BIZ_TYPE_OPTIONS,
    pointsLedgerBizTypeLabel,
    pointsLedgerPointsTypeLabel
  } from '@/enums/modules/pointsLedgerEnum';
  import PointsLedgerDetailDialog from './components/PointsLedgerDetailDialog.vue';
  import ArtTableRowActions from '@/components/core/forms/art-table-row-actions/index.vue';

  defineOptions({ name: 'PointsLedgerLog' });

  type LedgerRow = Api.Task.PointsLedgerListRow;
  type LedgerSearchParams = Api.Task.PointsLedgerPageParams & { page: number; pageSize: number };

  const projectList = ref<Api.Task.SimpleProject[]>([]);
  const periodRange = ref<[string, string] | null>(null);
  const ledgerSummary = ref({ sumAmount: 0 });
  const detailVisible = ref(false);
  const selectedEntryId = ref<string | null>(null);
  /** 默认收起「任务/用户编号」筛选 */
  const extraFiltersActive = ref<string[]>([]);

  const route = useRoute();

  /** 独立路由 PointsLedgerMine：对接 /points-ledger/mine，不可通过改查询参数扩大范围 */
  const initialLedgerSelfOnly = route.name === 'PointsLedgerMine';

  const ledgerSelfOnly = computed(() => route.name === 'PointsLedgerMine');

  const extraFiltersHint = computed(() =>
    ledgerSelfOnly.value
      ? '与表格中的名称对应同一记录，用于精确过滤；本页仅展示本人流水。'
      : '与表格中的名称对应同一记录，用于后台排查或精确过滤；可查看管辖范围项目内成员的流水。'
  );

  /** 本地自然日的 00:00:00 与 23:59:59（传给接口与快捷选项统一） */
  function ledgerLocalDayStart(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  function ledgerLocalDayEnd(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 0);
  }

  /** datetimerange：选日期后默认起始 00:00:00、结束 23:59:59（仅时分秒参与拼接） */
  const ledgerDatetimerangeDefaultTime: [Date, Date] = [
    new Date(2000, 0, 1, 0, 0, 0, 0),
    new Date(2000, 0, 1, 23, 59, 59, 0)
  ];

  /** Element Plus 官方 shortcuts：`datetimerange` 的 `value` 返回 `[start, end]` */
  const ledgerPeriodShortcuts = [
    {
      text: '今天',
      value: (): [Date, Date] => {
        const now = new Date();
        return [ledgerLocalDayStart(now), ledgerLocalDayEnd(now)];
      }
    },
    {
      text: '本周',
      value: (): [Date, Date] => {
        const now = new Date();
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
        const start = ledgerLocalDayStart(weekStart);
        const weekEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
        const end = ledgerLocalDayEnd(weekEnd);
        return [start, end];
      }
    },
    {
      text: '本月',
      value: (): [Date, Date] => {
        const now = new Date();
        const start = ledgerLocalDayStart(new Date(now.getFullYear(), now.getMonth(), 1));
        const end = ledgerLocalDayEnd(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        return [start, end];
      }
    }
  ];

  async function fetchLedgerTableApi(params: Record<string, unknown>) {
    const base = {
      page: Number(params.page) || 1,
      pageSize: Number(params.pageSize) || 20,
      projectId: params.projectId as number | undefined,
      taskId: params.taskId as number | undefined,
      bizType: params.bizType as Api.Task.PointsLedgerPageParams['bizType'],
      startAt: params.startAt as string | undefined,
      endAt: params.endAt as string | undefined
    };
    const res = ledgerSelfOnly.value
      ? await fetchPointsLedgerMinePage(base)
      : await fetchPointsLedgerPage({
          ...base,
          userOwnerId: params.userOwnerId as number | undefined
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
    handleCurrentChange,
    toggleColumn
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
          visible: !initialLedgerSelfOnly,
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
          width: 96,
          align: 'center',
          fixed: 'right',
          formatter: (row: LedgerRow) =>
            h(ArtTableRowActions, {
              items: [{ key: 'detail', label: '详情', onClick: () => openDetail(row) }]
            })
        }
      ]
    }
  });

  const ledgerSearch = ledgerSearchRaw as unknown as LedgerSearchParams;

  watch(
    ledgerSelfOnly,
    (mine) => {
      if (mine) ledgerSearch.userOwnerId = undefined;
      nextTick(() => toggleColumn?.('ownerDisplayName', !mine));
      refreshData();
    },
    { flush: 'post' }
  );

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

  .ledger-scope-hint {
    margin: 0 0 12px;
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-blank);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
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

  /* EP datetimerange 默认 --el-date-editor-datetimerange-width 为 400px，外层 width 容易落不到 .el-date-editor 上 */
  .ledger-period-picker-wrap {
    flex: 0 0 auto;
    width: 480px;
    max-width: 100%;
    box-sizing: border-box;
    --el-date-editor-datetimerange-width: 280px;
  }

  .ledger-period-picker-wrap :deep(.el-date-editor.el-date-editor--datetimerange) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .extra-filters-collapse {
    margin-top: 12px;
    border: none;
    --el-collapse-border-color: transparent;
  }
  .extra-filters-collapse :deep(.el-collapse-item__header) {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    height: auto;
    line-height: 1.4;
    padding-top: 4px;
    padding-bottom: 4px;
  }
  .extra-filters-collapse :deep(.el-collapse-item__wrap) {
    border-bottom: none;
  }
  .extra-filters-inner {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    padding-bottom: 4px;
  }
  .extra-filters-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    flex: 1;
    min-width: 200px;
    line-height: 1.45;
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
