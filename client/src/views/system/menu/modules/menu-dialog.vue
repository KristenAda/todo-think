<template>
  <ElDialog
    :title="dialogTitle"
    :model-value="visible"
    @update:model-value="handleCancel"
    width="860px"
    align-center
    class="menu-dialog"
    @closed="handleClosed"
  >
    <ArtForm
      ref="formRef"
      v-model="form"
      :items="formItems"
      :rules="rules"
      :span="width > 640 ? 12 : 24"
      :gutter="20"
      label-width="100px"
      :show-reset="false"
      :show-submit="false"
    >
      <template #menuType>
        <ElRadioGroup v-model="form.menuType" :disabled="disableMenuType">
          <ElRadioButton value="menu" label="menu">菜单</ElRadioButton>
          <ElRadioButton value="button" label="button">按钮</ElRadioButton>
        </ElRadioGroup>
      </template>

      <template #authList>
        <div class="auth-list-editor">
          <TransitionGroup name="list" tag="div" class="auth-tags" v-if="form.authList.length">
            <div v-for="(item, index) in form.authList" :key="item.authMark" class="auth-tag-item">
              <span class="auth-tag-title">{{ item.title }}</span>
              <div class="auth-divider"></div>
              <span class="auth-tag-mark">{{ item.authMark }}</span>
              <span class="auth-tag-delete" @click="removeAuthItem(index)">
                <ElIcon><Close /></ElIcon>
              </span>
            </div>
          </TransitionGroup>

          <div v-else class="auth-empty">
            <span>暂无权限标识，请在下方添加</span>
          </div>

          <div class="auth-add-row">
            <ElInput
              v-model="newAuthItem.title"
              placeholder="权限名称，如：新增"
              size="small"
              class="auth-input"
              @keyup.enter="addAuthItem"
            />
            <ElInput
              v-model="newAuthItem.authMark"
              placeholder="标识，如：add"
              size="small"
              class="auth-input"
              @keyup.enter="addAuthItem"
            />
            <ElButton size="small" type="primary" @click="addAuthItem" plain>添加</ElButton>
          </div>
        </div>
      </template>
    </ArtForm>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleCancel">取 消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="loading">确 定</ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormRules } from 'element-plus';
  import { ElIcon, ElTooltip, ElMessage } from 'element-plus';
  import { QuestionFilled, Close } from '@element-plus/icons-vue';
  import { formatMenuTitle } from '@/utils/router';
  import type { AppRouteRecord } from '@/types/router';
  import type { FormItem } from '@/components/core/forms/art-form/index.vue';
  import ArtForm from '@/components/core/forms/art-form/index.vue';
  import { useWindowSize } from '@vueuse/core';
  import { fetchAddMenu, fetchUpdateMenu } from '@/api/system-manage';
  import { ref, reactive, computed, watch, nextTick, h } from 'vue';

  const { width } = useWindowSize();

  const createLabelTooltip = (label: string, tooltip: string) => {
    return () =>
      h('span', { class: 'flex items-center' }, [
        h('span', label),
        h(
          ElTooltip,
          {
            content: tooltip,
            placement: 'top'
          },
          () => h(ElIcon, { class: 'ml-0.5 cursor-help' }, () => h(QuestionFilled))
        )
      ]);
  };

  interface AuthItem {
    title: string;
    authMark: string;
  }

  interface MenuFormData {
    id: number;
    name: string;
    path: string;
    label: string;
    component: string;
    icon: string;
    isEnable: boolean;
    sort: number;
    isMenu: boolean;
    keepAlive: boolean;
    isHide: boolean;
    isHideTab: boolean;
    link: string;
    isIframe: boolean;
    showBadge: boolean;
    showTextBadge: string;
    fixedTab: boolean;
    activePath: string;
    roles: string[];
    isFullPage: boolean;
    authList: AuthItem[];
    authName: string;
    authLabel: string;
    authIcon: string;
    authSort: number;
  }

  interface Props {
    visible: boolean;
    editData?: AppRouteRecord | any;
    type?: 'menu' | 'button';
    lockType?: boolean;
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'submit', data: MenuFormData): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    type: 'menu',
    lockType: false
  });

  const emit = defineEmits<Emits>();

  const formRef = ref();
  const isEdit = ref(false);
  const loading = ref(false);

  const form = reactive<MenuFormData & { menuType: 'menu' | 'button' }>({
    menuType: 'menu',
    id: 0,
    name: '',
    path: '',
    label: '',
    component: '',
    icon: '',
    isEnable: true,
    sort: 1,
    isMenu: true,
    keepAlive: true,
    isHide: false,
    isHideTab: false,
    link: '',
    isIframe: false,
    showBadge: false,
    showTextBadge: '',
    fixedTab: false,
    activePath: '',
    roles: [],
    isFullPage: false,
    authList: [],
    authName: '',
    authLabel: '',
    authIcon: '',
    authSort: 1
  });

  const newAuthItem = reactive({ title: '', authMark: '' });

  const addAuthItem = (): void => {
    if (!newAuthItem.title.trim() || !newAuthItem.authMark.trim()) {
      ElMessage.warning('请填写权限名称和标识');
      return;
    }
    const exists = form.authList.some((item) => item.authMark === newAuthItem.authMark.trim());
    if (exists) {
      ElMessage.warning('该权限标识已存在');
      return;
    }
    form.authList.push({ title: newAuthItem.title.trim(), authMark: newAuthItem.authMark.trim() });
    newAuthItem.title = '';
    newAuthItem.authMark = '';
  };

  const removeAuthItem = (index: number): void => {
    form.authList.splice(index, 1);
  };

  const rules = reactive<FormRules>({
    name: [
      { required: true, message: '请输入菜单名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }],
    label: [{ required: true, message: '输入权限标识', trigger: 'blur' }],
    authName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
    authLabel: [{ required: true, message: '请输入权限标识', trigger: 'blur' }]
  });

  const formItems = computed<FormItem[]>(() => {
    const baseItems: FormItem[] = [{ label: '菜单类型', key: 'menuType', span: 24 }];
    const switchSpan = width.value < 640 ? 12 : 6;

    if (form.menuType === 'menu') {
      return [
        ...baseItems,
        { label: '菜单名称', key: 'name', type: 'input', props: { placeholder: '菜单名称' } },
        {
          label: createLabelTooltip(
            '路由地址',
            '一级菜单：以 / 开头的绝对路径（如 /dashboard）\n二级及以下：相对路径（如 console、user）'
          ),
          key: 'path',
          type: 'input',
          props: { placeholder: '如：/dashboard 或 console' }
        },
        { label: '权限标识', key: 'label', type: 'input', props: { placeholder: '如：User' } },
        {
          label: createLabelTooltip(
            '组件路径',
            '一级父级菜单：填写 /index/index\n具体页面：填写组件路径（如 /system/user）\n目录菜单：留空'
          ),
          key: 'component',
          type: 'input',
          props: { placeholder: '如：/system/user 或留空' }
        },
        { label: '图标', key: 'icon', type: 'input', props: { placeholder: '如：ri:user-line' } },
        {
          label: createLabelTooltip(
            '角色权限',
            '仅用于前端权限模式：配置角色标识（如 R_SUPER、R_ADMIN）\n后端权限模式：无需配置'
          ),
          key: 'roles',
          type: 'inputtag',
          props: { placeholder: '输入角色标识后按回车，如：R_SUPER' }
        },
        {
          label: '菜单排序',
          key: 'sort',
          type: 'number',
          props: { min: 1, controlsPosition: 'right', style: { width: '100%' } }
        },
        {
          label: '外部链接',
          key: 'link',
          type: 'input',
          props: { placeholder: '如：https://www.example.com' }
        },
        {
          label: '文本徽章',
          key: 'showTextBadge',
          type: 'input',
          props: { placeholder: '如：New、Hot' }
        },
        {
          label: createLabelTooltip(
            '激活路径',
            '用于详情页等隐藏菜单，指定高亮显示的父级菜单路径\n例如：用户详情页高亮显示"用户管理"菜单'
          ),
          key: 'activePath',
          type: 'input',
          props: { placeholder: '如：/system/user' }
        },
        { label: '是否启用', key: 'isEnable', type: 'switch', span: switchSpan },
        { label: '页面缓存', key: 'keepAlive', type: 'switch', span: switchSpan },
        { label: '隐藏菜单', key: 'isHide', type: 'switch', span: switchSpan },
        { label: '是否内嵌', key: 'isIframe', type: 'switch', span: switchSpan },
        { label: '显示徽章', key: 'showBadge', type: 'switch', span: switchSpan },
        { label: '固定标签', key: 'fixedTab', type: 'switch', span: switchSpan },
        { label: '标签隐藏', key: 'isHideTab', type: 'switch', span: switchSpan },
        { label: '全屏页面', key: 'isFullPage', type: 'switch', span: switchSpan },
        { label: '权限标识', key: 'authList', span: 24 }
      ];
    } else {
      return [
        ...baseItems,
        {
          label: '权限名称',
          key: 'authName',
          type: 'input',
          props: { placeholder: '如：新增、编辑、删除' }
        },
        {
          label: '权限标识',
          key: 'authLabel',
          type: 'input',
          props: { placeholder: '如：add、edit、delete' }
        },
        {
          label: '权限排序',
          key: 'authSort',
          type: 'number',
          props: { min: 1, controlsPosition: 'right', style: { width: '100%' } }
        }
      ];
    }
  });

  const dialogTitle = computed(() => {
    const type = form.menuType === 'menu' ? '菜单' : '按钮';
    return isEdit.value ? `编辑${type}` : `新建${type}`;
  });

  const disableMenuType = computed(() => {
    if (isEdit.value) return true;
    if (!isEdit.value && form.menuType === 'menu' && props.lockType) return true;
    return false;
  });

  const resetForm = (): void => {
    formRef.value?.reset();
    form.menuType = 'menu';
    form.authList = [];
    newAuthItem.title = '';
    newAuthItem.authMark = '';
  };

  const loadFormData = (): void => {
    if (!props.editData) return;

    isEdit.value = true;

    if (form.menuType === 'menu') {
      const row = props.editData;
      form.id = row.id || 0;
      form.name = formatMenuTitle(row.meta?.title || '');
      form.path = row.path || '';
      form.label = row.name || '';
      form.component = row.component || '';
      form.icon = row.meta?.icon || '';
      form.sort = row.meta?.sort || 1;
      form.isMenu = row.meta?.isMenu ?? true;
      form.keepAlive = row.meta?.keepAlive ?? false;
      form.isHide = row.meta?.isHide ?? false;
      form.isHideTab = row.meta?.isHideTab ?? false;
      form.isEnable = row.meta?.isEnable ?? true;
      form.link = row.meta?.link || '';
      form.isIframe = row.meta?.isIframe ?? false;
      form.showBadge = row.meta?.showBadge ?? false;
      form.showTextBadge = row.meta?.showTextBadge || '';
      form.fixedTab = row.meta?.fixedTab ?? false;
      form.activePath = row.meta?.activePath || '';
      form.roles = row.meta?.roles || [];
      form.isFullPage = row.meta?.isFullPage ?? false;
      form.authList = row.meta?.authList ? [...row.meta.authList] : [];
    } else {
      const row = props.editData;
      form.authName = row.title || '';
      form.authLabel = row.authMark || '';
      form.authIcon = row.icon || '';
      form.authSort = row.sort || 1;
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formRef.value) return;

    try {
      await formRef.value.validate();
      loading.value = true;

      let submitData: any;

      if (form.menuType === 'menu') {
        submitData = {
          id: isEdit.value ? form.id : undefined,
          name: form.label,
          title: form.name,
          path: form.path,
          component: form.component,
          icon: form.icon,
          type: 2,
          sort: form.sort,
          isEnable: form.isEnable,
          keepAlive: form.keepAlive,
          isIframe: form.isIframe,
          isHide: form.isHide,
          isHideTab: form.isHideTab,
          link: form.link,
          showBadge: form.showBadge,
          showTextBadge: form.showTextBadge,
          fixedTab: form.fixedTab,
          activePath: form.activePath,
          isFullPage: form.isFullPage,
          roles: form.roles,
          authList: form.authList.length ? form.authList : undefined
        };
      } else {
        submitData = {
          id: isEdit.value ? form.id : undefined,
          name: form.authLabel,
          title: form.authName,
          type: 3,
          sort: form.authSort,
          icon: form.authIcon
        };
      }

      if (isEdit.value) {
        await fetchUpdateMenu(submitData);
        ElMessage.success('编辑成功');
      } else {
        await fetchAddMenu(submitData);
        ElMessage.success('新增成功');
      }

      emit('submit', { ...form });
      handleCancel();
    } catch (error) {
      if (error && typeof error === 'object' && !('message' in (error as any))) {
        return;
      }
      ElMessage.error('提交失败，请重试');
    } finally {
      loading.value = false;
    }
  };

  const handleCancel = (): void => {
    emit('update:visible', false);
  };

  const handleClosed = (): void => {
    resetForm();
    isEdit.value = false;
  };

  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        form.menuType = props.type;
        nextTick(() => {
          if (props.editData) {
            loadFormData();
          }
        });
      }
    }
  );

  watch(
    () => props.type,
    (newType) => {
      if (props.visible) {
        form.menuType = newType;
      }
    }
  );
