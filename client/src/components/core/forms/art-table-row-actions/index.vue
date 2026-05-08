<!-- 表格行操作：纯文字主色 + 「更多」折叠，遵循列表页统一交互 -->
<template>
  <div class="art-table-row-actions">
    <template v-if="hasVisible">
      <ElButton
        v-for="item in inlineList"
        :key="item.key"
        link
        :type="item.danger ? 'danger' : 'primary'"
        :disabled="item.disabled"
        class="art-table-row-actions__link"
        @click="handleClick(item)"
      >
        {{ item.label }}
      </ElButton>
      <ElDropdown v-if="dropdownList.length > 0" trigger="click" @command="handleCommand">
        <span class="art-table-row-actions__more-trigger inline-flex items-center cursor-pointer select-none">
          <ElButton link type="primary" class="art-table-row-actions__more-btn">
            更多
            <ArtSvgIcon icon="ri:arrow-down-s-line" class="ml-0.5 text-base opacity-80" />
          </ElButton>
        </span>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem
              v-for="item in dropdownList"
              :key="item.key"
              :command="String(item.key)"
              :disabled="item.disabled"
            >
              <span
                class="text-sm"
                :class="item.danger ? 'text-danger' : 'text-[var(--el-text-color-regular)]'"
              >
                {{ item.label }}
              </span>
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </template>
    <span v-else class="text-g-400">—</span>
  </div>
</template>

<script setup lang="ts">
  import { useAuth } from '@/hooks/core/useAuth';

  defineOptions({ name: 'ArtTableRowActions' });

  /** 操作项：按业务频率排序，危险项设 danger 并靠后；超过 3 个时前 2 个外露，其余进「更多」 */
  export interface TableRowActionItem {
    key: string | number;
    label: string;
    /** 仅用于样式：危险操作用主题危险色 */
    danger?: boolean;
    disabled?: boolean;
    /** 无则默认可见 */
    auth?: string;
    onClick?: () => void | Promise<void>;
  }

  const props = withDefaults(
    defineProps<{
      items: TableRowActionItem[];
    }>(),
    { items: () => [] }
  );

  const { hasAuth } = useAuth();

  const list = computed(() => props.items.filter((i) => !i.auth || hasAuth(i.auth)));

  const hasVisible = computed(() => list.value.length > 0);

  /** 条数 ≤3 全部外露；>3 时前 2 个外露，其余进「更多」 */
  const inlineList = computed(() => {
    const v = list.value;
    if (v.length <= 3) return v;
    return v.slice(0, 2);
  });

  const dropdownList = computed(() => {
    const v = list.value;
    if (v.length <= 3) return [];
    return v.slice(2);
  });

  const handleClick = (item: TableRowActionItem) => {
    item.onClick?.();
  };

  const handleCommand = (cmd: string) => {
    const item = dropdownList.value.find((i) => String(i.key) === cmd);
    if (item) handleClick(item);
  };
</script>

<style scoped lang="scss">
  /* 禁止换行：操作列固定宽度时也不能纵向折行 */
  .art-table-row-actions {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 8px 12px;
    line-height: 1.2;
    white-space: nowrap;
  }

  .art-table-row-actions__link,
  .art-table-row-actions__more-btn {
    flex-shrink: 0;
    padding: 0 2px;
    height: auto;
    font-size: 13px;
    font-weight: 400;
    white-space: nowrap;
  }

  .art-table-row-actions__more-trigger {
    flex-shrink: 0;
    white-space: nowrap;
  }
</style>
