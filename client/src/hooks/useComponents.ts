// componentMap.ts
import { markRaw, type Component } from 'vue';
import * as ElementPlus from 'element-plus';

// 解构出所有常用的表单组件
const {
  ElInput,
  ElInputNumber,
  ElSelect,
  ElSelectV2,
  ElTreeSelect,
  ElCheckbox,
  ElCheckboxGroup,
  ElRadio,
  ElRadioGroup,
  ElDatePicker,
  ElTimePicker,
  ElTimeSelect,
  ElSwitch,
  ElCascader,
  ElSlider,
  ElRate,
  ElColorPicker,
  ElTransfer,
  ElUpload,
} = ElementPlus;

/**
 * 标准组件映射表
 */
export const COMPONENT_MAP: Record<string, Component> = {
  // 1. Element Plus 原名映射
  ElInput,
  ElInputNumber,
  ElSelect,
  ElSelectV2,
  ElTreeSelect,
  ElCheckbox,
  ElCheckboxGroup,
  ElRadio,
  ElRadioGroup,
  ElDatePicker,
  ElTimePicker,
  ElTimeSelect,
  ElSwitch,
  ElCascader,
  ElSlider,
  ElRate,
  ElColorPicker,
  ElTransfer,
  ElUpload,

  // 2. 常用简写/别名兼容 (方便书写)
  input: ElInput,
  select: ElSelect,
  number: ElInputNumber,
  switch: ElSwitch,
  date: ElDatePicker,
  time: ElTimePicker,
  radio: ElRadioGroup,
  checkbox: ElCheckboxGroup,
  textarea: ElInput, // ElInput 通过 props.type 控制
  cascader: ElCascader,
  rate: ElRate,
  slider: ElSlider,
};

/**
 * 解析组件类型
 * @param type 组件名字符串或组件对象
 */
export function resolveComponent(type: string | Component | any): Component {
  // 如果本身就是组件对象（比如通过 markRaw 传入的自定义组件），直接返回
  if (typeof type !== 'string') {
    return markRaw(type);
  }

  // 从映射表中查找
  const component = COMPONENT_MAP[type];

  if (component) {
    return component;
  }

  // 兜底：如果没找到，尝试检查是否是 Element Plus 的其他组件
  // 例如用户写了 ElButton (虽然不是表单项)
  if (type.startsWith('El') && (ElementPlus as any)[type]) {
    return (ElementPlus as any)[type];
  }

  console.warn(
    `[SuperForm] 未找到类型为 "${type}" 的组件，请检查配置或在 componentMap.ts 中添加映射。`,
  );
  return ElInput; // 默认返回输入框
}
