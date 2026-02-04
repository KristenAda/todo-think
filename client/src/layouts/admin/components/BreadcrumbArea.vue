<template>
  <!-- 面包屑导航 -->
  <nav class="breadcrumb">
    <el-breadcrumb separator="/">
      <!-- 首页固定项 -->
      <!-- <el-breadcrumb-item :to="{ path: '/' }"> 工单系统 </el-breadcrumb-item> -->
      <!-- 动态路由项 -->
      <el-breadcrumb-item
        v-for="item in breadcrumbs"
        :key="item.path"
        :to="item.path"
      >
        <!-- <i v-if="item.faIcon" :class="item.faIcon" class="fa-fw fa"></i> -->
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </nav>
</template>

<script setup>
const route = useRoute();
const breadcrumbs = ref([]);

// 根据当前路由生成面包屑
const buildBreadcrumbs = () => {
  if (route.meta?.navList?.length) {
    breadcrumbs.value = route.meta.navList.map((item) => {
      return {
        title: item,
        path: '',
        faIcon: null,
      };
    });
  }

  breadcrumbs.value.push({
    title: route.meta.title,
    path: '',
    faIcon: route.meta.faIcon,
  });
};

// 监听路由变化
watch(() => route.path, buildBreadcrumbs, { immediate: true });
</script>

<style scoped>
.breadcrumb {
  padding: 12px 8px;
  background-color: #f1f1f1;
}
:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #000;
}
</style>
