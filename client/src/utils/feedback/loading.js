import myLoading from '@/components/feedback/DhLoading.vue';

// loading信息对象
const msgInfo = reactive({
  isShow: false,
  loadingTxt: null,
});

// 创建divLoading元素
const vLoading = createApp(myLoading, { msgInfo }).mount(
  document.createElement('div'),
);

/**
 * 显示
 * @param {string} loadingTxt 显示字符
 */
const showLoading = (loadingTxt) => {
  msgInfo.isShow = true;
  msgInfo.loadingTxt = loadingTxt;
  document.body.appendChild(vLoading.$el);
};

/**
 * 关闭
 */
const closeLoading = () => {
  msgInfo.isShow = false;
};

export default {
  install(app) {
    app.config.globalProperties.$dhLoading = {
      show: showLoading,
      close: closeLoading,
    };
  },
};

export { closeLoading, showLoading };
