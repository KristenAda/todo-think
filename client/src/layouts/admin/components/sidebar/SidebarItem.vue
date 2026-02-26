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

// 核心逻辑：替代 path.resolve
const resolvePath = (routePath: string) => {
  if (isExternal(routePath)) return routePath;
  if (isExternal(props.basePath)) return props.basePath;

  // 拼接逻辑：去除重复的斜杠
  const base = props.basePath.replace(/\/+$/, ''); // 去掉结尾斜杠
  const sub = routePath.replace(/^\/+/, ''); // 去掉开头斜杠

  return base ? `${base}/${sub}` : `/${sub}`;
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
