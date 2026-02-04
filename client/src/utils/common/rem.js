// src/utils/rem.js

function setRem() {
  // 获取屏幕宽度
  const htmlWidth =
    document.documentElement.clientWidth || document.body.clientWidth;

  // 核心逻辑：设置一个阈值（比如 750px 或 1000px）
  // 如果屏幕宽度大于这个值，我们认为它是 PC 或平板横屏，不再进行等比缩放
  const MAX_WIDTH = 750;

  if (htmlWidth > MAX_WIDTH) {
    // 【PC模式】
    // 强制锁定根字体大小，让 1rem = 16px (对应 vite 配置的 rootValue)
    // 这样 PC 页面就不会随窗口变大而无限变大了
    document.documentElement.style.fontSize = '16px';
  } else {
    // 【移动端模式】
    // 按照设计稿比例计算 (假设设计稿是 375px)
    // 16 * (当前宽度 / 375)
    // 这样能保证移动端页面完美缩放
    const fontSize = 16 * (htmlWidth / 375);
    document.documentElement.style.fontSize = `${fontSize}px`;
  }
}

// 初始化
setRem();
// 窗口大小变化时重新计算
window.onresize = () => {
  setRem();
};
