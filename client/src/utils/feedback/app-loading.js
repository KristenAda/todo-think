let loadingStatus = 'hide';

/**
 * 隐藏appLoadingInit
 */
const closeAppLoadingInit = () => {
  document.getElementById('app-loading')?.classList.add('init-completed');
};

/**
 * 隐藏appLoading
 */
const closeAppLoading = () => {
  document.getElementById('app-loading')?.classList.remove('show-manual');
  loadingStatus = 'hide';
};

/**
 * 显示appLoading
 * @param options.delay 延迟显示时间
 */
const showAppLoading = (options) => {
  if (options && options.delay) {
    loadingStatus = 'waiting-show';
    setTimeout(() => {
      if (loadingStatus !== 'waiting-show') {
        return;
      }
      document.getElementById('app-loading')?.classList.add('show-manual');
      loadingStatus = 'show';
    }, options.delay);
  } else {
    document.getElementById('app-loading')?.classList.add('show-manual');
    loadingStatus = 'show';
  }
};

export { closeAppLoadingInit, closeAppLoading, showAppLoading };
