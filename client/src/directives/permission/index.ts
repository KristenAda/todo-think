// import { DirectiveBinding } from 'vue';
import { useAuthorityStore } from '@/stores/authority';

/**
 * 检查权限
 * @returns
 */
export const checkPermission = () => {
  const useAuthority = useAuthorityStore();
  return useAuthority.hasEditPermission();
};

export default {
  /**
   * Vue 指令挂载时调用的函数
   *
   * @param el 要绑定的元素
   * @param binding 指令的绑定信息，其中包含了传入的指令值
   * @returns 无返回值
   */
  mounted(el: HTMLElement) {
    // const { value } = binding;
    const hasPermission = checkPermission();
    console.log('hasPermission :>> ', hasPermission);
    if (!hasPermission) {
      if (el.parentNode) {
        // 如果是el-space,则删除整个item
        if (el.parentElement.className === 'el-space__item') {
          el.parentElement.remove();
        }
        el.parentNode.removeChild(el); // 如果没有权限，移除该元素
      } else {
        el.style.display = 'none';
      }
    }
  },
};
