<template>
  <el-card shadow="never" class="simple-mode-card">
    <template #header>
      <div class="simple-mode-card__head">
        <span class="card-title">简单配置</span>
        <span class="card-hint">
          选择预设并填参数，点击应用后会自动生成并写入各科公式（您后续可在「公式编辑」中进行微调）
        </span>
      </div>
    </template>

    <el-form label-position="top" class="simple-form" @submit.prevent>
      <div class="preset-section">
        <el-form-item label="预设模板" class="preset-form-item">
          <el-select v-model="presetId" class="control-full" size="large">
            <el-option
              v-for="opt in RULE_SIMPLE_PRESET_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            >
              <div class="preset-option">
                <span class="preset-option__label">{{ opt.label }}</span>
                <span class="preset-option__desc">{{ opt.desc }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <div v-if="presetDesc" class="preset-desc-box">
          <el-icon class="preset-desc-icon"><InfoFilled /></el-icon>
          <span>{{ presetDesc }}</span>
        </div>
      </div>

      <el-divider border-style="dashed" />

      <template v-if="presetId === RuleSimplePresetEnum.STANDARD_SCORECARD">
        <div class="standard-scorecard-hint">
          <p class="standard-scorecard-hint__title">无需填写参数，将自动生成各科公式：</p>
          <ul class="standard-scorecard-hint__list">
            <li>
              <strong>基础分</strong>：软件开发领域为 baseScore×复杂度 −
              验收打回×5；其它领域不在此项扣打回（避免与质量分重复）
            </li>
            <li>
              <strong>质量分</strong>：软件开发为 −testCaseBugCount×5（用例缺陷）；其它领域为
              −rejectCount×5（验收打回）
            </li>
            <li><strong>时效分</strong>：按 aheadDays 区分提前奖励 / 延期惩罚（2 / 5）</li>
            <li><strong>奖励分</strong>：无打回时 +5（rejectCount &lt; 1）</li>
            <li>
              <strong>协作分</strong>：每位协作成员 <code>baseScore×0.15</code>（无协作成员时不发）
            </li>
          </ul>
        </div>
      </template>

      <template v-if="presetId === RuleSimplePresetEnum.BALANCED">
        <el-row :gutter="24">
          <el-col :xs="24" :sm="12">
            <el-form-item label="软件开发：基础分中的打回扣分 (rejectCount 系数)">
              <el-input-number
                v-model="balanced.rejectPenalty"
                class="control-full"
                :min="0"
                :step="1"
                controls-position="right"
              />
              <div class="field-hint">
                仅<strong>软件开发</strong>领域任务的基础分会扣打回；其它领域打回仅在「质量分」科目体现。
              </div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="提前完成：每天奖励 (aheadDays > 0)">
              <el-input-number
                v-model="balanced.aheadBonusPerDay"
                class="control-full"
                :min="0"
                :step="0.5"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :xs="24" :sm="12">
            <el-form-item label="延期侧：aheadDays 系数 (通常为罚分)">
              <el-input-number
                v-model="balanced.delayPenaltyPerDay"
                class="control-full"
                :min="0"
                :step="0.5"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="协作分成比例">
              <el-input-number
                v-model="balanced.collaborationRatio"
                class="control-full"
                :min="0"
                :max="2"
                :step="0.05"
                controls-position="right"
              />
              <div class="field-hint">
                填 <strong>0</strong> 表示<strong>不发协作分</strong>（协作科目留空）。大于 0
                时，每位协作成员单独入账「单人分值」：<code>baseScore × 该比例</code>。
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :xs="24" :sm="12">
            <el-form-item label="质量分系数（研发=用例缺陷，其它=验收打回）">
              <el-input-number
                v-model="balanced.bugPenaltyPer"
                class="control-full"
                :min="0"
                :step="1"
                controls-position="right"
              />
              <div class="field-hint">
                软件开发：按累计用例缺陷 testCaseBugCount 扣分；其它领域：按验收打回次数 rejectCount
                扣分（与「基础分」中的打回扣分互斥，仅研发在基础分扣打回）。填 0
                表示不写「质量分」科目。
              </div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="奖励：无打回加分 (rejectCount &lt; 1 时)">
              <el-input-number
                v-model="balanced.noRejectBonus"
                class="control-full"
                :min="0"
                :step="1"
                controls-position="right"
              />
              <div class="field-hint">填 0 表示不写「奖励分」科目。</div>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <template v-if="presetId === RuleSimplePresetEnum.BASE_ONLY">
        <el-form-item label="基础分计算">
          <el-checkbox v-model="baseOnly.useComplexity" border>
            乘以复杂度系数 (baseScore * complexity)
          </el-checkbox>
        </el-form-item>
      </template>

      <template v-if="presetId === RuleSimplePresetEnum.HOURS_WEIGHTED">
        <el-row :gutter="24">
          <el-col :xs="24" :sm="12">
            <el-form-item label="每小时分值">
              <el-input-number
                v-model="hours.ratePerHour"
                class="control-full"
                :min="0"
                :step="0.5"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="计入上限 (小时)">
              <el-input-number
                v-model="hours.capHours"
                class="control-full"
                :min="0.5"
                :step="1"
                controls-position="right"
              />
              <div class="field-hint"> 限制可转化为积分的最大工时数，防止过量登记。 </div>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="formula-highlight">
          <p>
            基础分：<code>min(actualHours, {{ hours.capHours }}) * {{ hours.ratePerHour }}</code>
          </p>
          <p class="formula-highlight__sub">
            另附质量（研发=用例缺陷，其它=验收打回）、时效、奖励为常用默认式（与「标准五科」中非工时部分一致）；可在高级模式中再改。
          </p>
        </div>
      </template>

      <div class="preview-section">
        <el-collapse class="custom-collapse">
          <el-collapse-item name="preview">
            <template #title>
              <div class="collapse-title">
                <el-icon><View /></el-icon>
                预览将写入的各科表达式
              </div>
            </template>
            <div class="code-preview-grid">
              <div v-for="row in previewRows" :key="row.key" class="code-row">
                <div class="code-key">{{ row.label }}</div>
                <div class="code-val" :class="{ 'is-empty': row.text === '（留空）' }">
                  {{ row.text }}
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <div class="form-actions">
        <el-button type="default" size="large" class="apply-btn" plain @click="emitApply">
          生成并应用到各科公式
        </el-button>
      </div>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { InfoFilled, View } from '@element-plus/icons-vue';
  import {
    PERFORMANCE_RULE_SCORE_SEGMENTS,
    RULE_SIMPLE_PRESET_OPTIONS,
    RuleSimplePresetEnum
  } from '@/enums/modules/performanceRulesEnum';
  import {
    compileSimplePresetToSegmentExprs,
    defaultBalancedParams,
    defaultBaseOnlyParams,
    defaultHoursWeightedParams,
    type BalancedSimpleParams,
    type BaseOnlySimpleParams,
    type HoursWeightedSimpleParams
  } from '../simpleRulePresets';
  import type { PerformanceRuleScoreSegmentKey } from '@/enums/modules/performanceRulesEnum';

  const emit = defineEmits<{
    apply: [segments: Record<PerformanceRuleScoreSegmentKey, string>];
  }>();

  const presetId = ref(RuleSimplePresetEnum.STANDARD_SCORECARD);
  const balanced = reactive<BalancedSimpleParams>(defaultBalancedParams());
  const baseOnly = reactive<BaseOnlySimpleParams>(defaultBaseOnlyParams());
  const hours = reactive<HoursWeightedSimpleParams>(defaultHoursWeightedParams());

  const presetDesc = computed(
    () => RULE_SIMPLE_PRESET_OPTIONS.find((o) => o.value === presetId.value)?.desc ?? ''
  );

  function segmentChineseLabel(code: PerformanceRuleScoreSegmentKey): string {
    return PERFORMANCE_RULE_SCORE_SEGMENTS.find((s) => s.pointsType === code)?.label ?? code;
  }

  const previewRows = computed(() => {
    const seg = compileSimplePresetToSegmentExprs(presetId.value, balanced, baseOnly, hours);
    const keys: PerformanceRuleScoreSegmentKey[] = [
      'base',
      'quality',
      'timeliness',
      'bonus',
      'collaboration'
    ];
    return keys.map((k) => ({
      key: k,
      label: segmentChineseLabel(k),
      text: seg[k]?.trim() ? String(seg[k]) : '（留空）'
    }));
  });

  function resetWizard() {
    presetId.value = RuleSimplePresetEnum.STANDARD_SCORECARD;
    Object.assign(balanced, defaultBalancedParams());
    Object.assign(baseOnly, defaultBaseOnlyParams());
    Object.assign(hours, defaultHoursWeightedParams());
  }

  defineExpose({ resetWizard });

  function emitApply() {
    const segments = compileSimplePresetToSegmentExprs(presetId.value, balanced, baseOnly, hours);
    emit('apply', segments);
  }
</script>

<style scoped>
  /* 卡片头部 */
  .simple-mode-card {
    border-radius: 8px;
  }
  .simple-mode-card__head {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .card-hint {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }

  /* 表单通用 */
  .control-full {
    width: 100%;
  }
  .simple-form :deep(.el-form-item__label) {
    font-weight: 500;
    padding-bottom: 8px;
    color: var(--el-text-color-primary);
  }

  /* 预设选择区 */
  .preset-section {
    margin-bottom: 8px;
  }
  .preset-form-item {
    margin-bottom: 12px;
  }
  .preset-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  .preset-option__desc {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-left: 16px;
  }
  .preset-desc-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 16px;
    background-color: var(--el-color-primary-light-9);
    border-radius: 6px;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.5;
  }
  .preset-desc-icon {
    margin-top: 2px;
    color: var(--el-color-primary);
  }

  /* 辅助文本 */
  .field-hint {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
  .field-hint code {
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    background-color: var(--el-fill-color-light);
    padding: 2px 4px;
    border-radius: 4px;
    color: var(--el-color-primary);
  }
  .formula-highlight {
    margin-top: 8px;
    margin-bottom: 20px;
    padding: 12px 16px;
    background-color: var(--el-fill-color-lighter);
    border-left: 3px solid var(--el-color-primary);
    border-radius: 0 4px 4px 0;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
  .formula-highlight code {
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    font-weight: 600;
    color: var(--el-color-primary);
  }
  .formula-highlight__sub {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }

  .standard-scorecard-hint {
    margin-bottom: 4px;
    padding: 12px 14px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.55;
  }
  .standard-scorecard-hint__title {
    margin: 0 0 8px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .standard-scorecard-hint__list {
    margin: 0;
    padding-left: 1.2em;
  }
  .standard-scorecard-hint__list li {
    margin-bottom: 6px;
  }
  .standard-scorecard-hint__list li:last-child {
    margin-bottom: 0;
  }

  /* 预览区 */
  .preview-section {
    margin-top: 24px;
    margin-bottom: 24px;
  }
  .custom-collapse {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    overflow: hidden;
  }
  .custom-collapse :deep(.el-collapse-item__header) {
    background-color: var(--el-fill-color-extra-light);
    padding: 0 16px;
    font-size: 14px;
    font-weight: 500;
    border-bottom: none;
  }
  .custom-collapse :deep(.el-collapse-item__wrap) {
    border-bottom: none;
  }
  .custom-collapse :deep(.el-collapse-item__content) {
    padding-bottom: 0;
  }
  .collapse-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .code-preview-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1px;
    background-color: var(--el-border-color-lighter);
    border-top: 1px solid var(--el-border-color-lighter);
  }
  .code-row {
    display: flex;
    flex-direction: column;
    background-color: var(--el-bg-color);
    padding: 12px 16px;
  }
  .code-key {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-color-primary);
    margin-bottom: 6px;
  }
  .code-val {
    font-family: 'Cascadia Code', Consolas, Monaco, monospace;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    word-break: break-all;
    white-space: pre-wrap;
  }
  .code-val.is-empty {
    color: var(--el-text-color-placeholder);
    font-style: italic;
  }
  @media (max-width: 640px) {
    .code-preview-grid {
      grid-template-columns: 1fr;
    }
  }

  /* 操作区 */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
  .apply-btn {
    min-width: 180px;
  }
</style>
