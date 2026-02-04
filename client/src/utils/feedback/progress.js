import progress from '@/components/feedback/ZcProgress.vue';

// progress信息对象
const msgInfo = reactive({
  isShow: false,
  loadingTxt: null,
});

// 创建divLoading元素
const vLoading = createApp(progress, { msgInfo }).mount(
  document.createElement('div'),
);

/**
 * 显示
 * @param {string} loadingTxt 显示字符
 */
const showProgress = (loadingTxt) => {
  msgInfo.isShow = true;
  msgInfo.loadingTxt = loadingTxt;
  document.body.appendChild(vLoading.$el);
};

/**
 * 关闭
 */
const closeProgress = () => {
  msgInfo.isShow = false;
};

export default {
  install(app) {
    app.config.globalProperties.$dhLoading = {
      show: showProgress,
      close: closeProgress,
    };
  },
};

export { closeProgress, showProgress };
