<!-- 顶部栏 -->
<template>
  <div
    class="w-full bg-[var(--default-bg-color)]"
    :class="[
      tabStyle === 'tab-card' || tabStyle === 'tab-google' ? 'mb-5 max-sm:mb-3 !bg-box' : ''
    ]"
  >
    <div
      class="relative box-border flex-b h-15 leading-15 select-none"
      :class="[
        tabStyle === 'tab-card' || tabStyle === 'tab-google'
          ? 'border-b border-[var(--art-card-border)]'
          : ''
      ]"
    >
      <div class="flex-c flex-1 min-w-0 leading-15" style="display: flex">
        <!-- 仅「顶部菜单」布局无侧栏，此处保留 Logo + 名称；左侧/双列/混合菜单仅在侧栏展示 -->
        <div class="system-info-container flex-c c-p" @click="toHome" v-if="isTopMenu">
          <ArtLogo class="pl-4.5 logo-icon" />
          <div v-if="width >= 1400" class="system-name-wrapper">
            <ArtSystemName size="md" />
          </div>
        </div>

        <!-- 菜单按钮 -->
        <ArtIconButton
          v-if="isLeftMenu && shouldShowMenuButton"
          icon="ri:menu-2-fill"
          class="ml-3 max-sm:ml-[7px]"
          @click="visibleMenu"
        />

        <!-- 刷新按钮 -->
        <ArtIconButton
          v-if="shouldShowRefreshButton"
          icon="ri:refresh-line"
          class="!ml-3 refresh-btn max-sm:!hidden"
          :style="{ marginLeft: !isLeftMenu ? '10px' : '0' }"
          @click="reload"
        />

        <!-- 快速入口 -->
        <ArtFastEnter v-if="shouldShowFastEnter && width >= headerBarFastEnterMinWidth">
          <ArtIconButton icon="ri:function-line" class="ml-3" />
        </ArtFastEnter>

        <!-- 面包屑 -->
        <ArtBreadcrumb
          v-if="(shouldShowBreadcrumb && isLeftMenu) || (shouldShowBreadcrumb && isDualMenu)"
        />

        <!-- 顶部菜单 -->
        <ArtHorizontalMenu v-if="isTopMenu" :list="menuList" />

        <!-- 混合菜单-顶部 -->
        <ArtMixedMenu v-if="isTopLeftMenu" :list="menuList" />
      </div>

      <div class="flex-c gap-2.5">
        <!-- 搜索 -->
        <div
          v-if="shouldShowGlobalSearch"
          class="flex-cb w-40 h-9 px-2.5 c-p border border-g-400 rounded-custom-sm max-md:!hidden"
          @click="openSearchDialog"
        >
          <div class="flex-c">
            <ArtSvgIcon icon="ri:search-line" class="text-sm text-g-500" />
            <span class="ml-1 text-xs font-normal text-g-500">{{ $t('topBar.search.title') }}</span>
          </div>
          <div class="flex-c h-5 px-1.5 text-g-500/80 border border-g-400 rounded">
            <ArtSvgIcon v-if="isWindows" icon="vaadin:ctrl-a" class="text-sm" />
            <ArtSvgIcon v-else icon="ri:command-fill" class="text-xs" />
            <span class="ml-0.5 text-xs">k</span>
          </div>
        </div>

        <!-- 全屏按钮 -->
        <ArtIconButton
          v-if="shouldShowFullscreen"
          :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-fill'"
          :class="[!isFullscreen ? 'full-screen-btn' : 'exit-full-screen-btn', 'ml-3']"
          class="max-md:!hidden"
          @click="toggleFullScreen"
        />

        <!-- 国际化按钮 -->
        <ElDropdown
          @command="changeLanguage"
          popper-class="langDropDownStyle"
          v-if="shouldShowLanguage"
        >
          <ArtIconButton icon="ri:translate-2" class="language-btn text-[19px]" />
          <template #dropdown>
            <ElDropdownMenu>
              <div v-for="item in languageOptions" :key="item.value" class="lang-btn-item">
                <ElDropdownItem
                  :command="item.value"
                  :class="{ 'is-selected': locale === item.value }"
                >
                  <span class="menu-txt">{{ item.label }}</span>
                  <ArtSvgIcon icon="ri:check-fill" v-if="locale === item.value" />
                </ElDropdownItem>
              </div>
            </ElDropdownMenu>
          </template>
        </ElDropdown>

        <!-- 通知按钮 -->
        <ArtIconButton
          v-if="shouldShowNotification"
          icon="ri:notification-2-line"
          class="notice-button relative"
          @click="visibleNotice"
        >
          <div
            v-show="hasUnreadMessage"
            class="absolute top-2 right-2 size-1.5 !bg-danger rounded-full"
          ></div>
        </ArtIconButton>

        <!-- 设置按钮 -->
        <div v-if="shouldShowSettings">
          <ElPopover :visible="showSettingGuide" placement="bottom-start" :width="190" :offset="0">
            <template #reference>
              <div class="flex-cc">
                <ArtIconButton icon="ri:settings-line" class="setting-btn" @click="openSetting" />
              </div>
            </template>
            <template #default>
              <p
                >{{ $t('topBar.guide.title')
                }}<span :style="{ color: systemThemeColor }"> {{ $t('topBar.guide.theme') }} </span
                >、 <span :style="{ color: systemThemeColor }"> {{ $t('topBar.guide.menu') }} </span
                >{{ $t('topBar.guide.description') }}
              </p>
            </template>
          </ElPopover>
        </div>

        <!-- 主题切换按钮 -->
        <ArtIconButton
          v-if="shouldShowThemeToggle"
          @click="themeAnimation"
          :icon="isDark ? 'ri:sun-fill' : 'ri:moon-line'"
        />

        <!-- 头像 + 积分一体化区域 -->
        <div class="user-points-group max-md:!hidden">
          <!-- 积分区域 (移至左侧，符合常规信息流向) -->
          <div class="points-chip" title="我的积分">
            <div class="points-chip__icon-wrapper">
              <ArtSvgIcon icon="ri:coin-fill" class="points-chip__icon" />
            </div>
            <span class="points-chip__value">{{ myTotalPoints }}</span>
          </div>

          <!-- 分割线 -->
          <div class="group-divider"></div>

          <!-- 头像菜单区域 (紧贴最右侧) -->
          <div class="user-menu-wrapper">
            <ArtUserMenu />
          </div>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <ArtWorkTab />

    <!-- 通知 -->
    <ArtNotification v-model:value="showNotice" ref="notice" />
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { useFullscreen, useWindowSize } from '@vueuse/core';
  import { LanguageEnum, MenuTypeEnum } from '@/enums/appEnum';
  import { useSettingStore } from '@/store/modules/setting';
  import { useUserStore } from '@/store/modules/user';
  import { useMenuStore } from '@/store/modules/menu';
  import { useMessageStore } from '@/store/modules/message';
  import { storeToRefs } from 'pinia';
  import AppConfig from '@/config';
  import { languageOptions } from '@/locales';
  import { mittBus } from '@/utils/sys';
  import { themeAnimation } from '@/utils/ui/animation';
  import { useCommon } from '@/hooks/core/useCommon';
  import { useHeaderBar } from '@/hooks/core/useHeaderBar';
  import ArtUserMenu from './widget/ArtUserMenu.vue';
  import { fetchMyTotalPoints } from '@/api/task';

  defineOptions({ name: 'ArtHeaderBar' });

  // 检测操作系统类型
  const isWindows = navigator.userAgent.includes('Windows');

  const router = useRouter();
  const { locale } = useI18n();
  const { width } = useWindowSize();

  const settingStore = useSettingStore();
  const userStore = useUserStore();
  const menuStore = useMenuStore();
  const messageStore = useMessageStore();

  // 顶部栏功能配置
  const {
    shouldShowMenuButton,
    shouldShowRefreshButton,
    shouldShowFastEnter,
    shouldShowBreadcrumb,
    shouldShowGlobalSearch,
    shouldShowFullscreen,
    shouldShowNotification,
    shouldShowLanguage,
    shouldShowSettings,
    shouldShowThemeToggle,
    fastEnterMinWidth: headerBarFastEnterMinWidth
  } = useHeaderBar();

  const { menuOpen, systemThemeColor, showSettingGuide, menuType, isDark, tabStyle } =
    storeToRefs(settingStore);

  const { language } = storeToRefs(userStore);
  const { menuList } = storeToRefs(menuStore);
  const { hasUnread: hasUnreadMessage } = storeToRefs(messageStore);

  const showNotice = ref(false);
  const notice = ref(null);
  const myTotalPoints = ref<number>(0);

  // 菜单类型判断
  const isLeftMenu = computed(() => menuType.value === MenuTypeEnum.LEFT);
  const isDualMenu = computed(() => menuType.value === MenuTypeEnum.DUAL_MENU);
  const isTopMenu = computed(() => menuType.value === MenuTypeEnum.TOP);
  const isTopLeftMenu = computed(() => menuType.value === MenuTypeEnum.TOP_LEFT);

  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  onMounted(() => {
    initLanguage();
    loadMyTotalPoints();
    document.addEventListener('click', bodyCloseNotice);
  });

  onUnmounted(() => {
    document.removeEventListener('click', bodyCloseNotice);
  });

  const toggleFullScreen = (): void => {
    toggleFullscreen();
  };

  const visibleMenu = (): void => {
    settingStore.setMenuOpen(!menuOpen.value);
  };

  const { homePath } = useCommon();
  const { refresh } = useCommon();

  const toHome = (): void => {
    router.push(homePath.value);
  };

  const reload = (time: number = 0): void => {
    setTimeout(() => {
      refresh();
    }, time);
  };

  const initLanguage = (): void => {
    locale.value = language.value;
  };

  const changeLanguage = (lang: LanguageEnum): void => {
    if (locale.value === lang) return;
    locale.value = lang;
    userStore.setLanguage(lang);
    reload(50);
  };

  const openSetting = (): void => {
    mittBus.emit('openSetting');
    if (showSettingGuide.value) {
      settingStore.hideSettingGuide();
    }
  };

  const openSearchDialog = (): void => {
    mittBus.emit('openSearchDialog');
  };

  const bodyCloseNotice = (e: any): void => {
    if (!showNotice.value) return;

    const target = e.target as HTMLElement;
    const isNoticeButton = target.closest('.notice-button');
    const isNoticePanel = target.closest('.art-notification-panel');

    if (!isNoticeButton && !isNoticePanel) {
      showNotice.value = false;
    }
  };

  const visibleNotice = (): void => {
    showNotice.value = !showNotice.value;
  };

  async function loadMyTotalPoints() {
    try {
      const res = await fetchMyTotalPoints();
      myTotalPoints.value = Number(res?.totalPoints ?? 0);
    } catch {
      myTotalPoints.value = 0;
    }
  }
