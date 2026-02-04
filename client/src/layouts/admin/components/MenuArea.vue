<template>
  <div class="menu-container">
    <div class="search-wrapper">
      <el-input
        v-model="searchQuery"
        placeholder="搜索菜单..."
        clearable
        prefix-icon="Search"
        class="menu-search-input"
      />
    </div>

    <el-menu
      :default-active="activeIndex"
      class="el-menu-vertical"
      :collapse="isCollapse"
      :unique-opened="false"
      :default-openeds="openedMenus"
      @select="handleSelect"
    >
      <MenuItem v-for="route in displayTree" :key="route.id" :item="route" />
    </el-menu>

    <div v-if="displayTree.length === 0" class="empty-text">未找到相关菜单</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Search } from '@element-plus/icons-vue'; // 引入搜索图标
import MenuItem from './MenuItem.vue';

const router = useRouter();
const route = useRoute();
const activeIndex = ref('');
const isCollapse = ref(false);
const searchQuery = ref(''); // 搜索关键词

// --- 基础数据：构建完整的原始树 ---
const fullMenuTree = computed(() => {
  const routes = router.options.routes || [];
  const tree = [];

  routes.forEach((r) => {
    if (r.meta?.hidden) return;
    const navList = r.meta?.navList || [];
    let currentLevel = tree;

    navList.forEach((navTitle, index) => {
      let folder = currentLevel.find((node) => node.title === navTitle);
      if (!folder) {
        folder = {
          id: `group-${navTitle}`,
          title: navTitle,
          faIcon: 'fa-folder-open-o',
          children: [],
        };
        currentLevel.push(folder);
      }
      currentLevel = folder.children;
    });

    currentLevel.push({
      id: r.path,
      path: r.path,
      name: r.name,
      title: r.meta?.title || r.name,
      faIcon: r.meta?.faIcon,
      icon: r.meta?.icon,
      children: [],
    });
  });
  return tree;
});

const routeNameToPathMap = computed(() => {
  const map = {};

  // 辅助递归函数
  const traverse = (nodes) => {
    nodes.forEach((node) => {
      // 记录叶子节点的 name 和 path 关系
      if (node.name) {
        map[node.name] = node.path;
      }
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(fullMenuTree.value); // 遍历完整的菜单树
  return map;
});

// --- 核心逻辑：根据搜索关键词过滤树 ---
const displayTree = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return fullMenuTree.value;

  // 递归过滤函数
  const filterNode = (nodes) => {
    return nodes
      .map((node) => ({ ...node })) // 浅拷贝节点
      .filter((node) => {
        // 检查自身标题是否匹配
        const selfMatch = node.title.toLowerCase().includes(query);

        // 递归检查子节点
        if (node.children && node.children.length > 0) {
          node.children = filterNode(node.children);
          // 如果子节点有匹配的，或者自身匹配，则保留
          return node.children.length > 0 || selfMatch;
        }

        // 叶子节点直接看自身是否匹配
        return selfMatch;
      });
  };

  return filterNode(fullMenuTree.value);
});

// 搜索时自动展开所有匹配的菜单项
const openedMenus = computed(() => {
  if (!searchQuery.value) return [];
  // 这里可以根据过滤后的 displayTree 提取所有 ID 来默认展开
  const getIds = (nodes) => {
    let ids = [];
    nodes.forEach((n) => {
      if (n.children?.length > 0) {
        ids.push(n.id);
        ids = ids.concat(getIds(n.children));
      }
    });
    return ids;
  };
  return getIds(displayTree.value);
});

const handleSelect = (index) => {
  activeIndex.value = index;
};

// onMounted(() => {
//   activeIndex.value = route.path;
// });

watch(
  () => route.path,
  () => {
    // 1. 优先尝试通过路由名称匹配 (这是解决 Alias 问题的关键)
    // 只要你的路由定义了 name，这里就能找到原始的 path
    const originalPath = routeNameToPathMap.value[route.name];

    // 2. 如果找到了原始 Path，就用它；否则兜底使用当前 Path
    if (originalPath) {
      activeIndex.value = originalPath;
    } else {
      // 兜底逻辑：处理没有 name 的路由或 404 情况
      // 尝试去 route.matched 里找最末级的原始 path
      const matchedPath = route.matched[route.matched.length - 1]?.path;
      activeIndex.value = matchedPath || route.path;
    }
  },
  { immediate: true }, // 初始化时立即执行
);
</script>

<style scoped>
/* 容器布局 */
.menu-container {
  height: 100%;
  width: 220px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

/* 搜索区域样式 */
.search-wrapper {
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

.menu-search-input :deep(.el-input__wrapper) {
  background-color: #f5f7fa;
  box-shadow: none !important;
  border-radius: 20px;
}

/* 菜单区域样式 */
.el-menu-vertical {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  -webkit-user-select: none;
  user-select: none;
}
.el-menu-vertical {
  width: 220px;
  border-radius: 8px;
  /* box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08); */
  /* background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%); */
  border-right: none;
  /* 禁止用户选中文字 */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* 标准语法 */
}

.el-menu-item,
:deep(.el-sub-menu__title) {
  border-radius: 6px;
  margin: 4px 8px;
  height: 42px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.el-menu-item.is-active {
  color: #fff !important;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.4);
  &:hover {
    background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
    color: #fff;
  }
}

/* 图标对齐 */
i.fa-fw {
  width: 1em;
  height: 1em;
  margin-right: 8px;
  font-size: 16px;
  text-align: center;
}

.el-menu-item span,
:deep(.el-sub-menu__title span) {
  margin-left: 8px;
  font-weight: 500;
}

.el-menu-vertical {
  will-change: width;
}

.el-menu-item,
.el-sub-menu__title {
  will-change: background, padding, margin;
}
</style>
