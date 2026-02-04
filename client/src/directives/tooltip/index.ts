import { DirectiveBinding } from 'vue';

function bindEvent(element: HTMLElement, bindings: DirectiveBinding) {
  const el = element as any;
  // 提示信息
  const tooltipText = bindings.value || '已禁用，不可点击';

  // 创建提示元素
  const tooltipElement = document.createElement('div');
  const maxWidth = 600;
  const cssText = `
          max-width: ${maxWidth}px;
          overflow: auto;
          position: fixed;
          background: var(--el-color-white);
          color: #000;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          line-height: 20px;
          padding: 4px 12px;
          display: block;
          font-size: 12px;
          z-index: 99999;
        box-shadow: 0 0px 10px rgba(0, 0, 0, 0.1);
          word-break: break-all;
        `;

  tooltipElement.style.cssText = cssText;
  // tooltipElement.style.position = 'absolute';
  // tooltipElement.style.backgroundColor = 'black';
  // tooltipElement.style.color = 'white';
  // tooltipElement.style.padding = '5px';
  // tooltipElement.style.borderRadius = '3px';
  // tooltipElement.style.display = 'none';
  // tooltipElement.style.zIndex = '1000';
  tooltipElement.textContent = tooltipText;

  // 保存提示元素引用
  el.tooltipEl = tooltipElement;

  // 鼠标移入事件处理函数
  const handleMouseEnter = (event: any) => {
    // 判断元素是否禁用
    const isDisabled =
      el.getAttribute('disabled') === 'true' ||
      el.classList.contains('is-disabled');
    if (isDisabled) {
      // 将提示元素添加到 body 中
      document.body.appendChild(tooltipElement);
      tooltipElement.style.display = 'block';
      tooltipElement.style.left = `${event.pageX + 10}px`;
      tooltipElement.style.top = `${event.pageY + 10}px`;
    } else if (document.body.contains(tooltipElement)) {
      document.body.removeChild(tooltipElement);
    }
  };

  // 鼠标移出事件处理函数
  const handleMouseLeave = () => {
    tooltipElement.style.display = 'none';
    // 移除提示元素
    if (document.body.contains(tooltipElement)) {
      document.body.removeChild(tooltipElement);
    }
  };

  // 绑定事件监听器
  el.addEventListener('mouseenter', handleMouseEnter);
  el.addEventListener('mouseleave', handleMouseLeave);

  // 使用 Vue 的 onUnmounted 钩子来移除事件监听器（Vue 3 Composition API 方式）
  onUnmounted(() => {
    el.removeEventListener('mouseenter', handleMouseEnter);
    el.removeEventListener('mouseleave', handleMouseLeave);
    if (document.body.contains(tooltipElement)) {
      document.body.removeChild(tooltipElement);
    }
    delete el.tooltipEl;
  });
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
};
