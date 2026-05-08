<template>
  <ArtDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
    width="480px"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ElFormItem label="角色名称" prop="roleName">
        <ElInput v-model="form.roleName" placeholder="请输入角色名称" />
      </ElFormItem>
      <ElFormItem label="角色编码" prop="roleCode">
        <ElInput v-model="form.roleCode" placeholder="请输入角色编码" />
      </ElFormItem>
      <ElFormItem label="描述" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入角色描述"
        />
      </ElFormItem>
      <ElFormItem label="启用">
        <ElSwitch v-model="form.enabled" />
      </ElFormItem>
      <ElFormItem label="是否默认角色">
        <div>
          <ElSwitch v-model="form.isDefaultRole" />
          <div class="role-default-hint">
            开启后所有登录用户自动拥有该角色配置的菜单（无需把用户绑定到此角色）；同时仅能有一个角色开启此项。
          </div>
        </div>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit" :loading="loading">提交</ElButton>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { fetchAddRole, fetchUpdateRole } from '@/api/system-manage';
  import type { FormInstance, FormRules } from 'element-plus';

  type RoleListItem = Api.SystemManage.RoleListItem;

  interface Props {
    modelValue: boolean;
    dialogType: 'add' | 'edit';
    roleData?: RoleListItem;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    roleData: undefined
  });

  const emit = defineEmits<Emits>();

  const formRef = ref<FormInstance>();
  const loading = ref(false);

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });

  const rules = reactive<FormRules>({
    roleName: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    roleCode: [
      { required: true, message: '请输入角色编码', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    description: [{ max: 500, message: '长度不能超过 500 个字符', trigger: 'blur' }]
  });

  const form = reactive<RoleListItem>({
    roleId: 0,
    roleName: '',
    roleCode: '',
    description: '',
    createTime: '',
    enabled: true,
    isDefaultRole: false
  });

  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) initForm();
    }
  );

  watch(
    () => props.roleData,
    (newData) => {
      if (newData && props.modelValue) initForm();
    },
    { deep: true }
  );

  const initForm = () => {
    if (props.dialogType === 'edit' && props.roleData) {
      Object.assign(form, props.roleData);
    } else {
      Object.assign(form, {
        roleId: 0,
        roleName: '',
        roleCode: '',
        description: '',
        createTime: '',
        enabled: true,
        isDefaultRole: false
      });
    }
  };

  const handleClose = () => {
    visible.value = false;
    formRef.value?.resetFields();
  };

  const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
      await formRef.value.validate();
      loading.value = true;

      const submitData = {
        id: form.roleId,
        roleName: form.roleName,
        roleCode: form.roleCode,
        description: form.description,
        enabled: form.enabled,
        isDefaultRole: form.isDefaultRole
      };

      if (props.dialogType === 'add') {
        const { id: _id, ...createPayload } = submitData;
        await fetchAddRole(createPayload);
        ElMessage.success('新增成功');
      } else {
        await fetchUpdateRole(submitData);
        ElMessage.success('修改成功');
      }

      emit('success');
      handleClose();
    } catch (error) {
      console.log('表单验证失败:', error);
      ElMessage.error('提交失败，请重试');
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped lang="scss">
  .role-default-hint {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.45;
    color: var(--el-text-color-secondary);
  }
</style>
