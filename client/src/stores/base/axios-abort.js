/**
 * axios取消请求（修改为关闭所有请求，无菜单区分）
 */
export default defineStore('base/axios-abort', () => {
  // 取消请求控制器数组（直接存储AbortController实例，无需关联view）
  const abortControllerArray = ref([]);

  /**
   * 添加控制器（移除view参数，无需区分菜单）
   * @param {AbortController} controller 取消控制器
   */
  const addController = (controller) => {
    abortControllerArray.value.push(controller);
  };

  /**
   * 取消所有请求
   */
  const cancelAll = () => {
    abortControllerArray.value.forEach((controller) => {
      controller.abort();
    });
    abortControllerArray.value = []; // 清空控制器数组
  };

  /**
   * 取消当前页面的请求（修改为关闭所有请求，无菜单区分）
   */
  const cancelCurrentView = () => {
    // 直接调用cancelAll，实现关闭所有请求的效果
    cancelAll();
  };

  return {
    abortControllerArray,

    addController,
    cancelAll,
    cancelCurrentView,
  };
});
