<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="620px"
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
      label-width="100px"
      class="menu-form"
    >
      <!-- 上级菜单 -->
      <el-form-item label="上级菜单" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="treeOptions"
          :props="{ label: 'title', value: 'id', children: 'children' }"
          value-key="id"
          placeholder="请选择上级菜单（默认顶级）"
          check-strictly
          default-expand-all
          style="width: 100%"
        />
      </el-form-item>

      <!-- 菜单类型 -->
      <el-form-item label="菜单类型" prop="type">
        <el-radio-group v-model="formData.type" @change="handleTypeChange">
          <el-radio :label="1">目录</el-radio>
          <el-radio :label="2">菜单</el-radio>
          <el-radio :label="3">按钮</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 菜单名称 -->
      <el-form-item label="菜单名称" prop="title">
        <el-input v-model="formData.title" placeholder="请输入菜单名称" clearable />
      </el-form-item>

      <!-- 显示排序 -->
      <el-form-item label="显示排序" prop="sort">
        <el-input-number
          v-model="formData.sort"
          :min="0"
          :max="999"
          controls-position="right"
          style="width: 160px"
        />
      </el-form-item>

      <!-- 目录/菜单 才显示：图标、路由地址 -->
      <template v-if="formData.type !== 3">
        <el-form-item label="菜单图标" prop="icon">
          <el-input
            v-model="formData.icon"
            placeholder="图标 class，如 fa fa-user 或 el-icon-user"
            clearable
          />
        </el-form-item>

        <el-form-item label="路由地址" prop="path">
          <el-input
            v-model="formData.path"
            placeholder="如: /system/user，外链以 http(s):// 开头"
            clearable
          />
        </el-form-item>
      </template>

      <!-- 仅菜单才显示：组件路径 -->
      <template v-if="formData.type === 2">
        <el-form-item label="组件路径" prop="component">
          <el-input
            v-model="formData.component"
            placeholder="views 目录下路径，如: system/user/Index"
            clearable
          />
          <div class="tip-text">对应 views/ 下的 .vue 文件路径，不含后缀</div>
        </el-form-item>
      </template>

      <!-- 菜单/按钮 才显示：权限标识 -->
      <template v-if="formData.type !== 1">
        <el-form-item label="权限标识" prop="perms">
          <el-input
            v-model="formData.perms"
            placeholder="如: sys:user:add"
            clearable
          />
          <div class="tip-text">前端按钮权限控制及后端接口鉴权用，多个用英文逗号分隔</div>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { cloneDeep } from 'lodash-es';
import { addMenuApi, updateMenuApi } from '@/apis/modules/system/menu';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '菜单信息' },
  detailData: { type: Object, default: () => null },
  menuTree: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue', 'success']);

// ==================== 树形选项（加顶级虚拟根节点） ====================
const treeOptions = computed(() => [
  { id: 0, title: '顶级菜单', children: props.menuTree },
]);

// ==================== 表单数据 ====================
const getInitForm = () => ({
  id: undefined,
  parentId: 0,
  title: '',
  type: 1,
  sort: 0,
  icon: '',
  path: '',
  component: '',
  perms: '',
});

const formData = reactive(getInitForm());
const formRef = ref(null);
const submitting = ref(false);
const isEdit = computed(() => !!formData.id);

// ==================== 动态校验规则 ====================
// 根据菜单类型动态决定必填项，避免类型切换后旧规则干扰
const rules = computed(() => ({
  title: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: formData.type !== 3
    ? [{ required: true, message: '请输入路由地址', trigger: 'blur' }]
    : [],
  component: formData.type === 2
    ? [{ required: true, message: '请输入组件路径', trigger: 'blur' }]
    : [],
}));

// ==================== 类型切换：清理无关字段 ====================
const handleTypeChange = (val) => {
  if (val === 1) {
    formData.component = '';
    formData.perms = '';
  } else if (val === 3) {
    formData.path = '';
    formData.component = '';
    formData.icon = '';
  }
  // 切换类型后清除历史校验状态
  nextTick(() => formRef.value?.clearValidate());
};

// ==================== 提交 ====================
const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    submitting.value = true;
    const payload = { ...formData };
    if (isEdit.value) {
      await updateMenuApi(payload);
    } else {
      await addMenuApi(payload);
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
    // 确保 parentId 有默认值
    if (formData.parentId === null || formData.parentId === undefined) {
      formData.parentId = 0;
    }
  }
};

const onClosed = () => {
  Object.assign(formData, getInitForm());
  formRef.value?.clearValidate();
};

const handleCancel = () => emit('update:modelValue', false);
</script>

<style scoped>
.menu-form {
  padding: 8px 12px 0;
}

.tip-text {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
