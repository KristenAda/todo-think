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
        <el-button @click="openVariableConfig">变量配置</el-button>
        <el-button @click="openVersions">查看历史版本</el-button>
        <el-button type="primary" @click="saveAsNewVersion">保存为新版本</el-button>
      </div>
    </div>

    <div class="rule-main">
      <el-card shadow="never" class="left-card">
        <template #header><span>系统注入变量</span></template>
        <div class="var-list">
          <div v-for="v in systemVars" :key="v.code" class="var-item">
            <div class="var-head">
              <span>{{ v.label }}</span>
              <el-tag size="small">{{ v.valueType }}</el-tag>
            </div>
            <div class="var-key">{{ v.code }}</div>
          </div>
        </div>
      </el-card>

      <div class="right-pane">
        <el-card shadow="never">
          <template #header>
            <div class="formula-head"><span>计算公式表达式</span></div>
          </template>
          <el-input
            v-model="formulaExpr"
            type="textarea"
            :rows="6"
            spellcheck="false"
            placeholder="例如：baseScore * complexity - (rejectCount * 5) + (aheadDays > 0 ? aheadDays * 2 : aheadDays * 5)"
            class="formula-editor"
          />
          <div class="formula-tip">支持四则运算、括号、三元表达式；变量来自左侧注入变量。</div>
        </el-card>

        <el-card shadow="never" style="margin-top: 12px">
          <template #header>
            <div class="sandbox-head">
              <span>规则试算沙盒</span>
              <el-button type="primary" plain @click="runTest">运行试算</el-button>
            </div>
          </template>
          <div class="sandbox-grid">
            <el-input-number
              v-for="v in systemVars"
              :key="v.code"
              v-model="sandbox[v.code]"
              :step="v.valueType === RuleVariableValueTypeEnum.FLOAT ? 0.1 : 1"
              controls-position="right"
            />
          </div>
          <div class="sandbox-labels">
            <span v-for="v in systemVars" :key="v.code">{{ v.code }}（{{ v.label }}）</span>
          </div>
          <div class="result-box"
            >试算结果（Final Score）：<b>{{ testResult }}</b></div
          >
        </el-card>
      </div>
    </div>

    <RuleVersionsDialog
      v-model:visible="versionsVisible"
      :versions="versions"
      :loading="versionsLoading"
      :columns="versionColumns"
    />
    <RuleVariableConfigDialog
      v-model:visible="variableConfigVisible"
      :variable-drafts="variableDrafts"
      :columns="variableColumns"
      @add-variable-draft="addVariableDraft"
      @save-variable-config="saveVariableConfig"
    />
    <RuleSetFormDialog
      v-model:visible="ruleSetDialogVisible"
      :mode="ruleSetDialogMode"
      :form="ruleSetForm"
      :project-options="projectOptions"
      @save="saveRuleSet"
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
    ElButton,
    ElInput,
    ElInputNumber,
    ElMessage,
    ElMessageBox,
    ElOption,
    ElSelect
  } from 'element-plus';
  import RuleSetFormDialog from './components/RuleSetFormDialog.vue';
  import RuleVariableConfigDialog from './components/RuleVariableConfigDialog.vue';
  import RuleVersionPreviewDialog from './components/RuleVersionPreviewDialog.vue';
  import RuleVersionsDialog from './components/RuleVersionsDialog.vue';
  import {
    RULE_VARIABLE_VALUE_TYPE_OPTIONS,
    RuleScopeEnum,
    RuleVariableValueTypeEnum
  } from '@/enums/modules/performanceRulesEnum';
  import {
    fetchCreateRuleSet,
    fetchDeleteRuleSet,
    fetchProjectList,
    fetchRuleVariables,
    fetchPublishRuleSetVersion,
    fetchRuleSetList,
    fetchRuleSetVersionDetail,
    fetchRuleSetVersions,
    fetchUpsertRuleVariables,
    fetchUpdateRuleSet
  } from '@/api/task';

  defineOptions({ name: 'PerformanceRules' });

  const ruleSets = ref<Api.Task.RuleSet[]>([]);
  const selectedRuleSetId = ref<number | undefined>(undefined);
  const formulaExpr = ref(
    'baseScore * complexity - (rejectCount * 5) + (aheadDays > 0 ? aheadDays * 2 : aheadDays * 5)'
  );
  const sandbox = reactive<Record<string, number>>({});
  const testResult = ref<number>(0);
  const versionsVisible = ref(false);
  const versionsLoading = ref(false);
  const versions = ref<Api.Task.RuleSetVersion[]>([]);

  const systemVars = ref<Api.Task.RuleVariable[]>([]);
  const variableConfigVisible = ref(false);
  const variableDrafts = ref<Api.Task.RuleVariable[]>([]);
  const ruleSetDialogVisible = ref(false);
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
    conditionText: string;
    variables: Array<{ code: string; path: string }>;
  }>({
    ruleName: '',
    expression: '',
    conditionText: '',
    variables: []
  });

  const currentRuleSet = computed(() =>
    ruleSets.value.find((r) => r.id === selectedRuleSetId.value)
  );

  const versionColumns = computed(() => [
    { type: 'index', label: '序号', width: 70 },
    { prop: 'version', label: '版本号', width: 100 },
    { prop: 'publishedAt', label: '发布时间', minWidth: 200 },
    {
      prop: 'operation',
      label: '操作',
      width: 220,
      formatter: (row: Api.Task.RuleSetVersion) =>
        h('div', { class: 'op-cell' }, [
          h(
            ElButton,
            { size: 'small', onClick: () => previewVersion(row.id) },
            { default: () => '查看内容' }
          ),
          h(
            ElButton,
            { size: 'small', type: 'primary', onClick: () => useVersion(row.id) },
            { default: () => '载入此版本' }
          )
        ])
    }
  ]);

  const variableColumns = computed(() => [
    { type: 'index', label: '序号', width: 70 },
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

  function buildFormulaDefinition(expression: string) {
    return {
      params: {},
      variables: systemVars.value.map((v) => ({
        code: v.code,
        expr: { path: v.sourcePath }
      })),
      rules: [
        {
          id: 'formula_score_rule',
          name: '公式计算积分',
          priority: 100,
          when: { op: 'gt', left: { path: 'task.mainAssigneeId' }, right: 0 },
          then: [
            {
              type: 'emitPosting',
              subject: { ref: 'task.mainAssigneeId' },
              pointsType: 'base',
              amount: { fn: 'formula', args: [expression] },
              reasonCode: 'FORMULA_SCORE'
            }
          ]
        }
      ]
    };
  }

  function evalFormulaLocal(expression: string, vars: Record<string, number>) {
    const names = Object.keys(vars);
    const values = Object.values(vars).map((value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    });
    const fn = new Function(...names, `return (${expression});`);
    const ret = fn(...values);
    const normalized = Number(ret);
    if (!Number.isFinite(normalized)) return 0;
    return Number(normalized.toFixed(2));
  }

  function runTest() {
    try {
      testResult.value = evalFormulaLocal(formulaExpr.value, sandbox);
    } catch (e: any) {
      ElMessage.error(`公式有误：${e?.message ?? '请检查表达式'}`);
    }
  }

  async function loadRuleSets() {
    ruleSets.value = await fetchRuleSetList({});
    if (!selectedRuleSetId.value && ruleSets.value.length)
      selectedRuleSetId.value = ruleSets.value[0].id;
  }

  async function loadProjects() {
    projectOptions.value = await fetchProjectList();
  }

  function openCreateRuleSet() {
    ruleSetDialogMode.value = 'create';
    ruleSetForm.code = '';
    ruleSetForm.name = '';
    ruleSetForm.scope = RuleScopeEnum.PROJECT;
    ruleSetForm.projectId = currentRuleSet.value?.projectId ?? undefined;
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
    if (ruleSetDialogMode.value === 'create') {
      const created = await fetchCreateRuleSet(ruleSetForm);
      selectedRuleSetId.value = created.id;
      ElMessage.success('规则集创建成功');
    } else if (currentRuleSet.value) {
      await fetchUpdateRuleSet(currentRuleSet.value.id, ruleSetForm);
      ElMessage.success('规则集修改成功');
    }
    ruleSetDialogVisible.value = false;
    await loadRuleSets();
    await onRuleSetChange();
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
    const projectId = currentRuleSet.value?.projectId ?? undefined;
    const vars = await fetchRuleVariables({ projectId: projectId ?? undefined });
    const normalized = vars.map((v) => ({
      ...v,
      defaultValue: parseDefaultValue(v.defaultValue),
      sort: Number(v.sort ?? 0)
    }));
    systemVars.value = normalized;
    variableDrafts.value = normalized.map((v) => ({ ...v }));
    for (const v of normalized) {
      sandbox[v.code] = Number(v.defaultValue ?? 0);
    }
  }

  function openVariableConfig() {
    variableDrafts.value = systemVars.value.map((v) => ({ ...v }));
    variableConfigVisible.value = true;
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

  async function saveVariableConfig() {
    const cleaned = variableDrafts.value
      .filter((v) => v.code && v.label && v.sourcePath)
      .map((v, idx) => ({
        ...v,
        defaultValue: v.defaultValue == null ? null : Number(v.defaultValue),
        sort: idx + 1
      }));
    if (!cleaned.length) {
      ElMessage.warning('至少保留一个有效变量');
      return;
    }
    await fetchUpsertRuleVariables({ variables: cleaned });
    ElMessage.success('变量配置已保存');
    variableConfigVisible.value = false;
    await loadRuleVariables();
    runTest();
  }

  async function onRuleSetChange() {
    if (!selectedRuleSetId.value) return;
    await loadRuleVariables();
    const list = await fetchRuleSetVersions(selectedRuleSetId.value);
    if (!list.length) return;
    const detail = await fetchRuleSetVersionDetail(list[0].id);
    const def: any = detail.definition ?? {};
    const expr = def?.rules?.[0]?.then?.[0]?.amount?.args?.[0];
    if (typeof expr === 'string' && expr.trim()) {
      formulaExpr.value = expr;
      runTest();
    }
  }

  async function saveAsNewVersion() {
    if (!selectedRuleSetId.value) {
      ElMessage.warning('请先选择规则集');
      return;
    }
    await fetchPublishRuleSetVersion(selectedRuleSetId.value, {
      definition: buildFormulaDefinition(formulaExpr.value)
    });
    ElMessage.success('已保存为新版本');
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
    const firstAction = firstRule?.then?.[0] ?? {};
    previewVersionNo.value = detail.version;
    previewData.ruleName = String(firstRule?.name ?? '');
    previewData.expression = String(firstAction?.amount?.args?.[0] ?? '');
    previewData.conditionText = firstRule?.when ? JSON.stringify(firstRule.when) : '';
    previewData.variables = Array.isArray(def?.variables)
      ? def.variables.map((v: any) => ({
          code: String(v?.code ?? ''),
          path: String(v?.expr?.path ?? '')
        }))
      : [];
    versionPreviewVisible.value = true;
  }

  async function useVersion(versionId: number) {
    const detail = await fetchRuleSetVersionDetail(versionId);
    const def: any = detail.definition ?? {};
    const expr = def?.rules?.[0]?.then?.[0]?.amount?.args?.[0];
    if (typeof expr === 'string' && expr.trim()) {
      formulaExpr.value = expr;
      runTest();
      versionsVisible.value = false;
      ElMessage.success(`已载入版本 ${detail.version}`);
    } else {
      ElMessage.warning('该版本不是公式型规则，无法自动回填');
    }
  }

  onMounted(async () => {
    await loadProjects();
    await loadRuleSets();
    await loadRuleVariables();
    await onRuleSetChange();
    runTest();
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
    margin-bottom: 4px;
  }
  .var-key {
    font-family: Consolas, Monaco, monospace;
    color: #1f8f6f;
    font-size: 13px;
  }
  .formula-editor :deep(textarea) {
    font-family: Consolas, Monaco, monospace;
    font-size: 14px;
    color: rgb(52, 211, 153);
    background-color: rgb(17, 24, 9);
  }
  .formula-tip {
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  .sandbox-head,
  .formula-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sandbox-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(120px, 1fr));
    gap: 10px;
  }
  .sandbox-labels {
    margin-top: 8px;
    display: grid;
    grid-template-columns: repeat(4, minmax(120px, 1fr));
    gap: 10px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  .result-box {
    margin-top: 14px;
    font-size: 16px;
  }
  .result-box b {
    color: #177a63;
    font-size: 34px;
    margin-left: 8px;
  }
  .op-cell {
    display: flex;
    gap: 8px;
    align-items: center;
  }
</style>
