import { closeLoading, showLoading } from './loading';
import { alert, confirm, msgbox, prompt } from './message-box';

export default {
  loading: {
    show: showLoading,
    close: closeLoading,
    hide: closeLoading,
  },

  msgbox,
  alert,
  confirm,
  prompt,
};