</script>

<style lang="scss" scoped>
  /* Custom animations */
  @keyframes rotate180 {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(180deg);
    }
  }

  @keyframes shake {
    0% {
      transform: rotate(0);
    }
    25% {
      transform: rotate(-5deg);
    }
    50% {
      transform: rotate(5deg);
    }
    75% {
      transform: rotate(-5deg);
    }
    100% {
      transform: rotate(0);
    }
  }

  @keyframes expand {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes shrink {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes moveUp {
    0% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-3px);
    }
    100% {
      transform: translateY(0);
    }
  }

  @keyframes breathing {
    0% {
      opacity: 0.4;
      transform: scale(0.9);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
    100% {
      opacity: 0.4;
      transform: scale(0.9);
    }
  }

  /* Hover animation classes */
  .refresh-btn:hover :deep(.art-svg-icon) {
    animation: rotate180 0.5s;
  }
  .language-btn:hover :deep(.art-svg-icon) {
    animation: moveUp 0.4s;
  }
  .setting-btn:hover :deep(.art-svg-icon) {
    animation: rotate180 0.5s;
  }
  .full-screen-btn:hover :deep(.art-svg-icon) {
    animation: expand 0.6s forwards;
  }
  .exit-full-screen-btn:hover :deep(.art-svg-icon) {
    animation: shrink 0.6s forwards;
  }
  .notice-button:hover :deep(.art-svg-icon) {
    animation: shake 0.5s ease-in-out;
  }

  /* ==============================================================
     优化后：头像与积分一体化“胶囊 (Pill)”容器
  =============================================================== */
  .user-points-group {
    display: inline-flex;
    align-items: center;
    height: 100%; /* 贴合顶栏高度 */
    margin-left: 8px;
  }

  .user-points-group:hover {
    border-color: var(--el-border-color-light);
    background: var(--el-bg-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  }

  /* --- 积分内部区域 --- */
  .points-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 10px;
    border-radius: 8px; /* 改为现代感的小圆角 */
    cursor: pointer;
    background-color: transparent; /* 默认完全透明 */
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  /* 仅在悬浮时显示极浅的底色，提供交互反馈 */
  .points-chip:hover {
    background-color: var(--el-fill-color-light);
  }

  .points-chip__icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .points-chip__icon {
    font-size: 18px;
    color: #f59e0b; /* 金黄色 */
    filter: drop-shadow(0 1px 2px rgba(245, 158, 11, 0.2));
  }

  .points-chip__value {
    font-family: 'DIN Alternate', 'Roboto Mono', Consolas, Monaco, monospace;
    font-weight: 700;
    font-size: 15px;
    color: var(--el-text-color-primary);
    line-height: 1;
    margin-top: 1px;
  }

  /* --- 内部分割线 --- */
  .group-divider {
    width: 1px;
    height: 18px;
    background-color: var(--el-border-color-lighter);
    margin: 0 8px; /* 拉开一点间距，让呼吸感更好 */
  }

  /* --- 头像菜单容器 --- */
  .user-menu-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
    margin-right: 8px;
  }
  /* iPad breakpoint adjustments */
  @media screen and (width <= 768px) {
    .logo2 {
      display: block !important;
    }
  }

  @media screen and (width <= 640px) {
    .btn-box {
      width: 40px;
    }
  }

  /* System info styling */
  .system-info-container {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 8px;
    padding: 0 12px;
    margin-left: 8px;
  }

  .logo-icon {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
  }

  .system-name-wrapper {
    display: flex;
    align-items: center;
    margin-left: 12px;
    height: 100%;
  }
</style>
