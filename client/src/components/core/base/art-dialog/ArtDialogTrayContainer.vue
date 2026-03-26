<!-- 全局最小化托盘容器，挂载到 body，右下角展示所有最小化的弹窗 -->
<template>
  <Teleport to="body">
    <div class="art-dialog-tray-container">
      <TransitionGroup name="art-tray-list">
        <div
          v-for="item in trayList"
          :key="item.id"
          class="art-dialog-tray-item"
          @click="item.restore()"
        >
          <ArtSvgIcon v-if="item.icon" :icon="item.icon" class="art-dialog-tray-item__icon" />
          <ArtSvgIcon v-else icon="solar:widget-bold-duotone" class="art-dialog-tray-item__icon" />
          <span class="art-dialog-tray-item__title">{{ item.title }}</span>
          <button class="art-dialog-tray-item__close" title="关闭" @click.stop="item.close()">
            <ArtSvgIcon icon="solar:close-circle-bold-duotone" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { useTrayManager } from './trayManager';

  defineOptions({ name: 'ArtDialogTrayContainer' });

  const { trayList } = useTrayManager();
</script>

<style scoped lang="scss">
  .art-dialog-tray-container {
    position: fixed;
    bottom: 24px;
    left: 24px;
    z-index: 9001;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    pointer-events: none;
  }

  .art-dialog-tray-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--art-main-bg-color, #fff);
    border-radius: 40px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.16),
      0 0 0 1px var(--art-border-color, #e8e8e8);
    cursor: pointer;
    pointer-events: all;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    user-select: none;
    max-width: 260px;

    &:hover {
      transform: translateX(-4px);
      box-shadow:
        0 12px 36px rgba(0, 0, 0, 0.2),
        0 0 0 1px color-mix(in srgb, var(--main-color, #4080ff) 30%, transparent);
    }

    &__icon {
      font-size: 17px;
      color: var(--main-color, #4080ff);
      flex-shrink: 0;
    }

    &__title {
      font-size: 13px;
      font-weight: 500;
      color: var(--art-gray-700, #606266);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }

    &__close {
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      cursor: pointer;
      color: var(--art-gray-400, #c0c4cc);
      font-size: 16px;
      padding: 0;
      flex-shrink: 0;
      transition: color 0.2s;

      &:hover {
        color: #ef4444;
      }
    }
  }

  /* TransitionGroup 动画 */
  .art-tray-list-enter-active {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .art-tray-list-leave-active {
    transition: all 0.2s ease;
  }

  .art-tray-list-enter-from {
    opacity: 0;
    transform: translateX(40px) scale(0.85);
  }

  .art-tray-list-leave-to {
    opacity: 0;
    transform: translateX(20px) scale(0.9);
  }
</style>