</script>

<style scoped lang="scss">
  .auth-list-editor {
    width: 100%;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-border-color);
    }

    .auth-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
    }

    .auth-tag-item {
      display: inline-flex;
      align-items: center;
      height: 26px; /* 强制压低并固定高度 */
      padding: 0 4px 0 10px; /* 取消上下 padding，完全靠 align-items: center 垂直居中 */
      border-radius: 13px; /* 完美半圆角 */
      background: var(--el-color-primary-light-9);
      border: 1px solid var(--el-color-primary-light-7);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
      box-sizing: border-box;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(var(--el-color-primary-rgb), 0.15);
        border-color: var(--el-color-primary-light-5);
      }

      .auth-tag-title {
        color: var(--el-color-primary);
        font-size: 12px; /* 稍微减小字号以适配紧凑高度 */
        font-weight: 600;
        margin-right: 6px;
      }

      .auth-divider {
        width: 1px;
        height: 12px; /* 分割线稍微变短 */
        background: var(--el-color-primary-light-5);
        margin-right: 6px;
      }

      .auth-tag-mark {
        color: var(--el-text-color-regular);
        font-family: Consolas, Monaco, monospace;
        font-size: 12px;
        background: var(--el-bg-color);
        padding: 0 6px; /* 去除上下 padding */
        line-height: 18px; /* 限制行高 */
        border-radius: 9px;
        margin-right: 4px;
        border: 1px solid var(--el-border-color-lighter);
      }

      .auth-tag-delete {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px; /* 缩小关闭按钮的宽高 */
        height: 16px;
        border-radius: 50%;
        cursor: pointer;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        transition: all 0.2s ease;

        &:hover {
          background-color: var(--el-color-danger-light-9);
          color: var(--el-color-danger);
        }

        .el-icon {
          transform: scale(0.85); /* 稍微缩小内部 X 图标的比例 */
        }
      }
    }

    .auth-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px; /* 略微压低空状态高度 */
      font-size: 13px;
      color: var(--el-text-color-placeholder);
      background: var(--el-fill-color-blank);
      border: 1px dashed var(--el-border-color);
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .auth-add-row {
      display: flex;
      gap: 12px;
      align-items: center;
      padding-top: 16px;
      border-top: 1px dashed var(--el-border-color-light);

      .auth-input {
        flex: 1;
      }
    }

    /* 列表过渡动画 */
    .list-enter-active,
    .list-leave-active {
      transition: all 0.4s ease;
    }
    .list-enter-from,
    .list-leave-to {
      opacity: 0;
      transform: scale(0.9) translateY(10px);
    }
    .list-leave-active {
      position: absolute;
    }
  }
</style>
