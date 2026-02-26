import type { DirectiveBinding } from 'vue';
import { useAuthorityStore } from '@/stores/authority';

export default {
  /**
   * Vue 指令挂载时调用的函数 (支持 v-permission="['sys:user:add']")
   */
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding;
    const useAuthority = useAuthorityStore();

    if (value && value instanceof Array && value.length > 0) {
      // 检查是否包含对应权限标识 (Store 中已内置对 '*' 超级管理员的放行)
      const hasPermission = value.some((perm) =>
        useAuthority.hasPermission(perm),
      );

      if (!hasPermission) {
        if (el.parentNode) {
          // 如果是 element-plus 的 el-space，则删除整个 item wrapper
          if (el.parentElement?.className === 'el-space__item') {
            el.parentElement.remove();
          }
          el.parentNode.removeChild(el); // 无权限则直接从 DOM 树移除
        } else {
          el.style.display = 'none';
        }
      }
    } else {
      throw new Error(
        `需要设置权限标签，例如 v-permission="['sys:user:add', 'sys:user:edit']"`,
      );
    }
  },
};
