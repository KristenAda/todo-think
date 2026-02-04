<template>
  <div class="wrapper">
    <el-watermark
      :width="230"
      class="water-marker"
      :height="300"
      :offset="[60, 300]"
      :gap="[0, 0]"
    >
      <slot></slot>
    </el-watermark>
  </div>
</template>
<script setup name="CWrapper" lang="ts">
// import { getSingleOrg } from '@/utils';
// 当前所属单位
// const currentOrg = getSingleOrg()

import { reactive } from 'vue';

defineOptions({ name: 'CPage' });
// const content = [`用户登录名：${currentOrg.loginName||'暂无信息'}`,`用户姓名${currentOrg.userName||'暂无信息'}`,`单位编码：${currentOrg.orgNo||'暂无信息'}`,`管理单位名称：${currentOrg.deptName||'暂无信息'}`,`ip:${location.host||'暂无信息'}`,`时间戳:${new Date().getTime()}`]
const font = reactive({
  color: 'rgba(0, 0, 0, .06)',
  textAlign: 'left',
  fontSize: 0,
});
</script>
<style lang="scss">
.wrapper {
  padding: 0px 20px 20px 20px;
  color: #000;
  // .el-watermark{
  //   display: none;
  // }
  //   .water-marker{
  //   background-color: #fff !important;
  // }
}
</style>
