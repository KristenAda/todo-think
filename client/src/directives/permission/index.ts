import type { DirectiveBinding } from 'vue';
import { useAuthorityStore } from '@/stores/authority';

/**
 * 权限指令类型定义
 */
interface PermissionValue {
  value: string | string[];
  mode?: 'remove' | 'hide' | 'disable';
}

/**
 * 权限指令 v-permission
 *
 * 用于控制元素的显示/隐藏/禁用，基于用户权限
 *
 * 使用方式：
 * 1. 字符串：v-permission="'sys:user:add'"
 * 2. 数组：v-permission="['sys:user:add', 'sys:user:edit']"
 * 3. 对象：v-permission="{ value: ['sys:user:add'], mode: 'disable' }"
 *
 * 模式说明：
 * - remove: 无权限时从 DOM 移除（默认）
 * - hide: 无权限时隐藏（display:none）
 * - disable: 无权限时禁用（仅限按钮）
 */
export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding;
    const authorityStore = useAuthorityStore();

    // 1. 解析指令值
    let permissions: string[] = [];
    let mode: 'remove' | 'hide' | 'disable' = 'remove';

    if (typeof value === 'string') {
      // 字符串格式：v-permission="'sys:user:add'"
      permissions = [value];
    } else if (Array.isArray(value)) {
      // 数组格式：v-permission="['sys:user:add', 'sys:user:edit']"
      permissions = value;
    } else if (typeof value === 'object' && value !== null) {
      // 对象格式：v-permission="{ value: [...], mode: 'hide' }"
      permissions = Array.isArray(value.value) ? value.value : [value.value];
      mode = value.mode || 'remove';
    } else {
      console.error(
        '权限指令值格式错误，应为字符串、数组或对象。例如：v-permission="\'sys:user:add\'"',
      );
      return;
    }

    // 2. 检查权限（OR 逻辑：只要有一个权限就放行）
    const hasPermission = permissions.some((perm) =>
      authorityStore.hasPermission(perm),
    );

    // 3. 根据权限和模式处理元素
    if (!hasPermission) {
      switch (mode) {
        case 'remove':
          // 从 DOM 移除
          if (el.parentNode) {
            // 特殊处理 el-space 的 item wrapper
            if (el.parentElement?.className === 'el-space__item') {
              el.parentElement.remove();
            } else {
              el.parentNode.removeChild(el);
            }
          }
          break;

        case 'hide':
          // 隐藏（保留 DOM 结构）
          el.style.display = 'none';
          break;

        case 'disable':
          // 禁用（仅限按钮类元素）
          if (
            el.tagName === 'BUTTON' ||
            el.classList.contains('el-button') ||
            el.classList.contains('el-icon-button')
          ) {
            el.setAttribute('disabled', 'disabled');
            el.classList.add('is-disabled');
            // 添加 title 提示
            if (!el.getAttribute('title')) {
              el.setAttribute('title', '您没有权限执行此操作');
            }
          } else {
            // 非按钮元素降级为 hide 模式
            el.style.display = 'none';
          }
          break;

        default:
          el.style.display = 'none';
      }
    }
  },

  /**
   * 权限更新时重新检查（支持动态权限变更）
   */
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { value: newValue } = binding;
    const { value: oldValue } = binding;

    // 如果权限值改变，重新挂载
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.mounted(el, binding);
    }
  },
};
