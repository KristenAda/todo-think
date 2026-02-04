// 1. 创建全局唯一的 Tooltip DOM（单例模式）
/* eslint-disable no-underscore-dangle */

const tooltipId = 'v-ellipsis-premium-tooltip';
let tooltipEl = null;

function createTooltip() {
  // 如果已存在则直接返回
  if (document.getElementById(tooltipId)) {
    return document.getElementById(tooltipId);
  }

  const div = document.createElement('div');
  div.id = tooltipId;

  // --- ✨ 样式美化区域 ✨ ---
  const { style } = div;

  // 基础布局
  style.position = 'fixed';
  style.zIndex = '9999';
  style.display = 'none'; // 初始隐藏

  // 尺寸与排版
  style.maxWidth = '500px';
  style.padding = '10px 14px';
  style.lineHeight = '1.6';
  style.fontSize = '13px';
  style.fontFamily =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  style.textAlign = 'justify'; // 文本两端对齐，看起来更整齐

  // 颜色与背景（高级暗黑风）
  style.color = '#fff';
  style.background = 'rgba(48, 49, 51, 0.95)'; // 深灰背景，微透
  style.backdropFilter = 'blur(6px)'; // 毛玻璃效果（浏览器支持时生效）
  style.border = '1px solid rgba(255, 255, 255, 0.1)'; // 极细的微光边框

  // 边角与阴影
  style.borderRadius = '6px';
  style.boxShadow =
    '0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 3px 6px -4px rgba(0, 0, 0, 0.48)'; // 双层阴影增加立体感

  // 交互与换行逻辑
  style.wordWrap = 'break-word';
  style.whiteSpace = 'normal';
  style.pointerEvents = 'none'; // 穿透点击，避免遮挡

  // 动画过渡
  style.opacity = '0';
  style.transition = 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)'; // 缓动动画

  document.body.appendChild(div);
  return div;
}

export default {
  mounted(el) {
    // 1. 设置宿主元素样式（确保省略号生效）
    el.style.overflow = 'hidden';
    el.style.textOverflow = 'ellipsis';
    el.style.whiteSpace = 'nowrap';

    // 2. 确保 Tooltip 存在
    if (!tooltipEl) {
      tooltipEl = createTooltip();
    }

    // 3. 鼠标移入
    el._mouseEnterHandler = (e) => {
      // 只有内容溢出才显示
      if (el.scrollWidth > el.clientWidth) {
        // 设置内容
        tooltipEl.innerText = el.innerText || el.textContent;

        // 显示逻辑
        tooltipEl.style.display = 'block';
        // 稍微延迟一帧设置 opacity 以触发 transition 动画
        requestAnimationFrame(() => {
          tooltipEl.style.opacity = '1';
        });

        updateTooltipPosition(e);
      }
    };

    // 4. 鼠标移动（Tooltip 跟随）
    el._mouseMoveHandler = (e) => {
      // 只有在显示状态下才更新位置
      if (tooltipEl.style.display === 'block') {
        updateTooltipPosition(e);
      }
    };

    // 5. 鼠标移出
    el._mouseLeaveHandler = () => {
      if (tooltipEl) {
        tooltipEl.style.opacity = '0';
        // 等待动画结束后再 display: none，防止闪烁
        setTimeout(() => {
          // 双重检查，防止在动画过程中鼠标又移入了
          if (tooltipEl.style.opacity === '0') {
            tooltipEl.style.display = 'none';
          }
        }, 200); // 时间需与 transition 保持一致
      }
    };

    el.addEventListener('mouseenter', el._mouseEnterHandler);
    el.addEventListener('mousemove', el._mouseMoveHandler);
    el.addEventListener('mouseleave', el._mouseLeaveHandler);
  },

  unmounted(el) {
    el.removeEventListener('mouseenter', el._mouseEnterHandler);
    el.removeEventListener('mousemove', el._mouseMoveHandler);
    el.removeEventListener('mouseleave', el._mouseLeaveHandler);
  },
};

// 辅助：位置计算
function updateTooltipPosition(e) {
  if (!tooltipEl) return;

  const offset = 12; // 鼠标偏移量
  let left = e.clientX + offset;
  let top = e.clientY + offset;

  // 视口边界检测
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;
  const tipWidth = tooltipEl.offsetWidth;
  const tipHeight = tooltipEl.offsetHeight;

  // 右边界溢出 -> 移到鼠标左侧
  if (left + tipWidth > winWidth) {
    left = e.clientX - tipWidth - offset;
  }

  // 下边界溢出 -> 移到鼠标上方
  if (top + tipHeight > winHeight) {
    top = e.clientY - tipHeight - offset;
  }

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}
