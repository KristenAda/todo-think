<template>
  <Teleport to="body">
    <Transition name="art-dialog-fade">
      <div
        v-if="modelValue && !isMinimized"
        class="art-dialog-overlay"
        :style="{ zIndex: props.zIndex }"
        @click.self="handleOverlayClick"
      >
        <Transition name="art-dialog-zoom">
          <div
            class="art-dialog-wrapper"
            :class="{ 'art-dialog--maximized': isMaximized }"
            :style="dialogStyle"
            @click.stop
          >
            <div class="art-dialog">
              <!-- 头部 -->
              <div class="art-dialog__header" @mousedown="startDrag">
                <div class="art-dialog__title-wrap">
                  <span v-if="icon" class="art-dialog__title-icon">
                    <ArtSvgIcon :icon="icon" />
                  </span>
                  <span class="art-dialog__title">{{ title }}</span>
                  <span v-if="subtitle" class="art-dialog__subtitle">{{ subtitle }}</span>
                </div>
                <div class="art-dialog__actions">
                  <button
                    v-if="showMinimize"
                    class="art-dialog__action-btn art-dialog__action-btn--minimize"
                    title="最小化"
                    @click.stop="handleMinimize"
                  >
                    <ArtSvgIcon icon="heroicons:minus-20-solid" />
                  </button>
                  <button
                    v-if="showMaximize"
                    class="art-dialog__action-btn art-dialog__action-btn--maximize"
                    :title="isMaximized ? '还原' : '最大化'"
                    @click.stop="handleMaximize"
                  >
                    <ArtSvgIcon
                      :icon="
                        isMaximized
                          ? 'heroicons:arrows-pointing-in-20-solid'
                          : 'heroicons:arrows-pointing-out-20-solid'
                      "
                    />
                  </button>
                  <button
                    class="art-dialog__action-btn art-dialog__action-btn--close"
                    title="关闭"
                    @click.stop="handleClose"
                  >
                    <ArtSvgIcon icon="heroicons:x-mark-20-solid" />
                  </button>
                </div>
              </div>
              <!-- 内容区 -->
              <div class="art-dialog__body" :style="bodyStyle">
                <slot />
              </div>
              <!-- 底部插槽 -->
              <div v-if="$slots.footer" class="art-dialog__footer">
                <slot name="footer" />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { useTrayManager } from './trayManager';

  defineOptions({ name: 'ArtDialog' });

  interface Props {
    modelValue: boolean;
    title?: string;
    subtitle?: string;
    icon?: string;
    width?: string | number;
    maxHeight?: string;
    closeOnOverlay?: boolean;
    showMinimize?: boolean;
    showMaximize?: boolean;
    zIndex?: number;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'close'): void;
    (e: 'closed'): void;
    (e: 'open'): void;
    (e: 'minimize'): void;
    (e: 'maximize'): void;
    (e: 'restore'): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '',
    subtitle: '',
    icon: '',
    width: '500px',
    maxHeight: '72vh',
    closeOnOverlay: false,
    showMinimize: true,
    showMaximize: true,
    zIndex: 9999
  });

  const emit = defineEmits<Emits>();

  const isMaximized = ref(false);
  const isMinimized = ref(false);

  // 唯一实例 ID，用于托盘管理
  const instanceId = `art-dialog-${Math.random().toString(36).slice(2)}`;
  const { addTray, removeTray } = useTrayManager();

  // 拖拽相关
  const offsetX = ref(0);
  const offsetY = ref(0);
  const isDragging = ref(false);
  const dragStartX = ref(0);
  const dragStartY = ref(0);

  const dialogStyle = computed(() => {
    if (isMaximized.value) return { zIndex: props.zIndex };
    const w = typeof props.width === 'number' ? `${props.width}px` : props.width;
    return {
      width: w,
      zIndex: props.zIndex,
      transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px))`
    };
  });

  const bodyStyle = computed(() => ({
    maxHeight: isMaximized.value ? 'calc(100vh - 56px - 68px)' : props.maxHeight
  }));

  const handleClose = () => {
    removeTray(instanceId);
    isMinimized.value = false;
    isMaximized.value = false;
    offsetX.value = 0;
    offsetY.value = 0;
    emit('update:modelValue', false);
    emit('close');
  };

  const handleMinimize = () => {
    isMinimized.value = true;
    addTray({
      id: instanceId,
      title: props.title || '弹窗',
      icon: props.icon || '',
      restore: handleRestore,
      close: handleClose
    });
    emit('minimize');
  };

  const handleMaximize = () => {
    isMaximized.value = !isMaximized.value;
    if (isMaximized.value) {
      offsetX.value = 0;
      offsetY.value = 0;
      emit('maximize');
    } else {
      emit('restore');
    }
  };

  const handleRestore = () => {
    isMinimized.value = false;
    removeTray(instanceId);
    emit('restore');
  };

  const handleOverlayClick = () => {
    if (props.closeOnOverlay) handleClose();
  };

  const startDrag = (e: MouseEvent) => {
    if (isMaximized.value) return;
    isDragging.value = true;
    dragStartX.value = e.clientX - offsetX.value;
    dragStartY.value = e.clientY - offsetY.value;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const onDrag = (e: MouseEvent) => {
    if (!isDragging.value) return;
    offsetX.value = e.clientX - dragStartX.value;
    offsetY.value = e.clientY - dragStartY.value;
  };

  const stopDrag = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        isMinimized.value = false;
        isMaximized.value = false;
        removeTray(instanceId);
        offsetX.value = 0;
        offsetY.value = 0;
        emit('open');
      } else {
        removeTray(instanceId);
        nextTick(() => emit('closed'));
      }
    }
  );

  onUnmounted(() => {
    removeTray(instanceId);
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  });
</script>

<style scoped lang="scss">
  /* ====== 遮罩 ====== */
  .art-dialog-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.42);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  /* ====== 弹窗定位容器 ====== */
  .art-dialog-wrapper {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);

    &.art-dialog--maximized {
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      transform: none;
      width: 100vw !important;
      max-width: 100vw;
      max-height: 100vh;
    }
  }

  /* ====== 弹窗主体 ====== */
  .art-dialog {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--art-main-bg-color, #fff);
    border-radius: 16px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 32px 80px rgba(0, 0, 0, 0.2);

    .art-dialog--maximized & {
      border-radius: 0;
    }
  }

  /* ====== 头部 ====== */
  .art-dialog__header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px 0 20px;
    height: 56px;
    flex-shrink: 0;
    cursor: grab;
    user-select: none;
    background: var(--art-main-bg-color, #fff);
    border-bottom: 1px solid var(--art-border-color, #e8e8e8);

    &:active {
      cursor: grabbing;
    }
  }

  .art-dialog__title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    overflow: hidden;
  }

  .art-dialog__title-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--main-color, #4080ff) 12%, transparent);
    color: var(--main-color, #4080ff);
    font-size: 16px;
    flex-shrink: 0;
  }

  .art-dialog__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--art-gray-800, #1a1a2e);
    letter-spacing: 0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .art-dialog__subtitle {
    font-size: 12px;
    color: var(--art-gray-500, #909399);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ====== 操作按钮组 ====== */
  .art-dialog__actions {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
    margin-left: 12px;
  }

  .art-dialog__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 17px;
    transition:
      transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.2s ease;
    outline: none;

    &:hover {
      transform: scale(1.18);
    }
    &:active {
      transform: scale(0.93);
    }

    &--minimize {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #fff;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
      &:hover {
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.65);
      }
    }

    &--maximize {
      background: linear-gradient(135deg, #34d399, #10b981);
      color: #fff;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
      &:hover {
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.65);
      }
    }

    &--close {
      background: linear-gradient(135deg, #f87171, #ef4444);
      color: #fff;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
      &:hover {
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.65);
      }
    }
  }

  /* ====== 内容区 ====== */
  .art-dialog__body {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    color: var(--art-gray-700, #606266);

    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--main-color, #4080ff) 28%, transparent);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  /* ====== 底部 ====== */
  .art-dialog__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 24px;
    flex-shrink: 0;
    border-top: 1px solid var(--art-border-color, #e8e8e8);
    background: color-mix(
      in srgb,
      var(--art-gray-100, #f5f5f5) 35%,
      var(--art-main-bg-color, #fff)
    );
  }

  /* ====== 过渡动画 ====== */
  .art-dialog-fade-enter-active,
  .art-dialog-fade-leave-active {
    transition: opacity 0.25s ease;
  }

  .art-dialog-fade-enter-from,
  .art-dialog-fade-leave-to {
    opacity: 0;
  }

  .art-dialog-zoom-enter-active {
    transition:
      opacity 0.28s ease,
      transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .art-dialog-zoom-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .art-dialog-zoom-enter-from,
  .art-dialog-zoom-leave-to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.88);
  }
</style>
