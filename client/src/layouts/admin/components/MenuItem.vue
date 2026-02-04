<template>
  <el-sub-menu
    v-if="item.children && item.children.length > 0"
    :index="item.id"
  >
    <template #title>
      <i v-if="item.faIcon" class="fa-fw fa" :class="item.faIcon" />
      <el-icon v-else-if="item.icon"><component :is="item.icon" /></el-icon>
      <span>{{ item.title }}</span>
    </template>

    <MenuItem v-for="child in item.children" :key="child.id" :item="child" />
  </el-sub-menu>

  <el-menu-item v-else :index="item.path" @click="navigate(item)">
    <i v-if="item.faIcon" class="fa-fw fa" :class="item.faIcon" />
    <el-icon v-else-if="item.icon"><component :is="item.icon" /></el-icon>
    <span>{{ item.title }}</span>
  </el-menu-item>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  item: { type: Object, required: true },
});

const navigate = (item) => {
  // 如果路由有 name，优先通过 name 跳转，这样 Vue Router 会自动处理 URL
  if (item.name) {
    router.push({ name: item.name });
  } else if (item.path) {
    router.push(item.path);
  }
};
</script>
<style scoped lang="scss">
.el-menu-item {
  height: 42px;
  padding-left: 52px !important;
}
.el-menu-item,
.el-sub-menu__title {
  border-radius: 6px;
  margin: 4px 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.el-menu-item.is-active {
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.4);
  &:hover {
    background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
    color: #fff;
  }
}

.el-menu-item:hover,
.el-sub-menu__title:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

/* FontAwesome 图标与 Element 图标统一旋转动画 */
.el-menu-item:hover i,
.el-sub-menu__title:hover i,
.el-menu-item:hover .el-icon,
.el-sub-menu__title:hover .el-icon {
  transform: rotate(15deg);
  transition: transform 0.3s ease;
}

.el-sub-menu .el-menu {
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin: 4px 0;
  padding: 4px 0;
}

.el-menu--collapse .el-icon,
.el-menu--collapse i.fa-fw {
  margin: 0 auto;
}

.el-menu-item span,
.el-sub-menu__title span {
  vertical-align: middle;
  // margin-left: 8px;
  font-weight: 500;
}

/* FontAwesome 图标尺寸与 Element 图标保持一致 */
i.fa-fw {
  width: 1em;
  height: 1em;
  margin-right: 8px;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.el-menu-vertical::-webkit-scrollbar {
  width: 6px;
}
.el-menu-vertical::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}
.el-menu-vertical::-webkit-scrollbar-track {
  background: transparent;
}
</style>
