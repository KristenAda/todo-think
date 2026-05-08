<!-- 有头像用照片；无头像按性别使用固定底色默认头像（与 ColorAvatar 一致） -->
<template>
  <span v-bind="$attrs" class="user-avatar-wrap">
    <ElAvatar
      v-if="resolvedSrc"
      :size="size"
      :src="resolvedSrc"
      :fit="fit"
      :class="avatarClass"
    >
      <slot />
    </ElAvatar>
    <ColorAvatar
      v-else
      :name="displayName"
      :gender="gender ?? ''"
      :size="size"
      :class="avatarClass"
    />
  </span>
</template>

<script setup lang="ts">
  defineOptions({ name: 'UserAvatar', inheritAttrs: false });

  const props = withDefaults(
    defineProps<{
      /** 头像 URL；空则走 ColorAvatar */
      src?: string | null;
      /** 无头像时展示用名 */
      name?: string;
      /** 与系统一致：男 / 女，其它按男处理 */
      gender?: string | null;
      size?: number;
      fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
      avatarClass?: string;
    }>(),
    {
      name: '',
      gender: '',
      size: 32,
      fit: 'cover',
      avatarClass: ''
    }
  );

  const resolvedSrc = computed(() => {
    const s = props.src;
    if (s == null || s === '') return '';
    return String(s).trim() || '';
  });

  const displayName = computed(() => props.name?.trim() || '?');
</script>

<style scoped lang="scss">
  .user-avatar-wrap {
    display: inline-flex;
    vertical-align: middle;
    flex-shrink: 0;
    line-height: 0;
  }
</style>
