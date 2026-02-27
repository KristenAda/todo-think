<template>
  <template v-if="!item.meta?.hidden">
    <el-menu-item
      v-if="theOnlyOneChild"
      :index="resolvePath(theOnlyOneChild.path)"
      @click="handleLinkClick(theOnlyOneChild)"
    >
      <i
        v-if="theOnlyOneChild.meta?.icon || item.meta?.icon"
        :class="theOnlyOneChild.meta?.icon || item.meta?.icon"
        class="menu-icon"
      ></i>

      <template #title>
        <span>{{ theOnlyOneChild.meta?.title }}</span>
      </template>
    </el-menu-item>

    <el-sub-menu v-else :index="resolvePath(item.path)" teleported>
      <template #title>
        <i
          v-if="item.meta?.icon || showingChildren[0]?.meta?.icon"
          :class="item.meta?.icon || showingChildren[0]?.meta?.icon"
          class="menu-icon"
        ></i>
        <span>{{ item.meta?.title }}</span>
      </template>

      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </el-sub-menu>
  </template>
</template>

<script setup lang="ts">
// ...（Script 逻辑无需任何修改，完全保持上一版的完美重构代码即可）...
const props = defineProps({
  item: { type: Object, required: true },
  basePath: { type: String, default: '' },
});

const router = useRouter();

const showingChildren = computed(() => {
  if (!props.item.children) return [];
  return props.item.children.filter((child: any) => !child.meta?.hidden);
});

const theOnlyOneChild = computed(() => {
  if (showingChildren.value.length > 1) return null;
  if (showingChildren.value.length === 1) return showingChildren.value[0];
  if (showingChildren.value.length === 0) {
    return { ...props.item, path: '', noShowingChildren: true };
  }
  return null;
});

const isExternal = (path: string) => /^(https?:|mailto:|tel:)/.test(path);

const resolvePath = (routePath: string) => {
  if (isExternal(routePath)) return routePath;
  if (routePath.startsWith('/')) return routePath;
  const base = props.basePath.startsWith('/')
    ? props.basePath
    : `/${props.basePath}`;
  const sub = routePath.replace(/^\/+/, '');
  return (base ? `${base}/${sub}` : `/${sub}`).replace(/\/+/g, '/');
};

const handleLinkClick = (child: any) => {
  const finalPath = resolvePath(child.path);
  if (isExternal(finalPath)) {
    window.open(finalPath, '_blank');
  } else {
    router.push(finalPath);
  }
};
</script>

<style scoped lang="scss">
/* 【修改点 3】：添加字体图标的基础样式，让其与文字对齐，并保持和原生 el-icon 类似的间距 */
.menu-icon {
  width: 24px;
  text-align: center;
  font-size: 16px;
  margin-right: 5px; /* 距离右侧文字的间距 */
  vertical-align: middle;
  color: inherit; /* 继承外层 el-menu 自动处理的激活/普通颜色 */
}
</style>
