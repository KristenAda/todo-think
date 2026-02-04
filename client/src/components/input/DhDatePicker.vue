<!--
 * @description: 时间选择组件（基于el-date-picker二次封装）
 * @Author: TFG
 * @Date: 2026-01-14
 * @remark：--
 -->
<template>
  <div class="date-picker-wrapper">
    <el-date-picker
      v-bind="$attrs"
      v-model="vModel"
      :type="type"
      :start-placeholder="defaultStartPlaceholder"
      :end-placeholder="defaultEndPlaceholder"
      :placeholder="defaultPlaceholder"
      :shortcuts="shortcuts"
      :value-format="valueFormat"
      :unlink-panels="true"
      range-separator="至"
      :popper-class="'my-date-picker-popper ' + timeSelectClass"
      class="my-date-picker"
      @change="onChange"
      @visible-change="handleVisibleChange"
    />
  </div>
</template>

<script setup>
// #region 引用

// #endregion

// #region props/emit

const props = defineProps({
  // 快捷时间选择TAG：all,recentWeek,recentMonth...
  shortcutTags: {
    type: String,
    default: '',
  },
  // 类型
  type: {
    type: String,
    default: '',
  },
  // 占位符（普通时间框）
  placeholder: {
    type: String,
    default: '',
  },
  // 占位符-开始（范围时间框）
  startPlaceholder: {
    type: String,
    default: '',
  },
  // 占位符-结束（范围时间框）
  endPlaceholder: {
    type: String,
    default: '',
  },
  // 是否选择分钟和秒（当格式包含time格式时）
  minuteSecondFlag: {
    type: Boolean,
    default: true,
  },
  // 是否选择秒（当格式包含time格式时）
  secondFlag: {
    type: Boolean,
    default: true,
  },
  // 是否隐藏此刻按钮
  showNowButton: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['change', 'update:modelValue']);

// #endregion

// #region 变量/常量

// 定义代理对象
// 时间显示格式
const valueFormat = ref('YYYY-MM-DD HH:mm:ss');
// 默认起始占位符
const defaultStartPlaceholder = ref();
// 默认结尾占位符
const defaultEndPlaceholder = ref();
// 默认占位符（非范围选择时）
const defaultPlaceholder = ref();
// 选择框宽度
const datepickerwidth = ref(200);

// 附加样式
const timeSelectClass = computed(() => {
  const classList = [];
  if (!props.minuteSecondFlag) {
    classList.push('hid-minute-second');
  } else if (!props.secondFlag) {
    classList.push('hid-second');
  }
  if (!props.showNowButton) {
    classList.push('hid-now-button');
  }
  return classList.join(' ');
});

// 选择器事件标识：0关闭，1打开，2改变
const pickerEventTag = ref(0);
const isRange = props.type.indexOf('range') > -1;

// 响应式绑定值
const vComputedModel = computed(() => {
  return props.modelValue;
});
const vModel = ref(vComputedModel.value);

// 根据不同类型控制相关初始值（宽度、格式、默认占位符）
if (props.type) {
  if (props.type === 'daterange') {
    defaultStartPlaceholder.value = props.startPlaceholder || '开始日期';
    defaultEndPlaceholder.value = props.endPlaceholder || '结束日期';
    datepickerwidth.value = `${260}px`;
    valueFormat.value = 'YYYY-MM-DD';
  } else if (props.type === 'datetimerange') {
    defaultStartPlaceholder.value = props.startPlaceholder || '开始时间';
    defaultEndPlaceholder.value = props.endPlaceholder || '结束时间';
    datepickerwidth.value = `${360}px`;
    valueFormat.value = 'YYYY-MM-DD HH:mm:ss';
  } else if (props.type === 'date') {
    defaultPlaceholder.value = props.placeholder || '选择日期';
    datepickerwidth.value = `${150}px`;
    valueFormat.value = 'YYYY-MM-DD';
  } else if (props.type === 'datetime') {
    defaultPlaceholder.value = props.placeholder || '选择时间';
    datepickerwidth.value = `${190}px`;
    valueFormat.value = 'YYYY-MM-DD HH:mm:ss';
  } else if (props.type === 'year') {
    defaultPlaceholder.value = props.placeholder || '选择年份';
    datepickerwidth.value = `${150}px`;
    valueFormat.value = 'YYYY';
  }
}

// 自定义快捷选择标签
const allShortcuts = [
  {
    tag: 'all',
    text: '全部',
    value: () => {
      return [null, null];
    },
  },
  {
    tag: 'recentWeek',
    text: '近一周',
    value: () => {
      const start = new Date();
      const end = new Date();
      start.setDate(start.getDate() - 7);
      return [start, end];
    },
  },
  {
    tag: 'recentMonth',
    text: '近一个月',
    value: () => {
      const start = new Date();
      const end = new Date();
      start.setMonth(start.getMonth() - 1);
      return [start, end];
    },
  },

  {
    tag: 'recentThreeWeek',
    text: '近三周',
    value: () => {
      const start = new Date();
      const end = new Date();
      start.setDate(start.getDate() - 21);
      return [start, end];
    },
  },
  {
    tag: 'currentMonth',
    text: '当月',
    value: () => {
      const end = new Date();
      const fullYear = new Date().getFullYear();
      const mouth = new Date().getMonth();
      const start = new Date(fullYear, mouth, 1);
      return [start, end];
    },
  },

  {
    tag: 'recentThreeMonth',
    text: '近三月',
    value: () => {
      const end = new Date();
      const fullYear = new Date().getFullYear();
      const mouth = new Date().getMonth() - 2;
      const start = new Date(fullYear, mouth, 1);
      return [start, end];
    },
  },

  {
    tag: 'currentYear',
    text: '今年',
    value: () => {
      const end = new Date(new Date().getFullYear(), 11, 31);
      const start = new Date(new Date().getFullYear(), 0);
      return [start, end];
    },
  },
  {
    tag: 'lastYear',
    text: '去年',
    value: () => {
      const end = new Date(new Date().getFullYear() - 1, 11, 31);
      const start = new Date(new Date().getFullYear() - 1, 0);
      return [start, end];
    },
  },
];
const shortcuts = ref();
if (props.shortcutTags) {
  const customShortcutsArr = props.shortcutTags.split(',');
  shortcuts.value = allShortcuts.filter((x) =>
    customShortcutsArr.some((y) => y === x.tag),
  );
}

// #endregion

// #region 业务方法

// 监听modelValue变化，对值进行处理
watch(
  () => props.modelValue,
  (to) => {
    vModel.value = to;
  },
);

/**
 * 触发值改变事件
 * @param {Object} modelValue 变化值
 */
function changeValue(praModelValue) {
  // let modelValue=cloneDeep(praModelValue);
  if (isRange) {
    if (!praModelValue) {
      vModel.value = null;
    } else if (
      praModelValue.length === 2 &&
      praModelValue[0] === 'Invalid Date'
    ) {
      vModel.value = null;
    }
  }
  emit('update:modelValue', vModel.value);
  emit('change', vModel.value);
}

/**
 * 劫持change事件，处理空值情况
 */
const onChange = (e) => {
  pickerEventTag.value = 2;
  changeValue(e);
};

/**
 * 可见性事件监听
 * @param visibleFlag  是否可见
 */
const handleVisibleChange = (visibleFlag) => {
  if (visibleFlag) {
    pickerEventTag.value = 1;
  } else {
    if (pickerEventTag.value !== 2) {
      changeValue(vModel.value);
    }
    pickerEventTag.value = 0;
  }
};

// #endregion
</script>

<style>
.el-input .el-input__icon {
  font-size: var(--el-font-size-extra-large);
}

.el-date-editor .el-range__icon {
  margin-right: 5px;
  font-size: var(--el-font-size-extra-large);
}

.el-date-editor .el-range__close-icon {
  margin-left: 5px;
  font-size: var(--el-font-size-extra-large);
}

.my-date-picker.el-input .el-input__suffix {
  width: 25px;
}

.el-date-editor.el-input,
.el-date-editor.el-input__wrapper {
  width: v-bind(datepickerwidth);
}

.date-picker-wrapper {
  display: inline-block;
}

.my-date-picker-popper.hid-minute-second .el-time-spinner__wrapper {
  width: 100% !important;
}

.my-date-picker-popper.hid-second .el-time-spinner__wrapper {
  width: 50% !important;
}

.my-date-picker-popper.hid-now-button .el-picker-panel__footer > .is-text {
  display: none;
}

.my-date-picker-popper .el-picker-panel__body .prev-month {
  color: var(--el-color-primary);
}

.my-date-picker-popper .el-picker-panel__body .next-month {
  color: var(--el-color-primary);
}

.my-date-picker-popper .el-picker-panel__body .prev-month:hover {
  color: var(--el-color-primary);
}

.my-date-picker-popper .el-picker-panel__body .next-month:hover {
  color: var(--el-color-primary);
}
</style>
