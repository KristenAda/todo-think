<template>
  <div class="monthly-work-score-board">
    <div class="common-title">
      <c-title name="查询条件"></c-title>
    </div>
    <c-search-panel
      v-model="searchQuery"
      :columns="searchConfig"
      @search="handleSearch"
      @reset="handleReset"
    >
    </c-search-panel>

    <div class="flex-row justify-between cards">
      <WorkPointsCard :points="0" type="sum"></WorkPointsCard>
      <WorkPointsCard :points="0" type="average"></WorkPointsCard>
      <WorkPointsCard :points="0" type="maxGroup"></WorkPointsCard>
      <WorkPointsCard :points="0" type="maxEmployee"></WorkPointsCard>
    </div>
    <div class="echarts">
      <el-row :gutter="20">
        <el-col :span="12">
          <!-- 班组工分排行榜 -->
          <LineCharts></LineCharts>
        </el-col>
        <el-col :span="12">
          <!-- 班组工分分布 -->
          <TeamWorkDist></TeamWorkDist>
        </el-col>
        <el-col :span="12">
          <!-- 员工工分排行榜 -->
          <StaffWorkScoreRanking></StaffWorkScoreRanking>
        </el-col>
        <el-col :span="12">
          <!-- 员工工分分布 -->
          <StaffWorkDist></StaffWorkDist>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { getSearchConfig, type SearchQueryType } from './index';
import WorkPointsCard from './components/workPointsCard.vue';
import LineCharts from './components/lineCharts.vue';
import TeamWorkDist from './components/teamWorkDist.vue';
import StaffWorkDist from './components/staffWorkDist.vue';
import StaffWorkScoreRanking from './components/staffWorkScoreRanking.vue';
// 查询条件
const searchQuery = reactive<SearchQueryType>({
  month: '',
  unitId: '',
});
// 搜索面板配置
const searchConfig = getSearchConfig(searchQuery);
// 搜索按钮触发
const handleSearch = (val) => {};

// 重置
const handleReset = () => {
  Object.assign(searchQuery, {
    month: '',
  });
};
</script>
<style lang="scss" scoped>
:deep(.router-main) {
  padding: 0;
}
.monthly-work-score-board {
  padding-bottom: 30px;
  box-sizing: border-box;

  .cards {
    margin: 20px 0;
    padding: 0 150px;
    box-sizing: border-box;
  }
}
</style>

<style lang="scss">
.router-main {
  &:has(.monthly-work-score-board) {
    overflow-y: auto;
  }
}
</style>
