<template>
  <dh-dialog ref="dialogRef" class="row-detail-dialog">
    <!-- 主体内容：增加内层容器控制间距，列数支持配置 -->
    <div class="detail-dialog-container">
      <el-descriptions
        v-for="(group, index) in renderInfo"
        :key="index"
        :column="getColumnCount(group)"
        class="detail-group"
      >
        <!-- 分组标题：优化样式 -->
        <template #title>
          <div class="common-title">
            <c-title :name="group.title"></c-title>
          </div>
        </template>
        <!-- 描述项：优化标签和内容样式 -->
        <el-descriptions-item
          v-for="(item, idx) in group.list"
          :key="idx"
          :label="item.label"
          class="detail-item"
        >
          <template #label>
            <span class="item-label">{{ item.label }}：</span>
          </template>
          <span class="item-content">{{ item.content || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 底部按钮：优化间距 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="dialogRef.close()">关闭</el-button>
      </div>
    </template>
  </dh-dialog>
</template>

<script lang="ts" setup>
// 单个字段配置：字段名 + 中文标签 + 可选格式化
interface FieldConfig {
  field: string; // 数据源中的字段名
  label: string; // 要显示的中文标签
  formatter?: (value: any, row: any) => string; // 可选：字段值格式化函数
}

// 分组配置：标题 + 字段列表 + 可选单独配置列数
interface GroupConfig {
  title: string;
  fields: FieldConfig[];
  column?: number; // 可选：该分组单独的列数，优先级高于全局列数
}

// 组件Props定义
interface Props {
  data: Record<string, any>; // 原始数据源（表格行数据）
  groupConfig: GroupConfig[]; // 分组配置（含字段+标签+可选分组列数）
  column?: number; // 全局默认列数，默认3列
}

// 定义Props并设置默认值
const props = withDefaults(defineProps<Props>(), {
  data: () => ({}),
  groupConfig: () => [],
  column: 3, // 默认3列布局
});

const dialogRef = ref();

// 计算属性：获取每个分组的列数（分组单独配置 > 全局配置）
const getColumnCount = (group: any) => {
  return group.column || props.column;
};

// 计算属性：自动生成要渲染的info结构
const renderInfo = computed(() => {
  return props.groupConfig.map((group) => ({
    title: group.title,
    list: group.fields.map((fieldItem) => {
      const rawValue = props.data[fieldItem.field];
      // 处理格式化
      const content = fieldItem.formatter
        ? fieldItem.formatter(rawValue, props.data)
        : rawValue;
      return {
        label: fieldItem.label,
        content: content || '-',
      };
    }),
  }));
});
</script>

<style lang="scss" scoped>
// 根容器：控制对话框内边距
.row-detail-dialog {
  :deep(.el-dialog__body) {
    padding: 20px 24px;
    overflow-y: auto;
    max-height: 70vh; // 限制最大高度，内容过多时滚动
  }
}

// 主体容器：分组间距
.detail-dialog-container {
  width: 100%;
  gap: 24px;
  display: flex;
  flex-direction: column;
  // padding-top: 12px;
}

// 每个分组的样式
.detail-group {
  :deep(.el-descriptions__header) {
    .el-descriptions__title {
      height: 42px;
      display: flex;
      align-items: center;
      .common-title {
        margin: 0;
      }
    }
    margin-bottom: 0px;
    padding-bottom: 8px;
  }

  // 分组标题样式
  .group-title {
    display: flex;
    align-items: center;
    gap: 8px;

    .title-text {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937; // 深色标题，更醒目
    }

    .title-line {
      flex: 1;
      height: 1px;
    }
  }

  // 描述项样式
  :deep(.el-descriptions__item) {
    padding: 12px 16px; // 增大单元格内边距，更舒适
  }

  // 标签样式
  .item-label {
    font-weight: 500;
    color: #4b5563; // 标签灰色，区分内容
    font-size: 14px;
  }
}

// 底部按钮容器
.dialog-footer {
  display: flex;
  justify-content: center; // 按钮居中，更美观
  padding-top: 8px;

  :deep(.el-button) {
    width: 100px; // 固定按钮宽度，更规整
  }
}

// 响应式适配：小屏幕自动减列
@media (max-width: 768px) {
  .detail-group {
    :deep(.el-descriptions) {
      --el-descriptions-column: 2 !important;
    }
  }
}

@media (max-width: 480px) {
  .detail-group {
    :deep(.el-descriptions) {
      --el-descriptions-column: 1 !important;
    }
  }
}
</style>
