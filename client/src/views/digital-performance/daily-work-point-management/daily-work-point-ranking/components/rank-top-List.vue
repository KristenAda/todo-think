<template>
  <div class="top-box">
    <div
      v-for="item in topListUser"
      :key="item"
      class="box-item"
      :class="`top${item.rankingNum}`"
    >
      <div v-if="item.rankingNum == '1'" class="jiangbei">
        <img src="../assets/image/jiangbei.png" />
      </div>

      <div class="top-bg" :class="`top-bg${item.rankingNum}`">
        <div class="rank">{{ item.rankingNum }}</div>
      </div>
      <div class="info-box">
        <div class="work-point">
          <img :src="getImgPath(item.rankingNum)" />
          <div>{{ item.workScore }}分</div>
        </div>
        <div class="name">{{ item.empName || item.teamName }}</div>

        <div
          v-if="item.lastRankingNum !== 0"
          style="
            display: flex;
            align-items: center;
            justify-content: space-around;
          "
        >
          <div style="color: #aaa; font-size: 13px">较昨日</div>
          <span
            :style="{
              color: item.lastRankingNum > 0 ? '#EC808D' : '#70b603',
            }"
          >
            {{ Math.abs(item.lastRankingNum) }}名</span
          >
          <el-icon
            v-if="item.lastRankingNum > 0"
            color="#EC808D"
            style="font-size: 18px"
            class="no-inherit"
          >
            <CaretTop />
          </el-icon>
          <el-icon
            v-else
            color="#70b603"
            style="font-size: 18px"
            class="no-inherit"
          >
            <CaretBottom />
          </el-icon>
        </div>
        <div
          v-else
          style="
            display: flex;
            align-items: center;
            justify-content: space-around;
          "
        >
          <div style="color: #aaa; font-size: 13px">较昨日</div>
          <span style="font-weight: bold">--</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  topListUser: {
    type: Array,
    default: () => [],
  },
});
const getImgPath = (imgName) => {
  return new URL(`../assets/image/top${imgName}-brand.png`, import.meta.url)
    .href;
};
</script>
<style scoped lang="scss">
.top-box {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  margin-bottom: 20px;
  height: 160px;

  .box-item {
    width: 25%;
    max-width: 150px;
    border-radius: 10px;
    background-color: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
    .jiangbei {
      position: absolute;
      top: -43px;
      //   z-index: 1;
      left: 50%;
      transform: translateX(-50%);
      img {
        width: 50px;
        object-fit: cover;
      }
    }
    &:hover {
      transform: translateY(-4px);
    }
    .top-bg {
      width: 35px;
      height: 35px;
      background-color: #fbca3f;
      margin: 10px auto 0 auto;
      text-align: center;
      line-height: 35px;
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    }
    .top-bg2 {
      background-color: #a29898;
    }
    .top-bg3 {
      background-color: #f28a63;
    }
    .info-box {
      display: flex;
      flex-direction: column;
      padding: 10px 20px;
      text-align: center;

      .name {
        font-size: 16px;
        font-weight: 400;
        color: #333;
        margin-bottom: 10px;
      }
      .work-point {
        position: relative;
        // font-size: 24px;
        // font-weight: 700;
        // color: #02a7f0;
        width: 80%;
        margin: 0 auto;
        border-radius: 20px;
        font-size: 16px;
        color: #fff;
        height: 20px;
        line-height: 20px;
        margin-bottom: 10px;
        img {
          position: absolute;
          left: -10px;
          top: 50%;
          transform: translateY(-50%);
          width: 22px;
          height: 24px;
          //   object-fit: cover;
          //   height: 16px;
        }
      }
    }
  }
  .top1 {
    height: 100%;
    margin-bottom: 15px;
    background: linear-gradient(to bottom, #fdec98 0%, #fff 100%);
    .work-point {
      background-color: #f6c267;
    }

    // background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  }
  .top2 {
    height: 92%;
    background: linear-gradient(to bottom, #eff3f6 0%, #fff 100%);
    .work-point {
      background-color: #cbc7c9;
    }
  }
  .top3 {
    height: 87%;
    background: linear-gradient(to bottom, #fde2d6 0%, #fff 100%);
    .work-point {
      background-color: #fabca1;
    }
  }
}
</style>
