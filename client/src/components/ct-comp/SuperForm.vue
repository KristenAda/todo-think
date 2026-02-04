<template>
  <div class="super-form-container">
    <el-form
      ref="formRef"
      :model="modelValue"
      :rules="mergedRules"
      v-bind="$attrs"
      :label-width="props.labelWidth || '100px'"
      :label-position="props.labelPosition"
      class="custom-super-form"
      @validate="onValidate"
    >
      <el-row :gutter="gutter">
        <template v-for="(item, index) in schema" :key="item.prop || index">
          <el-col
            v-if="item.type === 'section'"
            :span="24"
            class="form-section"
          >
            <div class="section-content">
              <div class="section-title">
                <span class="title-text">{{ item.label }}</span>
                <span v-if="item.subLabel" class="title-sub">{{
                  item.subLabel
                }}</span>
              </div>
              <div class="section-line"></div>
            </div>
          </el-col>

          <el-col
            v-else-if="checkVisible(item)"
            v-bind="getColProps(item)"
            class="form-col-item"
          >
            <el-form-item
              :prop="item.prop"
              :rules="item.rules"
              :class="{ 'is-loading': loadingMap[item.prop] }"
            >
              <template #label>
                <span class="custom-label">
                  {{ item.label }}
                  <el-tooltip
                    v-if="item.tip"
                    :content="item.tip"
                    placement="top"
                  >
                    <el-icon class="tip-icon"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>

              <div class="component-wrapper">
                <slot
                  v-if="item.type === 'slot'"
                  :name="item.prop"
                  :model="modelValue"
                  :loading="loadingMap[item.prop]"
                />

                <component
                  :is="getComponentName(item.type)"
                  v-else
                  v-model="modelValue[item.prop]"
                  v-bind="item.props"
                  v-loading="loadingMap[item.prop]"
                  :disabled="checkDisabled(item)"
                  :placeholder="item.placeholder || getPlaceholder(item)"
                  clearable
                  filterable
                  class="full-width-control"
                  v-on="item.events || {}"
                  @change="(val) => handleFieldChange(val, item)"
                >
                  <template v-if="item.options">
                    <template v-if="item.type === 'select'">
                      <el-option
                        v-for="opt in getOptions(item.prop)"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                        :disabled="opt.disabled"
                      />
                    </template>
                    <template v-if="item.type === 'radio-group'">
                      <el-radio
                        v-for="opt in getOptions(item.prop)"
                        :key="opt.value"
                        :label="opt.value"
                        >{{ opt.label }}</el-radio
                      >
                    </template>
                  </template>
                </component>
              </div>
            </el-form-item>
          </el-col>
        </template>
      </el-row>

      <div v-if="$slots.footer" class="form-actions">
        <slot name="footer" :form-ref="formRef" :validate="validate"></slot>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { resolveComponent } from '@/hooks/useComponents';

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) }, // 表单数据
  schema: { type: Array, default: () => [] }, // 配置项
  // 响应式列数配置：支持 Number 或 Object { xs:1, sm:2, md:3 }
  cols: { type: [Number, Object], default: 2 },
  gutter: { type: Number, default: 24 },
  labelPosition: {
    type: String,
    default: 'top',
  },
  labelWidth: {
    type: String,
    default: '100px',
  },
});

const emit = defineEmits(['update:modelValue', 'field-change', 'validate']);

const formRef = ref(null);
const optionsMap = reactive({}); // 存储下拉数据
const loadingMap = reactive({}); // 存储每个字段的 Loading 状态

// 1. 组件映射 (返回真实对象而非字符串)
const getComponentName = (type) => resolveComponent(type);

// 2. 智能响应式布局计算 (核心升级)
const getColProps = (item) => {
  // 如果 item 自己定义了 span，优先级最高
  if (item.span) return { span: item.span };

  // 处理全局响应式配置
  const config = props.cols;

  // 辅助函数：将列数转换为 span (24/cols)
  const colsToSpan = (cols) => {
    const res = 24 / (cols || 1);
    return res < 1 ? 24 : res; // 防止除以0或无效值
  };

  if (typeof config === 'number') {
    return { span: colsToSpan(config) };
  }
  if (typeof config === 'object') {
    // 映射 Element Plus 的响应式断点
    return {
      xs: config.xs ? colsToSpan(config.xs) : 24, // 手机默认占满
      sm: config.sm ? colsToSpan(config.sm) : 12,
      md: config.md ? colsToSpan(config.md) : 12,
      lg: config.lg ? colsToSpan(config.lg) : 8,
      xl: config.xl ? colsToSpan(config.xl) : 6,
    };
  }
  return { span: 12 };
};

