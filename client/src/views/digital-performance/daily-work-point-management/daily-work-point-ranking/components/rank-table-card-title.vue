<template>
  <div class="rank-title-box1">
    <div class="rank-title-box2">
      <div class="rank-title-box3"><slot name="title" /></div>
    </div>
  </div>
</template>
<script setup></script>
<style scoped lang="scss">
.rank-title-box1 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  margin: 0 0;
  width: 188px;
  background-color: rgba(2, 167, 240, 0.5);
  .rank-title-box2 {
    width: 160px;
    margin: 0 auto;
    background-color: rgba(2, 167, 240, 0.3);
    .rank-title-box3 {
      width: 120px;
      margin: 0 auto;
      text-align: center;
      padding: 5px 0;
      box-sizing: border-box;
      color: #fff;
      background-color: rgba(2, 167, 240);
    }
  }
}
</style>
