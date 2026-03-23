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
import { computed } from 'vue';
import { useRouter } from 'vue-router';

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

  let result = '';
  // 如果路径已经是绝对路径（以 / 开头），直接使用
  if (routePath.startsWith('/')) {
    result = routePath;
  } else {
    // 相对路径处理
    const base = props.basePath.startsWith('/')
      ? props.basePath
      : `/${props.basePath}`;
    const sub = routePath.replace(/^\/+/, '');
    result = base ? `${base}/${sub}` : `/${sub}`;
  }

  // 规范化路径：移除多余的连续 /
  result = result.replace(/\/+/g, '/');

  // 【修复核心】：如果最终结果不是仅仅一个 '/'，且末尾以 '/' 结尾，则去掉末尾的 '/'
  if (result.length > 1 && result.endsWith('/')) {
    result = result.slice(0, -1);
  }

  return result;
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
/* 添加字体图标的基础样式，让其与文字对齐，并保持和原生 el-icon 类似的间距 */
.menu-icon {
  width: 24px;
  text-align: center;
  font-size: 16px;
  margin-right: 5px; /* 距离右侧文字的间距 */
  vertical-align: middle;
  color: inherit; /* 继承外层 el-menu 自动处理的激活/普通颜色 */
}
</style>
