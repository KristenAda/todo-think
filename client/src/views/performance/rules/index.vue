<template>
  <div class="rules-page art-full-height">
    <div class="rule-top">
      <div class="title-box">
        <div class="title">计算规则</div>
        <div class="sub">Rule Code: {{ currentRuleSet?.code || '-' }}</div>
      </div>
      <div class="ops">
        <el-select
          v-model="selectedRuleSetId"
          placeholder="选择规则集"
          style="width: 220px"
          @change="onRuleSetChange"
        >
          <el-option
            v-for="r in ruleSets"
            :key="r.id"
            :label="`${r.name} (${r.code})`"
            :value="r.id"
          />
        </el-select>
        <el-button type="primary" plain @click="openCreateRuleSet">新建规则集</el-button>
        <el-button @click="openEditRuleSet">编辑规则集</el-button>
        <el-button type="danger" plain @click="deleteCurrentRuleSet">删除规则集</el-button>
        <el-button @click="openVersions">查看历史版本</el-button>
        <el-button type="warning" plain @click="saveDraft">保存草稿</el-button>
        <el-button type="primary" @click="saveAsNewVersion">保存为新版本</el-button>
      </div>
    </div>

    <div v-if="currentRuleSet?.draftUpdatedAt" class="draft-banner">
      当前规则集存在未发布草稿（{{
        formatDateTime(currentRuleSet.draftUpdatedAt)
      }}），下方公式与变量优先展示草稿内容。
    </div>

    <div v-if="currentRuleSet?.projectId" class="rule-project-active">
      <div class="rule-project-active__row">
        <span class="rule-project-active__label">本项目验收计分生效版本</span>
        <el-select
          v-model="projectActiveVersionId"
          clearable
          filterable
          placeholder="未指定时由系统自动择优（发布时间最新）"
          class="rule-project-active__select"
          @change="onActiveScoringVersionChange"
        >
          <el-option
            v-for="opt in scoringVersionOptions"
            :key="opt.id"
            :label="opt.label"
            :value="opt.id"
          />
        </el-select>
      </div>
    </div>

    <div class="rule-main">
      <el-card shadow="never" class="left-card">
        <template #header><span>系统注入变量</span></template>
        <div class="var-list">
          <div v-for="v in systemVars" :key="v.code" class="var-item">
            <div class="var-head">
              <span class="var-item__label">{{ v.label }}</span>
              <el-tag size="small">{{ v.valueType }}</el-tag>
            </div>
            <div class="var-item__line">
              <span class="var-item__line-label">公式编码</span>
              <code class="var-item__code">{{ v.code }}</code>
            </div>
            <div v-if="v.sourcePath" class="var-item__hint">{{
              formatVariableSourceHint(v.sourcePath)
            }}</div>
          </div>
        </div>
      </el-card>

      <div class="right-pane">
        <div class="rule-editor-toolbar">
          <span class="rule-editor-toolbar__label">编辑方式</span>
          <el-radio-group v-model="ruleEditorMode">
            <el-radio-button
              v-for="opt in RULE_EDITOR_MODE_OPTIONS"
              :key="opt.value"
              :label="opt.value"
            >
              {{ opt.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <RulesSimpleModeCard
          v-show="ruleEditorMode === RuleEditorModeEnum.SIMPLE"
          @apply="onSimplePresetApply"
        />

        <el-card v-show="ruleEditorMode === RuleEditorModeEnum.ADVANCED" shadow="never">
          <template #header>
            <div class="formula-head"><span>各科计算公式（留空则本科目不入账）</span></div>
          </template>
          <div class="segment-list">
            <div
              v-for="seg in PERFORMANCE_RULE_SCORE_SEGMENTS"
              :key="seg.pointsType"
              class="segment-block"
            >
              <div class="segment-head">
                <span class="segment-title">{{ seg.label }}</span>
                <el-tag v-if="seg.useCoAssigneeRefMany" size="small" type="warning" effect="plain"
                  >协作成员每人一笔</el-tag
                >
              </div>
              <p v-if="seg.hint" class="segment-hint">{{ seg.hint }}</p>
              <el-input
                v-model="segmentExprs[seg.pointsType]"
                type="textarea"
                :rows="3"
                spellcheck="false"
                placeholder="留空表示本科目不产生积分；支持数字常量或表达式"
                class="formula-editor"
              />
            </div>
          </div>
          <div class="formula-tip"
            >支持四则运算、括号、三元表达式；变量名须与左侧变量编码一致。</div
          >
        </el-card>

        <el-card shadow="never" class="sandbox-card">
          <template #header>
            <div class="sandbox-head">
              <div class="sandbox-title-wrap">
                <span class="sandbox-title">沙盒模拟测算</span>
                <span class="sandbox-subtitle"
                  >修改下方变量值，验证各科公式与边界情况是否符合预期</span
                >
              </div>
              <el-button type="primary" @click="runTest">运行测算</el-button>
            </div>
          </template>

          <div class="sandbox-layout">
            <div class="sandbox-params-section">
              <div class="sandbox-params-grid">
                <div class="sandbox-param-item">
                  <div class="param-label">
                    <span>任务所属领域</span>
                    <code class="param-code">workDomain</code>
                  </div>
                  <el-select
                    v-model="sandboxWorkDomain"
                    class="control-full"
                    placeholder="选择领域"
                    @change="runTest"
                  >
                    <el-option
                      v-for="opt in TASK_WORK_DOMAIN_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
                <div v-for="v in systemVars" :key="v.code" class="sandbox-param-item">
                  <div class="param-label">
                    <span>{{ v.label }}</span>
                    <code class="param-code">{{ v.code }}</code>
                  </div>
                  <el-input-number
                    v-model="sandbox[v.code]"
                    class="control-full"
                    :step="v.valueType === RuleVariableValueTypeEnum.FLOAT ? 0.1 : 1"
                    controls-position="right"
                  />
                </div>
              </div>
            </div>

            <div class="sandbox-result-section">
              <div class="result-header">测算明细与汇总</div>

              <div class="result-breakdown">
                <div v-for="row in segmentSandboxRows" :key="row.code" class="breakdown-row">
                  <span class="breakdown-label">{{ row.label }}</span>
                  <span
                    class="breakdown-value"
                    :class="{ 'is-error': row.display.includes('错误') }"
                    >{{ row.display }}</span
                  >
                </div>
                <div v-if="!segmentSandboxRows.length" class="breakdown-empty">
                  暂无数据，请点击「运行测算」
                </div>
              </div>

              <div class="result-total">
                <div class="total-label">
                  预估总积分
                  <el-tooltip
                    content="若产生协作分，实际结算时将按此单人分值，为每位协作人独立记一笔"
                    placement="top"
                  >
                    <span class="total-hint">(含单人协作分)</span>
                  </el-tooltip>
                </div>
                <div class="total-value">{{ testResult }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <RuleVersionsDialog
      v-model:visible="versionsVisible"
      :versions="versions"
      :loading="versionsLoading"
      :columns="versionColumns"
    />
    <RuleSetFormDialog
      v-model:visible="ruleSetDialogVisible"
      :mode="ruleSetDialogMode"
      :form="ruleSetForm"
      :project-options="projectOptions"
      :variable-drafts="variableDrafts"
      :columns="variableColumns"
      :saving="ruleSetDialogSaving"
      @save="saveRuleSet"
      @add-variable-draft="addVariableDraft"
      @reload-variable-drafts="loadVariableDraftsForDialog"
    />
    <RuleVersionPreviewDialog
      v-model:visible="versionPreviewVisible"
      :preview-version-no="previewVersionNo"
      :preview-data="previewData"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, h, onMounted, reactive, ref } from 'vue';
  import {
    ElInput,
    ElInputNumber,
    ElMessage,
    ElMessageBox,
    ElOption,
    ElRadioButton,
    ElRadioGroup,
    ElSelect,
    ElTooltip
  } from 'element-plus';
  import RuleSetFormDialog from './components/RuleSetFormDialog.vue';
  import RulesSimpleModeCard from './components/RulesSimpleModeCard.vue';
  import RuleVersionPreviewDialog from './components/RuleVersionPreviewDialog.vue';
  import RuleVersionsDialog from './components/RuleVersionsDialog.vue';
  import ArtTableRowActions from '@/components/core/forms/art-table-row-actions/index.vue';
  import {
    PERFORMANCE_RULE_SCORE_SEGMENT_KEYS,
    PERFORMANCE_RULE_SCORE_SEGMENTS,
    RULE_EDITOR_MODE_OPTIONS,
    RULE_VARIABLE_VALUE_TYPE_OPTIONS,
    RuleEditorModeEnum,
    RuleScopeEnum,
    RuleVariableValueTypeEnum,
    type PerformanceRuleScoreSegmentKey
  } from '@/enums/modules/performanceRulesEnum';
  import { TaskWorkDomainEnum, TASK_WORK_DOMAIN_OPTIONS } from '@/enums/modules/taskWorkDomainEnum';
  import {
    buildFormulaScoreDefinition,
    emptySegmentExprs,
    parseDefinitionToSegmentExprs
  } from './ruleDefinitionSegments';
  import { formatRuleWhenHuman } from './ruleConditionDisplay';
  import { FALLBACK_RULE_VARIABLE_LABEL_BY_CODE, formatVariableSourceHint } from './ruleVariableUi';
  import {
    fetchCreateRuleSet,
    fetchDeleteRuleSet,
    fetchProjectInfo,
    fetchProjectList,
    fetchRuleVariables,
    fetchPublishRuleSetVersion,
    fetchRuleSetList,
    fetchRuleSetVersionDetail,
    fetchRuleSetVersions,
    fetchSaveRuleSetDraft,
    fetchScoringRuleVersions,
    fetchSetActiveScoringRuleVersion,
    fetchUpsertRuleVariables,
    fetchUpdateRuleSet
  } from '@/api/task';
  import { formatDateTime } from '@/utils/date';

  defineOptions({ name: 'PerformanceRules' });

  const DEFAULT_BASE_EXPR = `baseScore * complexity - (workDomain === '${TaskWorkDomainEnum.SOFTWARE_DEVELOPMENT}' ? rejectCount * 5 : 0) + (aheadDays > 0 ? aheadDays * 2 : aheadDays * 5)`;

  const ruleEditorMode = ref(RuleEditorModeEnum.SIMPLE);

  const ruleSets = ref<Api.Task.RuleSet[]>([]);
  const selectedRuleSetId = ref<number | undefined>(undefined);
  const segmentExprs =
    reactive<Record<PerformanceRuleScoreSegmentKey, string>>(emptySegmentExprs());
  segmentExprs.base = DEFAULT_BASE_EXPR;

  const sandbox = reactive<Record<string, number>>({});
  /** 试算用：与结算快照 task.workDomain 一致，公式中的 workDomain 依赖此项 */
  const sandboxWorkDomain = ref<TaskWorkDomainEnum>(TaskWorkDomainEnum.SOFTWARE_DEVELOPMENT);
  const testResult = ref<number>(0);
  const segmentSandboxRows = ref<Array<{ code: string; label: string; display: string }>>([]);
  const versionsVisible = ref(false);
  const versionsLoading = ref(false);
  const versions = ref<Api.Task.RuleSetVersion[]>([]);

  const scoringVersionOptions = ref<Api.Task.ScoringRuleVersionOption[]>([]);
  /** null 表示清空指定，由系统自动择优 */
  const projectActiveVersionId = ref<number | null>(null);

  const systemVars = ref<Api.Task.RuleVariable[]>([]);
  const variableDrafts = ref<Api.Task.RuleVariable[]>([]);
  const ruleSetDialogVisible = ref(false);
  const ruleSetDialogSaving = ref(false);
  const ruleSetDialogMode = ref<'create' | 'edit'>('create');
  const projectOptions = ref<Api.Task.SimpleProject[]>([]);
  const ruleSetForm = reactive<Api.Task.CreateRuleSetParams>({
    code: '',
    name: '',
    scope: RuleScopeEnum.PROJECT,
    projectId: undefined
  });
  const versionPreviewVisible = ref(false);
  const previewVersionNo = ref<number | null>(null);
  const previewData = reactive<{
    ruleName: string;
    expression: string;
    /** 命中条件可读描述 */
    conditionText: string;
    variables: Array<{ code: string; label: string; sourceHint: string }>;
    segmentExpressions: Array<{ label: string; expression: string }>;
  }>({
    ruleName: '',
    expression: '',
    conditionText: '',
    variables: [],
    segmentExpressions: []
  });

  const currentRuleSet = computed(() =>
    ruleSets.value.find((r) => r.id === selectedRuleSetId.value)
  );

  const versionColumns = computed(() => [
    { type: 'index', label: '序号', width: 70 },
    { prop: 'version', label: '版本号', width: 100 },
    {
      prop: 'publishedAt',
      label: '发布时间',
      minWidth: 185,
      formatter: (row: Api.Task.RuleSetVersion) =>
        row.publishedAt ? formatDateTime(row.publishedAt) : ''
    },
    {
      prop: 'operation',
      label: '操作',
      width: 208,
      align: 'center',
      formatter: (row: Api.Task.RuleSetVersion) =>
        h(ArtTableRowActions, {
          items: [
            { key: 'preview', label: '查看内容', onClick: () => previewVersion(row.id) },
            { key: 'use', label: '载入此版本', onClick: () => useVersion(row.id) }
          ]
        })
    }
  ]);

  const variableColumns = computed(() => [
    { type: 'globalIndex', width: 60, label: '序号' },
    {
      prop: 'code',
      label: '编码',
      minWidth: 140,
      formatter: (row: Api.Task.RuleVariable) =>
        h(ElInput, {
          modelValue: row.code,
          'onUpdate:modelValue': (v: string) => (row.code = v)
        })
    },
    {
      prop: 'label',
      label: '名称',
      minWidth: 120,
      formatter: (row: Api.Task.RuleVariable) =>
        h(ElInput, {
          modelValue: row.label,
          'onUpdate:modelValue': (v: string) => (row.label = v)
        })
    },
    {
      prop: 'valueType',
      label: '类型',
      width: 130,
      formatter: (row: Api.Task.RuleVariable) =>
        h(
          ElSelect,
          {
            modelValue: row.valueType,
            'onUpdate:modelValue': (v: Api.Task.RuleVariable['valueType']) => (row.valueType = v)
          },
          {
            default: () => [
              ...RULE_VARIABLE_VALUE_TYPE_OPTIONS.map((item) =>
                h(ElOption, { label: item.label, value: item.value })
              )
            ]
          }
        )
    },
    {
      prop: 'sourcePath',
      label: '来源路径',
      minWidth: 180,
      formatter: (row: Api.Task.RuleVariable) =>
        h(ElInput, {
          modelValue: row.sourcePath,
          placeholder: '如 task.actualHours',
          'onUpdate:modelValue': (v: string) => (row.sourcePath = v)
        })
    },
    {
      prop: 'defaultValue',
      label: '默认值',
      width: 160,
      formatter: (row: Api.Task.RuleVariable) =>
        h(ElInput, {
          modelValue: row.defaultValue == null ? '' : String(row.defaultValue),
          type: 'number',
          placeholder: '请输入默认值',
          'onUpdate:modelValue': (v: string) => {
            const text = String(v ?? '').trim();
            row.defaultValue = text === '' ? null : Number(text);
          }
        })
    },
    {
      prop: 'sort',
      label: '排序',
      width: 150,
      formatter: (row: Api.Task.RuleVariable) =>
        h(ElInputNumber, {
          modelValue: Number(row.sort ?? 0),
          step: 1,
          controls: false,
          style: { width: '100%' },
          'onUpdate:modelValue': (v: number | undefined) => (row.sort = Number(v ?? 0))
        })
    }
  ]);

  function parseDefaultValue(value: unknown): number | null {
    if (value == null) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    // 兼容 Prisma Decimal JSON 结构：{ s, e, d }
    if (
      typeof value === 'object' &&
      value !== null &&
      's' in (value as any) &&
      'd' in (value as any)
    ) {
      const text = String(value as any);
      const n = Number(text);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  function normalizeFetchedVariables(vars: Api.Task.RuleVariable[]): Api.Task.RuleVariable[] {
    return vars.map((v) => ({
      ...v,
      defaultValue: parseDefaultValue(v.defaultValue),
      sort: Number(v.sort ?? 0)
    }));
  }

  /** 草稿中的变量 JSON（不含数据库 id，便于整套写入 rule_set.draftVariables） */
  function serializeVariablesForDraft(vars: Api.Task.RuleVariable[]) {
    const cleaned = vars
      .filter((v) => v.code && v.label && v.sourcePath)
      .map((v, idx) => ({
        code: v.code,
        label: v.label,
        valueType: v.valueType,
        description: v.description ?? null,
        sourcePath: v.sourcePath,
        defaultValue: v.defaultValue == null ? null : Number(v.defaultValue),
        scope: v.scope,
        projectId: v.projectId ?? null,
        enabled: v.enabled ?? true,
        sort: idx + 1
      }));
    return cleaned;
  }

  /** 按当前表单作用域/项目拉取变量草稿（新建前或弹窗内切换项目/作用域时） */
  async function loadVariableDraftsForDialog() {
    const projectId =
      ruleSetForm.scope === RuleScopeEnum.PROJECT
        ? (ruleSetForm.projectId ?? undefined)
        : undefined;
    const vars = await fetchRuleVariables({ projectId });
    variableDrafts.value = normalizeFetchedVariables(vars).map((v) => ({ ...v }));
  }

  function buildCleanedVariables(): Api.Task.RuleVariable[] | null {
    const cleaned = variableDrafts.value
      .filter((v) => v.code && v.label && v.sourcePath)
      .map((v, idx) => ({
        ...v,
        defaultValue: v.defaultValue == null ? null : Number(v.defaultValue),
        sort: idx + 1
      }));
    if (!cleaned.length) {
      ElMessage.warning('至少保留一个有效变量');
      return null;
    }
    return cleaned;
  }

  function hydrateSegmentsFromDefinition(def: unknown) {
    const merged = parseDefinitionToSegmentExprs(def);
    for (const k of PERFORMANCE_RULE_SCORE_SEGMENT_KEYS) {
      segmentExprs[k] = merged[k] ?? '';
    }
    if (!PERFORMANCE_RULE_SCORE_SEGMENT_KEYS.some((k) => segmentExprs[k].trim())) {
      segmentExprs.base = DEFAULT_BASE_EXPR;
    }
  }

  function evalFormulaLocal(expression: string, vars: Record<string, number>) {
    const merged: Record<string, unknown> = {
      ...vars,
      workDomain: sandboxWorkDomain.value,
      min: Math.min,
      max: Math.max,
      abs: Math.abs,
      round: Math.round
    };
    const names = Object.keys(merged);
    const values = names.map((k) => merged[k]);
    const fn = new Function(...names, `return (${expression});`);
    const ret = fn(...values);
    const normalized = Number(ret);
    if (!Number.isFinite(normalized)) return 0;
    return Number(normalized.toFixed(2));
  }

  function onSimplePresetApply(segments: Record<PerformanceRuleScoreSegmentKey, string>) {
    for (const k of PERFORMANCE_RULE_SCORE_SEGMENT_KEYS) {
      segmentExprs[k] = segments[k] ?? '';
    }
    runTest();
    ElMessage.success('已根据预设写入各科公式；可在「公式编辑」中微调后再保存草稿或发布');
  }

  function runTest() {
    const rows: Array<{ code: string; label: string; display: string }> = [];
    let sum = 0;
    let hasError = false;
    for (const seg of PERFORMANCE_RULE_SCORE_SEGMENTS) {
      const raw = segmentExprs[seg.pointsType].trim();
      if (!raw) {
        rows.push({ code: seg.pointsType, label: seg.label, display: '—' });
        continue;
      }
      try {
        const n = evalFormulaLocal(raw, sandbox);
        const rounded = Math.round(Number(n));
        rows.push({ code: seg.pointsType, label: seg.label, display: String(rounded) });
        sum += rounded;
      } catch (e: any) {
        hasError = true;
        rows.push({
          code: seg.pointsType,
          label: seg.label,
          display: `错误：${e?.message ?? '表达式无效'}`
        });
      }
    }
    segmentSandboxRows.value = rows;
    if (hasError) {
      testResult.value = 0;
      ElMessage.error('部分科目公式有误，请检查标红的试算结果');
      return;
    }
    testResult.value = sum;
  }

  async function loadRuleSets() {
    ruleSets.value = await fetchRuleSetList({});
    if (!selectedRuleSetId.value && ruleSets.value.length)
      selectedRuleSetId.value = ruleSets.value[0].id;
  }

  async function loadProjects() {
    projectOptions.value = await fetchProjectList();
  }

  async function openCreateRuleSet() {
    ruleSetDialogMode.value = 'create';
    ruleSetForm.code = '';
    ruleSetForm.name = '';
    ruleSetForm.scope = RuleScopeEnum.PROJECT;
    ruleSetForm.projectId = currentRuleSet.value?.projectId ?? undefined;
    await loadVariableDraftsForDialog();
    ruleSetDialogVisible.value = true;
  }

  function openEditRuleSet() {
    if (!currentRuleSet.value) {
      ElMessage.warning('请先选择规则集');
      return;
    }
    ruleSetDialogMode.value = 'edit';
    ruleSetForm.code = currentRuleSet.value.code;
    ruleSetForm.name = currentRuleSet.value.name;
    ruleSetForm.scope = (currentRuleSet.value.scope as RuleScopeEnum) ?? RuleScopeEnum.PROJECT;
    ruleSetForm.projectId = currentRuleSet.value.projectId ?? undefined;
    variableDrafts.value = systemVars.value.map((v) => ({ ...v }));
    ruleSetDialogVisible.value = true;
  }

  async function saveRuleSet() {
    if (!ruleSetForm.code || !ruleSetForm.name) {
      ElMessage.warning('编码和名称必填');
      return;
    }
    if (ruleSetForm.scope === RuleScopeEnum.PROJECT && !ruleSetForm.projectId) {
      ElMessage.warning('项目作用域必须选择关联项目');
      return;
    }
    const cleaned = buildCleanedVariables();
    if (!cleaned) return;

    ruleSetDialogSaving.value = true;
    try {
      if (ruleSetDialogMode.value === 'create') {
        const created = await fetchCreateRuleSet(ruleSetForm);
        selectedRuleSetId.value = created.id;
      } else if (currentRuleSet.value) {
        await fetchUpdateRuleSet(currentRuleSet.value.id, ruleSetForm);
      }
      await fetchUpsertRuleVariables({ variables: cleaned });
      ElMessage.success('规则集与变量已保存');
      ruleSetDialogVisible.value = false;
      await loadRuleSets();
      await loadRuleVariables();
      if (selectedRuleSetId.value) await onRuleSetChange();
      runTest();
    } finally {
      ruleSetDialogSaving.value = false;
    }
  }

  async function deleteCurrentRuleSet() {
    if (!currentRuleSet.value) {
      ElMessage.warning('请先选择规则集');
      return;
    }
    await ElMessageBox.confirm(`确认删除规则集「${currentRuleSet.value.name}」？`, '删除确认', {
      type: 'warning'
    });
    await fetchDeleteRuleSet(currentRuleSet.value.id);
    ElMessage.success('规则集已删除');
    selectedRuleSetId.value = undefined;
    await loadRuleSets();
    await onRuleSetChange();
  }

  async function loadRuleVariables() {
    const rs = currentRuleSet.value;
    const projectId = rs?.projectId ?? undefined;

    const draftVars = rs?.draftVariables;
    if (Array.isArray(draftVars) && draftVars.length > 0) {
      const normalized = normalizeFetchedVariables(draftVars as Api.Task.RuleVariable[]);
      systemVars.value = normalized;
      variableDrafts.value = normalized.map((v) => ({ ...v }));
      for (const v of normalized) {
        sandbox[v.code] = Number(v.defaultValue ?? 0);
      }
      return;
    }

    const vars = await fetchRuleVariables({ projectId: projectId ?? undefined });
    const normalized = normalizeFetchedVariables(vars);
    systemVars.value = normalized;
    variableDrafts.value = normalized.map((v) => ({ ...v }));
    for (const v of normalized) {
      sandbox[v.code] = Number(v.defaultValue ?? 0);
    }
  }

  async function loadScoringActivationIfNeeded() {
    const pid = currentRuleSet.value?.projectId;
    if (!pid) {
      scoringVersionOptions.value = [];
      projectActiveVersionId.value = null;
      return;
    }
    try {
      const [opts, proj] = await Promise.all([
        fetchScoringRuleVersions(pid),
        fetchProjectInfo(pid)
      ]);
      scoringVersionOptions.value = opts ?? [];
      projectActiveVersionId.value = proj?.activeRuleSetVersionId ?? null;
    } catch {
      scoringVersionOptions.value = [];
    }
  }

  async function onActiveScoringVersionChange(val: number | string | null | undefined) {
    const pid = currentRuleSet.value?.projectId;
    if (!pid) return;
    const num = val === '' || val === undefined || val === null ? null : Number(val);
    try {
      await fetchSetActiveScoringRuleVersion(pid, {
        activeRuleSetVersionId: Number.isFinite(num as number) ? (num as number) : null
      });
      ElMessage.success('已更新生效规则版本');
    } catch {
      /* 拦截器 */
    }
  }

  function addVariableDraft() {
    variableDrafts.value.push({
      code: '',
      label: '',
      valueType: RuleVariableValueTypeEnum.NUMBER,
      sourcePath: '',
      defaultValue: 0,
      scope: RuleScopeEnum.GLOBAL,
      enabled: true,
      sort: variableDrafts.value.length + 1
    });
  }

  async function onRuleSetChange() {
    await loadRuleSets();
    if (!selectedRuleSetId.value) return;

    await loadRuleVariables();

    const rs = currentRuleSet.value;
    let usedDraftDef = false;
    const draftDef = rs?.draftDefinition;
    if (draftDef && typeof draftDef === 'object') {
      const rules = (draftDef as { rules?: unknown }).rules;
      if (Array.isArray(rules) && rules.length > 0) {
        hydrateSegmentsFromDefinition(draftDef);
        usedDraftDef = true;
      }
    }

    if (!usedDraftDef) {
      const list = await fetchRuleSetVersions(selectedRuleSetId.value);
      if (!list.length) {
        hydrateSegmentsFromDefinition({});
      } else {
        const detail = await fetchRuleSetVersionDetail(list[0].id);
        hydrateSegmentsFromDefinition(detail.definition ?? {});
      }
    }

    runTest();
    await loadScoringActivationIfNeeded();
  }

  async function saveAsNewVersion() {
    if (!selectedRuleSetId.value) {
      ElMessage.warning('请先选择规则集');
      return;
    }
    const definition = buildFormulaScoreDefinition(
      segmentExprs,
      systemVars.value.map((v) => ({ code: v.code, sourcePath: v.sourcePath }))
    );
    const thenLen = Array.isArray((definition.rules as any)?.[0]?.then)
      ? (definition.rules as any)[0].then.length
      : 0;
    if (!thenLen) {
      ElMessage.warning('至少填写一科公式后再保存');
      return;
    }
    await fetchPublishRuleSetVersion(selectedRuleSetId.value, {
      definition
    });
    ElMessage.success('已保存为新版本');
    await loadRuleSets();
    await onRuleSetChange();
  }

  async function saveDraft() {
    if (!selectedRuleSetId.value) {
      ElMessage.warning('请先选择规则集');
      return;
    }
    const definition = buildFormulaScoreDefinition(
      segmentExprs,
      systemVars.value.map((v) => ({ code: v.code, sourcePath: v.sourcePath }))
    );
    const varsJson = serializeVariablesForDraft(systemVars.value);
    const thenLen = Array.isArray((definition.rules as any)?.[0]?.then)
      ? (definition.rules as any)[0].then.length
      : 0;
    const hasFormula = thenLen > 0;
    const hasVars = varsJson.length > 0;
    if (!hasFormula && !hasVars) {
      ElMessage.warning('请至少填写部分公式或变量后再保存草稿');
      return;
    }
    const payload: { definition?: Record<string, unknown>; variables?: unknown[] } = {};
    if (hasFormula) payload.definition = definition as Record<string, unknown>;
    if (hasVars) payload.variables = varsJson;
    await fetchSaveRuleSetDraft(selectedRuleSetId.value, payload);
    ElMessage.success('草稿已保存');
    await loadRuleSets();
    await onRuleSetChange();
  }

  async function openVersions() {
    if (!selectedRuleSetId.value) {
      ElMessage.warning('请先选择规则集');
      return;
    }
    versionsVisible.value = true;
    versionsLoading.value = true;
    versions.value = await fetchRuleSetVersions(selectedRuleSetId.value);
    versionsLoading.value = false;
  }

  async function previewVersion(versionId: number) {
    const detail = await fetchRuleSetVersionDetail(versionId);
    const def: any = detail.definition ?? {};
    const firstRule = def?.rules?.[0] ?? {};
    previewVersionNo.value = detail.version;
    previewData.ruleName = String(firstRule?.name ?? '');
    const merged = parseDefinitionToSegmentExprs(def);
    previewData.segmentExpressions = PERFORMANCE_RULE_SCORE_SEGMENTS.map((s) => ({
      label: s.label,
      expression: merged[s.pointsType]?.trim() ? merged[s.pointsType] : '—'
    }));
    const primaryExpr =
      merged.base?.trim() ||
      PERFORMANCE_RULE_SCORE_SEGMENT_KEYS.map((k) => merged[k]).find((t) => t?.trim()) ||
      '';
    previewData.expression = primaryExpr || '—';
    previewData.conditionText = formatRuleWhenHuman(firstRule?.when);
    const labelByCode = new Map(systemVars.value.map((x) => [x.code, (x.label ?? '').trim()]));
    previewData.variables = Array.isArray(def?.variables)
      ? def.variables.map((v: any) => {
          const code = String(v?.code ?? '');
          const path = String(v?.expr?.path ?? '');
          const fromCfg = labelByCode.get(code);
          const label =
            (fromCfg && fromCfg.length > 0 ? fromCfg : null) ??
            FALLBACK_RULE_VARIABLE_LABEL_BY_CODE[code] ??
            code;
          return {
            code,
            label,
            sourceHint: formatVariableSourceHint(path)
          };
        })
      : [];
    versionPreviewVisible.value = true;
  }

  async function useVersion(versionId: number) {
    const detail = await fetchRuleSetVersionDetail(versionId);
    const def: any = detail.definition ?? {};
    const merged = parseDefinitionToSegmentExprs(def);
    const anyExpr = PERFORMANCE_RULE_SCORE_SEGMENT_KEYS.some((k) => merged[k]?.trim());
    if (!anyExpr) {
      ElMessage.warning('该版本无法解析出公式（可能非 JSON 规则），无法自动回填');
      return;
    }
    hydrateSegmentsFromDefinition(def);
    runTest();
    versionsVisible.value = false;
    ElMessage.success(`已载入版本 ${detail.version}`);
  }

  onMounted(async () => {
    await loadProjects();
    await onRuleSetChange();
  });
</script>

<style scoped>
  .rules-page {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rule-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--art-main-bg-color, #fff);
    border-radius: 10px;
    padding: 14px 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }
  .title {
    font-size: 18px;
    font-weight: 700;
  }
  .sub {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }
  .ops {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .draft-banner {
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--el-color-warning-light-9);
    border: 1px solid var(--el-color-warning-light-5);
    color: var(--el-text-color-regular);
    font-size: 13px;
  }
  .rule-project-active {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--art-main-bg-color, #fff);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }
  .rule-project-active__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .rule-project-active__label {
    font-size: 14px;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }
  .rule-project-active__select {
    width: min(100%, 440px);
    flex: 1;
    min-width: 200px;
  }
  .rule-project-active__hint {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.55;
  }
  .rule-project-active__hint strong {
    font-weight: 600;
    color: var(--el-text-color-regular);
  }
  .rule-main {
    display: flex;
    gap: 12px;
  }
  .left-card {
    width: 320px;
    flex-shrink: 0;
  }
  .right-pane {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rule-editor-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--art-main-bg-color, #fff);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
  }
  .rule-editor-toolbar__label {
    font-size: 14px;
    color: var(--el-text-color-regular);
  }
  .var-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .var-item {
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 10px;
  }
  .var-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    gap: 8px;
  }
  .var-item__label {
    font-weight: 600;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
  .var-item__line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    margin-bottom: 4px;
  }
  .var-item__line-label {
    color: var(--el-text-color-secondary);
  }
  .var-item__code {
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    font-size: 12px;
    color: #1f8f6f;
    padding: 0 4px;
    background: var(--el-fill-color-light);
    border-radius: 4px;
  }
  .var-item__hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.45;
  }
  .formula-editor :deep(textarea) {
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    font-size: 14px;
    color: rgb(52, 211, 153);
    background-color: rgb(17, 24, 9);
  }
  .formula-tip {
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  .segment-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .segment-block {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 10px 12px;
    background: var(--el-fill-color-extra-light);
  }
  .segment-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .segment-title {
    font-weight: 600;
    font-size: 14px;
  }
  .segment-hint {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.45;
  }

  .control-full {
    width: 100%;
  }

  /* ================= 新沙盒样式 ================= */
  .sandbox-card {
    margin-top: 12px;
    border-radius: 8px;
  }
  .sandbox-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sandbox-title-wrap {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .sandbox-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .sandbox-subtitle {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    font-weight: normal;
  }

  .sandbox-layout {
    display: flex;
    gap: 24px;
    align-items: stretch;
  }

  .sandbox-params-section {
    flex: 1;
    min-width: 0;
  }
  .sandbox-params-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
  .sandbox-param-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .param-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
  .param-code {
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    font-size: 12px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    padding: 2px 4px;
    border-radius: 4px;
  }

  .sandbox-result-section {
    width: 320px;
    flex-shrink: 0;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 1200px) {
    .sandbox-layout {
      flex-direction: column;
    }
    .sandbox-result-section {
      width: 100%;
    }
  }

  .result-header {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
  }

  .result-breakdown {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }
  .breakdown-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--el-text-color-regular);
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--el-border-color-lighter);
  }
  .breakdown-value {
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-size: 14px;
  }
  .breakdown-value.is-error {
    color: var(--el-color-danger);
    font-size: 12px;
    font-family: inherit;
  }
  .breakdown-empty {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
    text-align: center;
    padding: 20px 0;
  }

  .result-total {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-light);
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .total-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .total-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: normal;
    cursor: help;
    border-bottom: 1px dotted var(--el-text-color-secondary);
  }
  .total-value {
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    font-size: 32px;
    font-weight: 800;
    color: var(--el-color-success);
    line-height: 1;
    letter-spacing: -0.5px;
  }
</style>
