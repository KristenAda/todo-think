const confirmWarnTipKey = 'warnTip';

const defaultOptions = {
  cancelButtonText: '取消',
  confirmButtonText: '确认',
  closeOnClickModal: false,
  closeOnPressEscape: false,
};

/**
 * 创建消息内容
 * @param {Object} confirmInfo
 */
function createMessage(confirmInfo) {
  const messageNodes = [];

  // 如果有警告提示，优先显示
  if (confirmInfo[confirmWarnTipKey]) {
    messageNodes.push(
      h('div', { class: 'warn-tips' }, confirmInfo[confirmWarnTipKey]),
    );
  }

  // 组装剩余信息
  for (const key in confirmInfo) {
    if (Object.hasOwnProperty.call(confirmInfo, key)) {
      const element = confirmInfo[key];
      if (key !== confirmWarnTipKey) {
        messageNodes.push(
          h('div', { class: 'confirm-item' }, [
            h('span', { class: 'confirm-item-title' }, `${key}：`),
            h('span', { class: 'confirm-item-content' }, element),
          ]),
        );
      }
    }
  }
  return h('div', messageNodes);
}

/**
 * 普通
 * @param {Object} [options] 配置项
 * @returns {Promise}
 */
const msgbox = (options) => {
  return ElMessageBox({ ...defaultOptions, ...options });
};

/**
 * 警告
 * @param {String | VNode} message 消息内容
 * @param {String} title 标题
 * @param {Object} [options] 配置项
 * @returns {Promise} ElMessageBox
 */
const alert = (message, title, options) => {
  let curOptions = options;
  let curTitle = title;
  if (typeof title === 'object' && typeof options === 'undefined') {
    curOptions = title;
    curTitle = undefined;
  }
  if (curTitle) {
    return ElMessageBox.alert(message, curTitle, {
      ...defaultOptions,
      ...curOptions,
      type: 'warning',
    });
  }
  return ElMessageBox.alert(message, {
    ...defaultOptions,
    ...curOptions,
    type: 'warning',
  });
};

/**
 * 确认
 * @param {String | VNode | Object} message 消息内容
 * @param {String} [message.warnTip] 警告提示
 * @param {String} title 标题
 * @param {Object} [options] 配置项
 * @returns {Promise} ElMessageBox
 */
const confirm = (message, title, options) => {
  let curOptions = options;
  let curTitle = title;
  let curMessage = message;
  if (typeof title === 'object' && typeof options === 'undefined') {
    curOptions = title;
    curTitle = undefined;
  }
  if (typeof message === 'object') {
    curMessage = createMessage(message);
  }
  if (curTitle) {
    return ElMessageBox.confirm(curMessage, curTitle, {
      ...defaultOptions,
      ...curOptions,
    });
  }
  return ElMessageBox.confirm(curMessage, { ...defaultOptions, ...curOptions });
};

/**
 * 提示
 * @param {String | VNode} message 消息内容
 * @param {String} title 标题
 * @param {Object} [options] 配置项
 * @returns {Promise} ElMessageBox
 */
const prompt = (message, title, options) => {
  let curOptions = options;
  let curTitle = title;
  if (typeof title === 'object' && typeof options === 'undefined') {
    curOptions = title;
    curTitle = undefined;
  }
  if (title) {
    return ElMessageBox.prompt(message, curTitle, {
      ...defaultOptions,
      ...curOptions,
      type: 'info',
    });
  }
  return ElMessageBox.prompt(message, {
    ...defaultOptions,
    ...curOptions,
    type: 'info',
  });
};

export default {
  install(app) {
    app.config.globalProperties.$msgbox = msgbox;
    app.config.globalProperties.$alert = alert;
    app.config.globalProperties.$confirm = confirm;
    app.config.globalProperties.$prompt = prompt;
  },
};

export { alert, confirm, msgbox, prompt };
