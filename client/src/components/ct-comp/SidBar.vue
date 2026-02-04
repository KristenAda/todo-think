<template>
  <div class="container">
    <el-menu class="el-menu-vertical" mode="horizontal" @select="handleSelect">
      <el-menu-item
        v-for="item in routerList"
        :key="item.path"
        :index="item.path"
        >{{ item.meta.title }}</el-menu-item
      >
    </el-menu>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

const router = useRouter();
const routerList = <any>router.getRoutes();

const handleSelect = (key: string) => {
  router.push(key);
};
</script>

<style lang="scss" scoped>
.el-menu-vertical {
  height: 60px;
  overflow: auto;
}
</style>
