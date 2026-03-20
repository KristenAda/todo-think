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
      class="dept-form"
    >
      <!-- 上级部门 -->
      <el-form-item label="上级部门" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="treeOptions"
          :props="{ label: 'name', value: 'id', children: 'children' }"
          value-key="id"
          placeholder="请选择上级部门（默认顶级）"
          clearable
          check-strictly
          default-expand-all
          style="width: 100%"
        />
      </el-form-item>

      <!-- 部门名称 -->
      <el-form-item label="部门名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入部门名称" clearable />
      </el-form-item>

      <!-- 负责人 -->
      <el-form-item label="负责人" prop="leader">
        <el-input v-model="formData.leader" placeholder="请输入负责人名称" clearable />
      </el-form-item>

      <!-- 电话 -->
      <el-form-item label="电话" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入联系电话" clearable />
      </el-form-item>

      <!-- 邮箱 -->
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱地址" clearable />
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
import { addDeptApi, updateDeptApi } from '@/apis/modules/system/dept';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '部门信息' },
  detailData: { type: Object, default: () => null },
  deptTree: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue', 'success']);

// ==================== 树形选项（加顶级虚拟根节点） ====================
const treeOptions = computed(() => [
  { id: 0, name: '顶级部门', children: props.deptTree },
]);

// ==================== 表单数据 ====================
const getInitForm = () => ({
  id: undefined,
  parentId: null,
  name: '',
  leader: '',
  phone: '',
  email: '',
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
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 64, message: '长度 2~64 个字符', trigger: 'blur' },
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入有效的手机号',
      trigger: 'blur',
    },
  ],
  email: [
    {
      pattern: /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
      message: '请输入有效的邮箱地址',
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
    // 新增时 parentId 为 null 则改为 0（顶级）
    if (!isEdit.value && !payload.parentId) {
      payload.parentId = 0;
    }

    if (isEdit.value) {
      await updateDeptApi(payload);
    } else {
      await addDeptApi(payload);
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
    // 编辑时，parentId 不可改（防止循环引用）
    if (isEdit.value && formData.parentId === null) {
      formData.parentId = 0;
    }
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
.dept-form {
  padding: 8px 12px 0;
}
</style>
