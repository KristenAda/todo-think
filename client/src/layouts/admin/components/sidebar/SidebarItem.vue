<template>
  <div v-if="!item.meta?.hidden">
    <template v-if="hasOneShowingChild(item.children, item)">
      <component
        :is="isExternal(resolvePath(onlyOneChild.path)) ? 'a' : 'el-menu-item'"
        :index="resolvePath(onlyOneChild.path)"
        :href="
          isExternal(resolvePath(onlyOneChild.path))
            ? resolvePath(onlyOneChild.path)
            : undefined
        "
        :target="
          isExternal(resolvePath(onlyOneChild.path)) ? '_blank' : undefined
        "
      >
        <el-icon v-if="onlyOneChild.meta?.icon || item.meta?.icon">
          <component :is="onlyOneChild.meta?.icon || item.meta?.icon" />
        </el-icon>
        <template #title>{{ onlyOneChild.meta?.title }}</template>
      </component>
    </template>

    <el-sub-menu v-else :index="item.path" teleported>
      <template #title>
        <el-icon v-if="item.meta?.icon">
          <component :is="item.meta?.icon" />
        </el-icon>
        <span>{{ item.meta?.title }}</span>
      </template>
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </el-sub-menu>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  item: { type: Object, required: true },
  basePath: { type: String, default: '' },
});

const onlyOneChild = ref<any>(null);

// 判断是否是外部链接 (http/https/mailto/tel)
const isExternal = (path: string) => {
  return /^(https?:|mailto:|tel:)/.test(path);
};

/**
 * 核心修复：更健壮的路径拼接逻辑
 */
const resolvePath = (routePath: string) => {
  // 1. 如果是外部链接 (http/https)，直接返回
  if (/^(https?:|mailto:|tel:)/.test(routePath)) return routePath;

  // 2. 如果子路径本身就是绝对路径 (以 / 开头)，直接返回
  if (routePath.startsWith('/')) return routePath;

  // 3. 拼接父路径和子路径
  // 确保 basePath 以 / 开头
  let base = props.basePath.startsWith('/')
    ? props.basePath
    : `/${props.basePath}`;

  // 移除 base 结尾的斜杠，移除 sub 开头的斜杠
  base = base.replace(/\/+$/, '');
  const sub = routePath.replace(/^\/+/, '');

  // 4. 合并并过滤掉多余的重复斜杠 (例如把 // 变成 /)
  const finalPath = base ? `${base}/${sub}` : `/${sub}`;
  return finalPath.replace(/\/+/g, '/');
};

// eslint-disable-next-line default-param-last
const hasOneShowingChild = (children = [], parent: any) => {
  const showingChildren = children.filter((item: any) => !item.meta?.hidden);
  if (showingChildren.length === 1) {
    // eslint-disable-next-line prefer-destructuring
    onlyOneChild.value = showingChildren[0];
    return true;
  }
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, noShowingChildren: true };
    return true;
  }
  return false;
};
</script>
