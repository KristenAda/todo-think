<!-- 通用路由内容区骨架：模拟标题区 + 工具条 + 表格/卡片主体 -->
<template>
  <div class="art-route-skeleton art-route-skeleton--page">
    <el-skeleton animated>
      <template #template>
        <div class="art-route-skeleton__header">
          <el-skeleton-item variant="h3" class="!w-[38%] max-w-xs" />
          <el-skeleton-item variant="text" class="!w-full mt-3" />
          <el-skeleton-item variant="text" class="!w-[72%] mt-2" />
        </div>
        <div class="art-route-skeleton__toolbar">
          <el-skeleton-item
            v-for="n in 3"
            :key="n"
            variant="rect"
            class="art-route-skeleton__btn"
          />
        </div>
        <el-skeleton-item variant="rect" class="art-route-skeleton__panel" />
        <div class="art-route-skeleton__rows">
          <el-skeleton-item v-for="n in 8" :key="'r' + n" variant="text" class="!my-2.5" />
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtRouteSkeleton' });
</script>

<style scoped lang="scss">
  .art-route-skeleton {
    box-sizing: border-box;
    width: 100%;
    min-height: 200px;
    padding: 20px;

    &--page {
      overflow: hidden;
      background: var(--default-box-color);
      border-radius: calc(var(--custom-radius) / 2 + 2px);
    }

    &__toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 20px 0 16px;
    }

    &__btn {
      width: 88px;
      height: 32px;
    }

    &__panel {
      width: 100%;
      height: 120px;
      margin-bottom: 16px;
      border-radius: 8px;
    }

    &__rows {
      padding-top: 4px;
    }
  }
</style>
