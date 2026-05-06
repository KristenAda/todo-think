<template>
  <ArtDialog
    v-model="innerVisible"
    :title="mode === 'create' ? '新建规则集' : '编辑规则集'"
    subtitle="基础信息与计算变量在同一处维护，保存时一并生效"
    width="1080px"
  >
    <div class="rule-set-dialog-body">
      <div class="section-title">基础信息</div>
      <el-form label-width="90px">
        <el-form-item label="编码">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="作用域">
          <el-select v-model="form.scope" style="width: 180px" @change="emit('reload-variable-drafts')">
            <el-option
              v-for="item in RULE_SCOPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.scope === RuleScopeEnum.PROJECT" label="关联项目">
          <el-select
            v-model="form.projectId"
            style="width: 100%"
            filterable
            placeholder="请选择项目"
            @change="emit('reload-variable-drafts')"
          >
            <el-option v-for="p in projectOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-divider content-position="left">变量配置</el-divider>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="var-alert"
        title="默认值主要用于规则试算初始化；任务结算应优先使用真实任务事实数据。"
      />
      <div class="var-toolbar">
        <el-button type="primary" plain @click="emit('add-variable-draft')">新增变量</el-button>
      </div>
      <ArtTable :data="variableDrafts" :columns="columns" />
    </div>
    <template #footer>
      <el-button @click="innerVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="emit('save')">{{
        mode === 'create' ? '创建' : '保存'
      }}</el-button>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { RULE_SCOPE_OPTIONS, RuleScopeEnum } from '@/enums/modules/performanceRulesEnum';

  const props = defineProps<{
    visible: boolean;
    mode: 'create' | 'edit';
    form: Api.Task.CreateRuleSetParams;
    projectOptions: Api.Task.SimpleProject[];
    variableDrafts: Api.Task.RuleVariable[];
    columns: any[];
    saving?: boolean;
  }>();

  const emit = defineEmits<{
    'update:visible': [boolean];
    save: [];
    'add-variable-draft': [];
    'reload-variable-drafts': [];
  }>();

  const innerVisible = computed({
    get: () => props.visible,
    set: (v: boolean) => emit('update:visible', v)
  });
</script>

<style scoped lang="scss">
  .rule-set-dialog-body {
    max-height: min(72vh, 720px);
    overflow: auto;
    padding-right: 4px;
  }
  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
  }
  .var-alert {
    margin-bottom: 10px;
  }
  .var-toolbar {
    margin-bottom: 8px;
  }
</style>
