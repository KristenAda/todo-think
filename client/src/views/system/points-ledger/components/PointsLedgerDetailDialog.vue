<template>
  <ArtDialog
    v-model="innerVisible"
    title="积分变动详情"
    width="960px"
    max-height="calc(100vh - 240px)"
  >
    <div v-if="loading" class="pld-loading"><el-skeleton :rows="10" animated /></div>
    <div v-else-if="detail" class="pld-body">
      <header class="pld-hero">
        <div class="pld-hero__score">
          <span class="pld-hero__score-label">本次变动</span>
          <span
            class="pld-hero__score-value"
            :class="detail.entry.amount >= 0 ? 'is-plus' : 'is-minus'"
            :title="`变动分值：${detail.entry.amount}`"
          >
            {{ detail.entry.amount > 0 ? '+' : '' }}{{ detail.entry.amount }}
          </span>
        </div>
        <div class="pld-hero__chips">
          <el-tag size="small" type="primary" effect="light" class="pld-chip">
            {{ pointsLedgerBizTypeLabel(detail.entry.bizType) }}
          </el-tag>
          <el-tag size="small" effect="plain" class="pld-chip">{{
            pointsLedgerPointsTypeLabel(detail.entry.pointsType)
          }}</el-tag>
          <span class="pld-hero__muted">发生时间 {{ fmtDateTime(detail.entry.occurredAt) }}</span>
        </div>
      </header>

      <section class="pld-panel">
        <h3 class="pld-panel__title">基础信息</h3>
        <div class="pld-kv">
          <div class="pld-kv__item">
            <div class="pld-kv__label">入账时间</div>
            <div class="pld-kv__value">{{ fmtDateTime(detail.entry.createdAt) }}</div>
          </div>
          <div v-if="!detail.settlement" class="pld-kv__item">
            <div class="pld-kv__label">系统流水号</div>
            <div class="pld-kv__value pld-kv__value--mono">{{ detail.entry.bizId }}</div>
          </div>
          <div class="pld-kv__item">
            <div class="pld-kv__label">相关成员</div>
            <div class="pld-kv__value">{{
              detail.ownerUser ? detail.ownerUser.nickName || detail.ownerUser.userName : '—'
            }}</div>
          </div>
          <div class="pld-kv__item">
            <div class="pld-kv__label">所属项目</div>
            <div class="pld-kv__value">{{ detail.project?.name ?? '—' }}</div>
          </div>
          <div class="pld-kv__item pld-kv__item--full">
            <div class="pld-kv__label">关联任务</div>
            <div class="pld-kv__value">{{ detail.task?.title ?? '—' }}</div>
          </div>
        </div>
      </section>

      <section v-if="detail.ruleSetVersion" class="pld-panel">
        <h3 class="pld-panel__title">计分规则版本</h3>
        <p class="pld-panel__lead"
          >本次得分基于以下规则版本计算生成，您可前往「规则管理」查看详细定义。</p
        >
        <div class="pld-kv">
          <div class="pld-kv__item pld-kv__item--full">
            <div class="pld-kv__label">规则集名称</div>
            <div class="pld-kv__value">{{ detail.ruleSetVersion.ruleSet?.name ?? '—' }}</div>
          </div>
          <div class="pld-kv__item">
            <div class="pld-kv__label">规则版本</div>
            <div class="pld-kv__value">
              <el-tag type="success" size="small" effect="light"
                >v{{ detail.ruleSetVersion.version }}</el-tag
              >
            </div>
          </div>
        </div>
      </section>

      <section v-if="detail.settlement" class="pld-panel">
        <h3 class="pld-panel__title">核算信息</h3>
        <p class="pld-panel__lead">本次积分变动对应的后台核算批次及处理状态。</p>
        <div class="pld-kv">
          <div class="pld-kv__item">
            <div class="pld-kv__label">核算类型</div>
            <div class="pld-kv__value">{{
              settlementTypeLabelZh(String((detail.settlement as any).settlementType ?? ''))
            }}</div>
          </div>
          <div class="pld-kv__item">
            <div class="pld-kv__label">处理状态</div>
            <div class="pld-kv__value">
              <el-tag
                :type="settlementStatusTagType((detail.settlement as any).status)"
                size="small"
                effect="light"
              >
                {{ settlementStatusLabelZh((detail.settlement as any).status) }}
              </el-tag>
            </div>
          </div>
          <div class="pld-kv__item pld-kv__item--full">
            <div class="pld-kv__label">核算触发时间</div>
            <div class="pld-kv__value">{{
              fmtDateTime((detail.settlement as any).occurredAt)
            }}</div>
          </div>
          <div
            v-if="settlementKeyOneLiner((detail.settlement as any).settlementKey)"
            class="pld-kv__item pld-kv__item--full"
          >
            <div class="pld-kv__label">核算说明</div>
            <div class="pld-kv__value pld-muted">{{
              settlementKeyOneLiner((detail.settlement as any).settlementKey)
            }}</div>
          </div>
        </div>
      </section>

      <section v-if="taskFactRowsForUser.length" class="pld-panel">
        <h3 class="pld-panel__title">任务快照数据（计分依据）</h3>
        <p class="pld-panel__lead"
          >记录了计算得分那一刻的任务真实状态，这些数据直接决定了最终得分。</p
        >
        <ul class="pld-fact-list">
          <li v-for="row in taskFactRowsForUser" :key="row.field" class="pld-fact-row">
            <div class="pld-fact-row__label">{{ row.label }}</div>
            <div class="pld-fact-row__value">{{ formatTaskFactRowDisplay(row) }}</div>
          </li>
        </ul>
      </section>

      <section v-if="detail.evaluation" class="pld-panel pld-panel--flush">
        <h3 class="pld-panel__title">得分计算过程</h3>
        <p class="pld-panel__lead">系统自动提取任务快照并套用公式的过程还原，方便您核对明细。</p>
        <el-alert
          v-if="!detail.evaluation.formulaExpression"
          type="info"
          :closable="false"
          show-icon
          class="formula-missing-alert"
          title="当前积分为固定分值或由历史规则生成，无动态公式展示。下方列出了计算时的环境数据供参考。"
        />
        <div v-if="detail.evaluation.formulaExpression" class="formula-stack">
          <div class="formula-block formula-block--source">
            <div class="formula-label">应用公式</div>
            <pre class="formula-code">{{ detail.evaluation.formulaExpression }}</pre>
          </div>
          <div
            v-if="detail.evaluation.formulaExpression"
            class="formula-block formula-block--filled"
          >
            <div class="formula-label">代入快照数据</div>
            <pre class="formula-code formula-code--filled">{{
              detail.evaluation.formulaWithValues || detail.evaluation.formulaExpression
            }}</pre>
            <div
              v-if="
                detail.evaluation.formulaEvalRaw !== null &&
                detail.evaluation.formulaEvalRaw !== undefined
              "
              class="formula-result-row"
            >
              <span class="formula-eq">=</span>
              <span class="formula-num">{{
                formatFormulaNum(detail.evaluation.formulaEvalRaw)
              }}</span>
              <span
                v-if="
                  detail.evaluation.formulaEvalRounded !== null &&
                  detail.evaluation.formulaEvalRounded !== undefined
                "
                class="formula-round"
              >
                四舍五入实际入账：<strong>{{ detail.evaluation.formulaEvalRounded }}</strong>
              </span>
            </div>
          </div>
          <div class="formula-hint">注：代入的变量值与上文「任务快照数据」完全一致。</div>
        </div>
        <h4 class="pld-subtitle">公式变量明细</h4>
        <ArtTable :data="detail.evaluation.variableRows" :columns="variableColumns" />
        <h4 class="pld-subtitle">触发的规则条件</h4>
        <ArtTable :data="detail.evaluation.triggeredRules" :columns="ruleColumns" />
        <h4 class="pld-subtitle">得分拆解模拟</h4>
        <ArtTable :data="detail.evaluation.simulatedPostings" :columns="postingColumns" />
      </section>

      <section v-else-if="detail.settlement || detail.ruleSetVersion" class="pld-panel">
        <h3 class="pld-panel__title">得分计算过程</h3>
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          title="无法加载计算过程数据，可能因数据归档或网络问题，请刷新重试。"
        />
      </section>

      <section v-if="detail.recordedPostings?.length" class="pld-panel pld-panel--flush">
        <h3 class="pld-panel__title">相关账单流水</h3>
        <p class="pld-panel__lead"
          >展示与本次任务核算相关的所有流水，「当前项」即为本次变动的积分。</p
        >
        <ArtTable :data="detail.recordedPostings" :columns="recordedColumns" />
      </section>
    </div>
    <template #footer>
      <el-button @click="innerVisible = false">关闭</el-button>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { ElTag } from 'element-plus';
  import { h } from 'vue';
  import { fetchPointsLedgerDetail } from '@/api/task';
  import { formatDateTime } from '@/utils/date';
  import {
    pointsLedgerBizTypeLabel,
    pointsLedgerPointsTypeLabel
  } from '@/enums/modules/pointsLedgerEnum';

  /** 与全站一致：YYYY-MM-DD HH:mm:ss，空或非法为 — */
  function fmtDateTime(input: string | number | Date | null | undefined) {
    if (input === null || input === undefined || input === '') return '—';
    const s = formatDateTime(input);
    return s || '—';
  }

  const TASK_FACT_DATE_FIELDS = new Set([
    'dueDate',
    'acceptedAt',
    'createdAt',
    'updatedAt',
    'occurredAt',
    'startedAt',
    'endedAt',
    'settledAt',
    'publishedAt'
  ]);

  function isTaskFactDateField(field: string) {
    if (TASK_FACT_DATE_FIELDS.has(field)) return true;
    return /(At|Time)$/i.test(field) || /Date$/i.test(field);
  }

  /** 任务事实里日期/时间类字段用系统统一格式，其余沿用服务端 display */
  function formatTaskFactRowDisplay(row: Api.Task.PointsLedgerDetail['taskFactRows'][number]) {
    if (!isTaskFactDateField(row.field)) return row.display;
    const r = row.raw;
    if (r === null || r === undefined || r === '') return '—';
    if (typeof r === 'object') return row.display;
    const s = formatDateTime(r as string | number | Date);
    return s || row.display;
  }

  function formatFormulaNum(n: number) {
    if (!Number.isFinite(n)) return '0';
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return String(Number(n.toFixed(4)));
  }

  /** 结算单 settlementType 中文说明 UX优化版 */
  function settlementTypeLabelZh(t: string) {
    const map: Record<string, string> = {
      first: '首次计算',
      adjustment: '变更补差',
      reversal: '撤销回滚'
    };
    const k = (t || '').trim();
    return map[k] || k || '—';
  }

  /** 结算状态中文（标签内展示） */
  function settlementStatusLabelZh(status: unknown) {
    const s = String(status ?? '')
      .toUpperCase()
      .trim();
    const map: Record<string, string> = {
      SUCCEEDED: '已完成',
      PENDING: '待处理',
      RUNNING: '处理中',
      FAILED: '失败'
    };
    return map[s] || String(status ?? '—');
  }

  /** 防重键摘要（不含内部原始键） UX优化版 */
  function settlementKeyOneLiner(key: unknown): string {
    const raw = String(key ?? '').trim();
    if (!raw) return '';
    const first = /^task:(\d+):first:(.+)$/.exec(raw);
    if (first) return `首次核算，验收时间 ${fmtDateTime(first[2])}；自动拦截重复计分。`;
    if (/^task:\d+:adjustment:/.test(raw)) {
      const m = /^task:(\d+):adjustment:(.+):(\d+)$/.exec(raw);
      if (m)
        return `信息变更补差，触发时间 ${fmtDateTime(m[2])}；因任务信息发生变动，系统自动按照最新规则补齐差额。`;
    }
    if (/^task:\d+:reversal:/.test(raw)) {
      const m = /^task:(\d+):reversal:(.+):(\d+)$/.exec(raw);
      if (m)
        return `数据撤销回滚，触发时间 ${fmtDateTime(m[2])}；因任务状态重置或作废，系统自动扣回已发放的积分。`;
    }
    return '';
  }

  function settlementStatusTagType(status: unknown): 'success' | 'warning' | 'info' | 'danger' {
    const s = String(status ?? '')
      .toUpperCase()
      .trim();
    if (s === 'SUCCEEDED') return 'success';
    if (s === 'FAILED') return 'danger';
    if (s === 'PENDING' || s === 'RUNNING') return 'warning';
    return 'info';
  }

  const props = defineProps<{
    visible: boolean;
    entryId: string | null;
  }>();

  const emit = defineEmits<{ 'update:visible': [boolean] }>();

  const innerVisible = computed({
    get: () => props.visible,
    set: (v: boolean) => emit('update:visible', v)
  });

  const loading = ref(false);
  const detail = ref<Api.Task.PointsLedgerDetail | null>(null);

  /** 任务事实：去掉与上方信息重复或纯技术向的字段 */
  const taskFactRowsForUser = computed(() => {
    const rows = detail.value?.taskFactRows ?? [];
    const skip = new Set(['id', 'projectId']);
    return rows.filter((r) => !skip.has(r.field));
  });

  const variableColumns = [
    {
      prop: 'name',
      label: '变量名称',
      minWidth: 140,
      formatter: (row: { name?: string }) => (row.name && String(row.name).trim() ? row.name : '—')
    },
    { prop: 'code', label: '变量标识码', minWidth: 120 },
    { prop: 'value', label: '实际代入值', width: 100, align: 'center' as const }
  ];

  const ruleColumns = [
    {
      prop: 'name',
      label: '检查规则',
      minWidth: 160,
      formatter: (row: { name?: string }) =>
        row.name && String(row.name).trim() ? String(row.name).trim() : '—'
    },
    {
      prop: 'matched',
      label: '命中状态',
      width: 100,
      align: 'center' as const,
      formatter: (row: { matched: boolean }) =>
        h(ElTag, { type: row.matched ? 'success' : 'info', size: 'small' }, () =>
          row.matched ? '已命中' : '未命中'
        )
    }
  ];

  const postingColumns = [
    { prop: 'subjectId', label: '用户编号', width: 96, align: 'center' as const },
    {
      prop: 'pointsType',
      label: '涉及积分项',
      minWidth: 100,
      formatter: (row: { pointsType?: string }) => pointsLedgerPointsTypeLabel(row.pointsType)
    },
    { prop: 'amount', label: '变动分值', width: 120, align: 'center' as const }
  ];

  const recordedColumns = [
    { prop: 'subjectId', label: '用户编号', width: 96, align: 'center' as const },
    {
      prop: 'pointsType',
      label: '涉及积分项',
      width: 100,
      formatter: (row: { pointsType?: string }) => pointsLedgerPointsTypeLabel(row.pointsType)
    },
    { prop: 'amount', label: '变动分值', width: 120, align: 'center' as const },
    {
      prop: '_mark',
      label: '流水标记',
      minWidth: 88,
      align: 'center' as const,
      formatter: (row: Record<string, unknown>) => {
        const m = detail.value?.matchedRecordedPosting as Record<string, unknown> | null;
        const hit =
          m &&
          m.subjectId === row.subjectId &&
          m.pointsType === row.pointsType &&
          Number(m.amount) === Number(row.amount);
        return hit
          ? h(ElTag, { type: 'warning', size: 'small' }, () => '当前项')
          : h('span', { class: 'text-muted' }, '—');
      }
    }
  ];

  async function load() {
    if (!props.entryId || !props.visible) return;
    loading.value = true;
    detail.value = null;
    try {
      detail.value = await fetchPointsLedgerDetail(props.entryId);
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => [props.visible, props.entryId] as const,
    ([v, id]) => {
      if (v && id) load();
      else if (!v) detail.value = null;
    }
  );
</script>

<style scoped lang="scss">
  .pld-loading {
    padding: 20px 8px 28px;
  }

  /* 不在此层再设 overflow/max-height，避免与 ArtDialog 内容区（.art-dialog__body）重复出现纵向滚动条 */
  .pld-body {
    padding: 0 0 8px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* 顶部：分值主导 */
  .pld-hero {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px 24px;
    padding: 20px 22px;
    border-radius: 12px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-fill-color-blank) 48%,
      var(--el-fill-color-light) 100%
    );
    border: 1px solid var(--el-color-primary-light-7);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  }

  .pld-hero__score {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .pld-hero__score-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.02em;
  }

  .pld-hero__score-value {
    font-size: 36px;
    font-weight: 800;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .pld-hero__score-value.is-plus {
    color: var(--el-color-success);
  }

  .pld-hero__score-value.is-minus {
    color: var(--el-color-danger);
  }

  .pld-hero__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
  }

  .pld-chip {
    font-weight: 500;
  }

  .pld-hero__muted {
    font-size: 13px;
    color: var(--el-text-color-regular);
    white-space: nowrap;
  }

  /* 分块面板 */
  .pld-panel {
    padding: 18px 20px 20px;
    border-radius: 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .pld-panel--flush {
    padding-bottom: 16px;
  }

  .pld-panel__title {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    letter-spacing: 0.02em;
  }

  .pld-panel__lead {
    margin: 0 0 16px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--el-text-color-secondary);
  }

  .pld-panel--flush .pld-panel__lead {
    margin-bottom: 12px;
  }

  /* 键值栅格：标准 16px 行距、24px 列距 */
  .pld-kv {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 28px;
  }

  @media (max-width: 640px) {
    .pld-kv {
      grid-template-columns: 1fr;
    }
  }

  .pld-kv__item--full {
    grid-column: 1 / -1;
  }

  .pld-kv__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
    line-height: 1.4;
  }

  .pld-kv__value {
    font-size: 14px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    word-break: break-word;
  }

  .pld-kv__value--mono {
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    font-size: 13px;
  }

  .pld-kv__value--block {
    display: block;
  }

  /* 任务事实列表 */
  .pld-fact-list {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
  }

  .pld-fact-row {
    display: grid;
    grid-template-columns: minmax(140px, 34%) 1fr;
    gap: 12px 20px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    align-items: start;
  }

  .pld-fact-row:last-child {
    border-bottom: none;
  }

  .pld-fact-row:nth-child(even) {
    background: var(--el-fill-color-extra-light);
  }

  .pld-fact-row__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
    line-height: 1.45;
  }

  .pld-fact-row__field {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    font-weight: 500;
    color: var(--el-text-color-placeholder);
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
  }

  .pld-fact-row__value {
    font-size: 14px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    word-break: break-word;
  }

  .pld-subtitle {
    margin: 20px 0 10px;
    font-size: 13px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .pld-subtitle:first-of-type {
    margin-top: 4px;
  }

  .pld-match-tip {
    margin-top: 14px;
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--el-color-warning-light-9);
    border: 1px solid var(--el-color-warning-light-5);
    font-size: 13px;
    line-height: 1.55;
    color: var(--el-text-color-regular);
  }

  .pld-match-tip code {
    font-size: 12px;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--el-fill-color-blank);
  }

  .formula-missing-alert {
    margin-bottom: 12px;
  }
  .formula-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 14px;
  }
  .formula-block {
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
  }
  .formula-block--source {
    background: linear-gradient(
      135deg,
      var(--el-fill-color-light) 0%,
      var(--el-fill-color-blank) 100%
    );
  }
  .formula-block--filled {
    background: linear-gradient(
      125deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-fill-color-blank) 55%
    );
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  }
  .formula-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
    font-weight: 600;
  }
  .formula-code {
    margin: 0;
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    font-size: 14px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--el-color-primary);
  }
  .formula-code--filled {
    color: var(--el-text-color-primary);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .formula-result-row {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 12px;
    padding-top: 10px;
    border-top: 1px dashed var(--el-border-color);
  }
  .formula-eq {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-color-success);
    line-height: 1;
  }
  .formula-num {
    font-size: 22px;
    font-weight: 700;
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    color: var(--el-color-success);
    letter-spacing: 0.03em;
  }
  .formula-round {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  .formula-round strong {
    color: var(--el-color-warning);
    font-size: 15px;
  }
  .formula-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.55;
  }
  .text-muted {
    color: var(--el-text-color-placeholder);
  }

  .pld-muted {
    font-size: 13px;
    line-height: 1.55;
    color: var(--el-text-color-secondary);
  }
</style>
