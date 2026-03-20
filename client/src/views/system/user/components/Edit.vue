<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="560px"
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
      class="user-form"
    >
      <el-row :gutter="16">
        <!-- 用户名 -->
        <el-col :span="12">
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入用户名"
              clearable
              :disabled="isEdit"
            />
          </el-form-item>
        </el-col>
        <!-- 密码 -->
        <el-col :span="12">
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              show-password
              :placeholder="isEdit ? '留空则不修改密码' : '默认密码: 123456'"
              clearable
            />
          </el-form-item>
        </el-col>
        <!-- 昵称 -->
        <el-col :span="12">
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="formData.nickname" placeholder="请输入昵称" clearable />
          </el-form-item>
        </el-col>
        <!-- 手机号 -->
        <el-col :span="12">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入手机号" clearable />
          </el-form-item>
        </el-col>
        <!-- 邮箱 -->
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" clearable />
          </el-form-item>
        </el-col>
        <!-- 所属部门 -->
        <el-col :span="12">
          <el-form-item label="所属部门" prop="deptId">
            <el-tree-select
              v-model="formData.deptId"
              :data="deptTree"
              :props="{ label: 'name', value: 'id', children: 'children' }"
              value-key="id"
              placeholder="请选择所属部门"
              clearable
              check-strictly
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <!-- 状态 -->
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio :label="1">正常</el-radio>
              <el-radio :label="0">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <!-- 备注 -->
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-col>
      </el-row>
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
import { getDeptTreeApi } from '@/apis/modules/system/dept';
import { addUserApi, updateUserApi } from '@/apis/modules/system/user';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '用户信息' },
  detailData: { type: Object, default: () => null },
});

const emit = defineEmits(['update:modelValue', 'success']);

// ==================== 表单数据 ====================
const getInitForm = () => ({
  id: undefined,
  username: '',
  password: '',
  nickname: '',
  phone: '',
  email: '',
  deptId: null,
  status: 1,
  remark: '',
});

const formData = reactive(getInitForm());
const formRef = ref(null);
const submitting = ref(false);

const isEdit = computed(() => !!formData.id);

// ==================== 校验规则 ====================
const rules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 32, message: '长度 2~32 个字符', trigger: 'blur' },
  ],
  password: isEdit.value
    ? []
    : [],  // 新增时后端会给默认密码 123456，不强制
  email: [
    {
      pattern: /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
      message: '请输入有效的邮箱地址',
      trigger: 'blur',
    },
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入有效的手机号',
      trigger: 'blur',
    },
  ],
}));

// ==================== 部门树 ====================
const deptTree = ref([]);
const loadDeptTree = async () => {
  try {
    const res = await getDeptTreeApi();
    deptTree.value = res ?? [];
  } catch (e) {
    console.error('获取部门树失败:', e);
  }
};

// ==================== 提交 ====================
const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    submitting.value = true;

    const payload = { ...formData };
    // 编辑时若密码为空则不传，避免置空
    if (!payload.password) delete payload.password;
    // 去除 null/undefined 的 deptId
    if (!payload.deptId) delete payload.deptId;

    if (isEdit.value) {
      await updateUserApi(payload);
    } else {
      await addUserApi(payload);
    }

    ElMessage.success('保存成功');
    emit('success');
    handleCancel();
  } catch (err) {
    // validate 失败时 err 为 false，不需要额外处理
    if (err && err.message) {
      console.error('保存失败:', err);
    }
  } finally {
    submitting.value = false;
  }
};

// ==================== 弹窗生命周期 ====================
const onOpened = () => {
  loadDeptTree();
  if (props.detailData) {
    const cloned = cloneDeep(props.detailData);
    Object.assign(formData, cloned);
    formData.password = ''; // 编辑时不回显密码
    formData.deptId = cloned.deptId ?? null;
  }
};

const onClosed = () => {
  Object.assign(formData, getInitForm());
  formRef.value?.clearValidate();
  deptTree.value = [];
};

const handleCancel = () => emit('update:modelValue', false);

const handleReset = () => {
  if (props.detailData) {
    const cloned = cloneDeep(props.detailData);
    Object.assign(formData, cloned);
    formData.password = '';
    formData.deptId = cloned.deptId ?? null;
  } else {
    Object.assign(formData, getInitForm());
  }
  formRef.value?.clearValidate();
};
</script>

<style scoped>
.user-form {
  padding: 8px 12px 0;
}
</style>
