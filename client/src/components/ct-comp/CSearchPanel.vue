<template>
  <el-form ref="formRef" :model="modelValue" class="search-form">
    <el-row :gutter="20" class="search-form__main">
      <template v-for="(item, index) in columns" :key="item.prop">
        <el-col
          v-show="isExpanded || index < foldCount - 1"
          :span="item.span || dynamicSpan"
        >
          <el-form-item :label="item.label" :prop="item.prop">
            <slot
              v-if="item.type === 'slot'"
              :name="item.prop"
              :column="item"
            ></slot>
            <component
              :is="getComponentName(item.type)"
              v-else
              :ref="(el) => setComponentRef(el, item.prop)"
              v-bind="item.props"
              v-model="modelValue[item.prop]"
              clearable
              style="width: 100%"
              v-on="item.events || {}"
            >
              <template v-if="item.type === 'select' && item.options">
                <el-option
                  v-for="opt in item.options"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </template>
            </component>
          </el-form-item>
        </el-col>
      </template>

      <el-col :span="actionSpan" :offset="actionOffset" class="btn-col">
        <div class="btn-wrapper">
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="primary" icon="Search" @click="handleSearch">
            查询
          </el-button>

          <el-button
            v-if="columns.length > foldCount - 1"
            type="primary"
            link
            @click="isExpanded = !isExpanded"
          >
            {{ isExpanded ? '收起' : '展开' }}
            <el-icon class="el-icon--right">
              <component :is="isExpanded ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
          </el-button>
        </div>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup>
import { ref, computed, onMounted, toRaw, nextTick } from 'vue';
import { resolveComponent } from '@/hooks/useComponents';
import { cloneDeep } from 'lodash-es';

const props = defineProps({
  modelValue: { type: Object, required: true },
  columns: { type: Array, required: true },
  // 新增：一行显示多少列，默认为 3，计算出的 span 为 8
  rowSize: { type: Number, default: 3 },
  foldCount: { type: Number, default: 100 },
});

const emit = defineEmits(['update:modelValue', 'search', 'reset']);

const formRef = ref(null);
const isExpanded = ref(false);
const itemRefs = ref({});
let initialModel = {};

onMounted(() => {
  initialModel = cloneDeep(toRaw(props.modelValue));
});

// 根据 rowSize 动态计算列宽 (24 / rowSize)
const dynamicSpan = computed(() => Math.floor(24 / props.rowSize));

const currentVisibleColumns = computed(() => {
  if (isExpanded.value) return props.columns;
  return props.columns.slice(0, props.foldCount - 1);
});

/**
 * 优化后的按钮布局计算
 */
const actionLayout = computed(() => {
  let totalSpan = 0;
  currentVisibleColumns.value.forEach((item) => {
    totalSpan += item.span || dynamicSpan.value;
  });

  const lastRowUsed = totalSpan % 24;
  const remaining = 24 - lastRowUsed;

  // 目标：btn-col 宽度尽量小（比如占 1 个 column 的宽度），剩下的用 offset 填充
  const minActionWidth = dynamicSpan.value;

  if (remaining >= minActionWidth) {
    // 如果当前行放得下
    return {
      span: minActionWidth,
      offset: remaining - minActionWidth,
    };
  }
  // 如果当前行挤不下了，按钮另起一行并靠右
  return {
    span: minActionWidth,
    offset: 24 - minActionWidth,
  };
});

const actionSpan = computed(() => actionLayout.value.span);
const actionOffset = computed(() => actionLayout.value.offset);

const setComponentRef = (el, prop) => {
  if (el) itemRefs.value[prop] = el;
  else delete itemRefs.value[prop];
};

const getComponentName = (type) => resolveComponent(type);

const handleSearch = () => {
  emit('search', props.modelValue);
};

const handleReset = () => {
  const resetValue = cloneDeep(initialModel);
  emit('update:modelValue', resetValue);
  nextTick(() => {
    formRef.value?.resetFields();
    Object.keys(itemRefs.value).forEach((key) => {
      const componentInst = itemRefs.value[key];
      if (componentInst && typeof componentInst.reset === 'function') {
        componentInst.reset();
      }
    });
    props.columns.forEach((col) => {
      if (col.events && typeof col.events.onReset === 'function') {
        col.events.onReset();
      }
    });
    emit('reset', resetValue);
  });
};
</script>

<style scoped lang="scss">
.search-form {
  background: #fff;
  width: 100%;

  :deep(.el-form-item) {
    width: 100%;
    margin-bottom: 8px;
  }
  :deep(.el-form-item__label) {
    /* 建议改为固定宽度或根据需求调整，30% 在列数多时会显得太挤 */
    width: 100px;
  }
  .btn-col {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .btn-wrapper {
    display: flex;
    gap: 8px;
    white-space: nowrap; /* 确保按钮不会换行 */
  }
}
.el-button--link {
  margin-left: 0;
}
</style>
