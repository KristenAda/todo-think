<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="handleCancel"
    @opened="onOpened"
    @closed="onClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="90px"
      class="role-form"
    >
      <!-- 角色名称 -->
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="formData.roleName" placeholder="请输入角色名称" clearable />
      </el-form-item>

      <!-- 角色标识 -->
      <el-form-item label="角色标识" prop="roleKey">
        <el-input
          v-model="formData.roleKey"
          placeholder="请输入角色标识，如: admin"
          clearable
          :disabled="isEdit"
        />
        <div class="tip-text">英文字母、数字、下划线组成，编辑时不可修改</div>
      </el-form-item>

      <!-- 排序 -->
      <el-form-item label="排序" prop="sort">
        <el-input-number
          v-model="formData.sort"
          :min="0"
          :max="999"
          controls-position="right"
          style="width: 160px"
        />
      </el-form-item>

      <!-- 状态 -->
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="1">正常</el-radio>
          <el-radio :label="0">停用</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 备注 -->
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取 消</el-button>
      <el-button @click="handleReset">重 置</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { cloneDeep } from 'lodash-es';
import { addRoleApi, updateRoleApi } from '@/apis/modules/system/role';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '角色信息' },
  detailData: { type: Object, default: () => null },
});

const emit = defineEmits(['update:modelValue', 'success']);

// ==================== 表单数据 ====================
const getInitForm = () => ({
  id: undefined,
  roleName: '',
  roleKey: '',
  sort: 0,
  status: 1,
  remark: '',
});

const formData = reactive(getInitForm());
const formRef = ref(null);
const submitting = ref(false);
const isEdit = computed(() => !!formData.id);

// ==================== 校验规则 ====================
const rules = reactive({
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 64, message: '长度 2~64 个字符', trigger: 'blur' },
  ],
  roleKey: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: '只能包含英文字母、数字、下划线',
      trigger: 'blur',
    },
  ],
});

// ==================== 提交 ====================
const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    submitting.value = true;

    const payload = { ...formData };

    if (isEdit.value) {
      await updateRoleApi(payload);
    } else {
      await addRoleApi(payload);
    }

    ElMessage.success('保存成功');
    emit('success');
    handleCancel();
  } catch (err) {
    if (err && err.message) console.error('保存失败:', err);
  } finally {
    submitting.value = false;
  }
};

// ==================== 弹窗生命周期 ====================
const onOpened = () => {
  if (props.detailData) {
    Object.assign(formData, cloneDeep(props.detailData));
  }
};

const onClosed = () => {
  Object.assign(formData, getInitForm());
  formRef.value?.clearValidate();
};

const handleCancel = () => emit('update:modelValue', false);
const handleReset = () => {
  if (props.detailData) {
    Object.assign(formData, cloneDeep(props.detailData));
  } else {
    Object.assign(formData, getInitForm());
  }
  formRef.value?.clearValidate();
};
</script>

<style scoped>
.role-form {
  padding: 8px 12px 0;
}

.tip-text {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
