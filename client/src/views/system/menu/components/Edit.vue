<template>
  <dh-dialog
    :title="title"
    :model-value="modelValue"
    width="600px"
    @update:model-value="handleCancel"
    @opened="onOpened"
    @closed="onClosed"
  >
    <div v-loading="submitting" class="dialog-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="treeOptions"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            value-key="id"
            placeholder="请选择上级菜单"
            check-strictly
            default-expand-all
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="菜单类型" prop="type">
          <el-radio-group v-model="formData.type" @change="handleTypeChange">
            <el-radio :label="1">目录</el-radio>
            <el-radio :label="2">菜单</el-radio>
            <el-radio :label="3">按钮</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="菜单名称" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入菜单名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="显示排序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            controls-position="right"
            style="width: 150px"
          />
        </el-form-item>

        <template v-if="formData.type !== 3">
          <el-form-item label="菜单图标" prop="icon">
            <el-input
              v-model="formData.icon"
              placeholder="请输入图标class (如: el-icon-user)"
              clearable
            />
          </el-form-item>

          <el-form-item label="路由地址" prop="path">
            <el-input
              v-model="formData.path"
              placeholder="路由地址，如: user"
              clearable
            />
            <div class="tip-text">
              访问的路由地址，外网地址则以 `http(s)://` 开头
            </div>
          </el-form-item>
        </template>

        <template v-if="formData.type === 2">
          <el-form-item label="组件路径" prop="component">
            <el-input
              v-model="formData.component"
              placeholder="组件路径，如: system/user/Index"
              clearable
            />
            <div class="tip-text">
              前端对应的组件路径，默认在 `views` 目录下
            </div>
          </el-form-item>
        </template>

        <template v-if="formData.type !== 1">
          <el-form-item label="权限标识" prop="perms">
            <el-input
              v-model="formData.perms"
              placeholder="权限标识，如: sys:user:add"
              clearable
            />
            <div class="tip-text">
              控制器中定义的权限标识，用于后端鉴权及前端按钮控制
            </div>
          </el-form-item>
        </template>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        保 存
      </el-button>
    </template>
  </dh-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { cloneDeep } from 'lodash-es';
import { ElMessage } from 'element-plus';
import { addMenuApi, updateMenuApi } from '@/apis/modules/system/menu';

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '编辑菜单' },
  detailData: { type: Object, default: () => null },
  menuTree: { type: Array, default: () => [] }, // 接收列表页传入的树结构
});

const emit = defineEmits(['update:modelValue', 'success']);

// 为树形下拉选择框加上一个虚拟的根节点
const treeOptions = computed(() => {
  return [{ id: 0, name: '顶级菜单', children: props.menuTree }];
});

// #region 1. 表单初始化与校验规则
const getInitialForm = () => ({
  id: undefined,
  parentId: 0,
  title: '',
  type: 1, // 1:目录 2:菜单 3:按钮
  sort: 0,
  path: '',
  component: '',
  icon: '',
  perms: '',
});

const formData = reactive(getInitialForm());
const isEdit = computed(() => !!formData.id);

const formRef = ref(null);
const submitting = ref(false);

const rules = reactive({
  title: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }],
  component: [{ required: true, message: '请输入组件路径', trigger: 'blur' }],
});
// #endregion

// #region 2. 核心逻辑
/** 类型切换时清理无关数据 */
const handleTypeChange = (val) => {
  if (val === 1) {
    // 目录：清理组件路径和权限标识
    formData.component = '';
    formData.perms = '';
  } else if (val === 3) {
    // 按钮：清理路由、组件和图标
    formData.path = '';
    formData.component = '';
    formData.icon = '';
  }
};

/** 提交保存 */
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
    // 捕获校验失败或接口报错
    console.error('保存失败:', err);
  } finally {
    submitting.value = false;
  }
};

/** 弹窗打开：回显 */
const onOpened = () => {
  if (props.detailData) {
    Object.assign(formData, cloneDeep(props.detailData));
  }
};

/** 弹窗关闭：重置 */
const onClosed = () => {
  Object.assign(formData, getInitialForm());
  formRef.value?.resetFields();
};

const handleCancel = () => emit('update:modelValue', false);
// #endregion
</script>

<style scoped>
.dialog-content {
  padding: 10px 20px;
  max-height: 65vh;
  overflow-y: auto;
}
.tip-text {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
