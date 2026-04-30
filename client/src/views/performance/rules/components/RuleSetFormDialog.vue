<template>
  <ArtDialog v-model="innerVisible" :title="mode === 'create' ? '新建规则集' : '编辑规则集'" width="560px">
    <el-form label-width="90px">
      <el-form-item label="编码">
        <el-input v-model="form.code" />
      </el-form-item>
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="作用域">
        <el-select v-model="form.scope" style="width: 180px">
          <el-option
            v-for="item in RULE_SCOPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.scope === RuleScopeEnum.PROJECT" label="关联项目">
        <el-select v-model="form.projectId" style="width: 100%" filterable placeholder="请选择项目">
          <el-option v-for="p in projectOptions" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="innerVisible = false">取消</el-button>
      <el-button type="primary" @click="emit('save')">{{ mode === 'create' ? '创建' : '保存' }}</el-button>
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
  }>();

  const emit = defineEmits<{
    'update:visible': [boolean];
    save: [];
  }>();

  const innerVisible = computed({
    get: () => props.visible,
    set: (v: boolean) => emit('update:visible', v)
  });
</script>
