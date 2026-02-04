import { DirectiveBinding } from 'vue';

/**
 * 使用方式
 * v-copy-text="{
    text: '传入需要复制的内容',
    success: '复制成功',//复制成功后的提示
    error: '复制失败',//复制失败后的提示
  }"
 */
const handlersMap = new WeakMap<HTMLElement, () => void>();
const createHandler = (bindings: DirectiveBinding<any>) => {
  return () => {
    const obj = bindings.value;
    const val = obj.text;
    const successMsg = obj.success ? obj.success : '复制成功！';
    const errorMsg = obj.error ? obj.error : '复制失败！';
    if (!val) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(val).then(
        () => {
          ElMessage.success(successMsg);
        },
        () => {
          ElMessage.error(errorMsg);
        },
      );
    } else {
      // 创建text area
      const textArea = document.createElement('textarea');
      textArea.value = val;
      // 使text area不在viewport，同时设置不可见
      textArea.style.position = 'absolute';
      textArea.style.opacity = '0';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      if (document.execCommand('copy')) {
        ElMessage.success(successMsg);
      } else {
        ElMessage.error(errorMsg);
      }
      textArea.remove();
    }
  };
};

function bindEvent(element: HTMLElement, bindings: DirectiveBinding) {
  const oldHandler = handlersMap.get(element);
  if (oldHandler) {
    element.removeEventListener('click', oldHandler); // 移除旧的事件处理器
  }

  const newHandler = createHandler(bindings);
  handlersMap.set(element, newHandler);
  element.addEventListener('click', newHandler);
}

export default {
  /**
   * Vue 指令挂载时调用的函数
   *
   * @param el 要绑定的元素
   * @param binding 指令的绑定信息，其中包含了传入的指令值
   * @returns 无返回值
   */
  mounted(element: HTMLElement, binding: DirectiveBinding<string>) {
    bindEvent(element, binding);
  },
  updated(element: HTMLElement, binding: DirectiveBinding<string>) {
    bindEvent(element, binding);
  },
  unmounted(element: HTMLElement) {
    const handler = handlersMap.get(element);
    if (handler) {
      element.removeEventListener('click', handler); // 在组件卸载时移除事件处理器
      handlersMap.delete(element); // 清理 map 中的引用
    }
  },
};