// 3. 智能占位符
const getPlaceholder = (item) => {
  if (item.props && item.props.placeholder) return item.props.placeholder;
  const isSelect = ['select', 'date', 'cascader', 'time'].includes(item.type);
  return (isSelect ? '请选择' : '请输入') + (item.label || '');
};

// 4. 联动逻辑：可见性与禁用
const checkVisible = (item) => {
  if (typeof item.hidden === 'function') return !item.hidden(props.modelValue);
  return item.hidden !== true;
};
const checkDisabled = (item) => {
  if (typeof item.disabled === 'function')
    return item.disabled(props.modelValue);
  return item.disabled === true;
};

// 5. 异步数据处理 (带 Loading 状态)
const loadOptions = async (item) => {
  if (!item.options) return;

  // 如果是数组，直接赋值
  if (Array.isArray(item.options)) {
    optionsMap[item.prop] = item.options;
    return;
  }

  // 如果是函数，开启 loading 并执行
  if (typeof item.options === 'function') {
    try {
      loadingMap[item.prop] = true;
      const data = await item.options(props.modelValue); // 将当前表单数据传给 API，便于联动
      optionsMap[item.prop] = data;
    } catch (e) {
      console.error(`[SuperForm] 加载字段 ${item.prop} 失败:`, e);
      optionsMap[item.prop] = [];
    } finally {
      loadingMap[item.prop] = false;
    }
  }
};

const getOptions = (prop) => optionsMap[prop] || [];

// 初始化所有异步数据
const initAllOptions = () => {
  props.schema.forEach((item) => loadOptions(item));
};

// 6. 事件处理
const handleFieldChange = (val, item) => {
  // 触发父组件监听
  emit('field-change', { prop: item.prop, value: val });

  // 执行配置里的 onChange 回调
  if (item.onChange) {
    item.onChange(val, props.modelValue, {
      // 暴露一些实用的方法给回调
      updateOptions: (targetProp) => {
        // 找到目标项并重新触发加载
        const targetItem = props.schema.find((i) => i.prop === targetProp);
        if (targetItem) loadOptions(targetItem);
      },
    });
  }
};

const onValidate = (prop, isValid, message) => {
  emit('validate', { prop, isValid, message });
};

// 监听 schema 变化（应对动态增减字段场景）
watch(
  () => props.schema,
  () => {
    initAllOptions();
  },
  { deep: true },
);

onMounted(initAllOptions);

// 暴露 API
const validate = () => formRef.value?.validate();
const resetFields = () => formRef.value?.resetFields();
const clearValidate = (prop) => formRef.value?.clearValidate(prop);
const validateField = (prop, cb) => formRef.value?.validateField(prop, cb);

defineExpose({
  validate,
  resetFields,
  clearValidate,
  validateField,
  formRef,
});
</script>

<style scoped lang="scss">
/* --- 样式修复区 --- */

/* 1. 强制所有控件撑满容器 */
.full-width-control {
  width: 100% !important;
}

/* 穿透修复 Element Plus 内部宽度问题 */
:deep(.el-select),
:deep(.el-input-number),
:deep(.el-cascader),
:deep(.el-date-editor) {
  width: 100% !important;
}

/* 针对 DatePicker 内部的输入框 */
:deep(.el-date-editor .el-input__wrapper) {
  width: 100%;
  box-sizing: border-box;
}

/* 2. Section 分组美化 */
.form-section {
  margin: 24px 0 16px 0;
}
/* 第一个 section 不需要上边距 */
.form-section:first-child {
  margin-top: 0;
}
.section-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.section-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.title-text {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  position: relative;
  padding-left: 12px;
  line-height: 1.4;
}
/* 左侧装饰条：使用 CSS 变量，方便主题定制 */
.title-text::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: var(--el-color-primary);
  border-radius: 2px;
}
.title-sub {
  font-size: 12px;
  color: #909399;
}
.section-line {
  height: 1px;
  background: linear-gradient(
    to right,
    #dcdfe6 0%,
    rgba(220, 223, 230, 0) 100%
  );
  margin-top: 4px;
}

/* 3. Label 美化 */
.custom-label {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  color: #606266;
}
.tip-icon {
  margin-left: 4px;
  color: #909399;
  font-size: 14px;
  cursor: help;
  transition: color 0.2s;
}
.tip-icon:hover {
  color: var(--el-color-primary);
}

/* 4. 操作栏 */
.form-actions {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px dashed #e4e7ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 5. 间距微调 */
:deep(.el-form-item) {
  margin-bottom: 18px; /* 统一间距 */
  .component-wrapper {
    width: 70%;
  }
}
</style>
