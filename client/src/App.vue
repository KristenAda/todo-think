<template>
  <ElConfigProvider size="default" :locale="locales[language]" :z-index="10000">
    <RouterView></RouterView>
    <ArtDialogTrayContainer />
    <PointsSettlementParticleOverlay />
  </ElConfigProvider>
</template>

<script setup lang="ts">
  import { onBeforeMount, onMounted, watch } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useUserStore } from './store/modules/user';
  import { useMessageStore } from './store/modules/message';
  import WebSocketClient from '@/utils/socket';
  import zh from 'element-plus/es/locale/lang/zh-cn';
  import en from 'element-plus/es/locale/lang/en';
  import { systemUpgrade } from './utils/sys';
  import { toggleTransition } from './utils/ui/animation';
  import { checkStorageCompatibility } from './utils/storage';
  import { initializeTheme } from './hooks/core/useTheme';
  import PointsSettlementParticleOverlay from '@/components/core/effects/PointsSettlementParticleOverlay.vue';

  const userStore = useUserStore();
  const messageStore = useMessageStore();
  const { language } = storeToRefs(userStore);

  const locales = {
    zh: zh,
    en: en
  };

  /**
   * 构造 WS 连接地址（严格复用既有 WebSocketClient，不再封装一层）
   * - 后端约定：/ws?token=<JWT>
   */
  function buildWsUrlWithToken(rawUrl: string, token: string) {
    if (!rawUrl) return rawUrl;
    const joiner = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${joiner}token=${encodeURIComponent(token)}`;
  }

  /**
   * 推导 WS 基础地址：
   * - 优先使用 VITE_LOGIN_WEBSOCKET（推荐你后续补到 .env.development/.env.production）
   * - 开发环境兜底：用 VITE_API_PROXY_URL（http://localhost:3000）推导为 ws://localhost:3000/ws
   * - 生产环境兜底：使用当前站点 origin 推导为 ws(s)://<host>/ws
   */
  function resolveWsBaseUrl() {
    const env = import.meta.env as any;
    const explicit = env.VITE_LOGIN_WEBSOCKET;
    if (explicit) return String(explicit);

    const proxyHttp = env.VITE_API_PROXY_URL;
    if (proxyHttp) return String(proxyHttp).replace(/^http/i, 'ws').replace(/\/$/, '') + '/ws';

    const origin = window.location.origin; // http(s)://host
    return origin.replace(/^http/i, 'ws').replace(/\/$/, '') + '/ws';
  }

  function initMessageWs() {
    const token = userStore.accessToken;
    if (!userStore.isLogin || !token) return;

    const base = resolveWsBaseUrl();
    const url = buildWsUrlWithToken(base, token);
    if (!url) return;

    const ws = WebSocketClient.getInstance({
      url,
      messageHandler: messageStore.handleSocketMessage
    });
    ws.init();
  }

  function destroyMessageWs() {
    WebSocketClient.destroyInstance();
  }

  onBeforeMount(() => {
    toggleTransition(true);
    initializeTheme();
  });

  onMounted(() => {
    checkStorageCompatibility();
    toggleTransition(false);
    systemUpgrade();

    // 已登录场景（刷新页面）：启动 WS + 拉一次未读数
    if (userStore.isLogin) {
      initMessageWs();
      messageStore.refreshUnreadCount();
      messageStore.refreshLatestMessages();
    }
  });

  // 登录/登出时自动初始化与回收连接，避免残留重连
  watch(
    () => userStore.isLogin,
    (isLogin) => {
      if (isLogin) {
        initMessageWs();
        messageStore.refreshUnreadCount();
        messageStore.refreshLatestMessages();
      } else {
        destroyMessageWs();
      }
    }
  );
</script>
