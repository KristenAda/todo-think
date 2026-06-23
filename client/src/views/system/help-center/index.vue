<template>
  <div
    class="help-center art-full-height"
    :style="{ '--hc-layout-sticky-offset': `${layoutStickyOffsetPx}px` }"
  >
    <header class="hc-strip hc-glass-panel">
      <div class="hc-strip__leading">
        <div class="hc-strip__icon-wrap" aria-hidden="true">
          <art-svg-icon icon="mdi:book-open-variant" />
        </div>
        <div class="hc-strip__titles">
          <span class="hc-strip__badge">{{ $t('helpCenterPage.hero.badge') }}</span>
          <h1 class="hc-strip__title">{{ $t('helpCenterPage.hero.title') }}</h1>
        </div>
      </div>
      <p class="hc-strip__subtitle">{{ $t('helpCenterPage.hero.subtitle') }}</p>
    </header>

    <div class="hc-layout">
      <aside class="hc-aside">
        <div class="hc-aside__sticky hc-glass-panel">
          <p class="hc-aside__title">{{ $t('helpCenterPage.toc.title') }}</p>
          <nav class="hc-nav" aria-label="help toc">
            <a
              v-for="item in tocItems"
              :key="item.id"
              :href="`#${item.id}`"
              class="hc-nav__link"
              :class="{ 'is-active': activeId === item.id }"
              @click.prevent="scrollTo(item.id)"
            >
              <div class="hc-nav__link-bg"></div>
              <art-svg-icon :icon="item.icon" />
              <span class="hc-nav__link-text">{{ item.label }}</span>
            </a>
          </nav>
        </div>
      </aside>

      <main class="hc-main">
        <div class="hc-intro hc-glass-panel">
          <art-svg-icon icon="ri:lightbulb-flash-line" class="hc-intro__icon" />
          <p>{{ $t('helpCenterPage.intro') }}</p>
        </div>

        <section :id="tocItems[0].id" class="hc-section">
          <div class="hc-section__head">
            <div class="hc-section__icon-wrapper">
              <span class="hc-section__icon" aria-hidden="true">
                <art-svg-icon icon="ri:settings-3-line" />
              </span>
            </div>
            <div class="hc-section__head-text">
              <h2 class="hc-section__title">{{ $t('helpCenterPage.system.title') }}</h2>
              <p class="hc-section__lead">{{ $t('helpCenterPage.system.lead') }}</p>
            </div>
          </div>
          <div class="hc-grid">
            <article v-for="(card, i) in systemCards" :key="i" class="hc-card hc-glass-panel">
              <h3 class="hc-card__title">
                <span class="hc-card__dot"></span>
                {{ $t(card.titleKey) }}
              </h3>
              <ul class="hc-card__list">
                <li v-for="(k, j) in card.lines" :key="j">{{ $t(k) }}</li>
              </ul>
            </article>
          </div>
        </section>

        <section :id="tocItems[1].id" class="hc-section">
          <div class="hc-section__head">
            <div class="hc-section__icon-wrapper hc-section__icon-wrapper--biz">
              <span class="hc-section__icon hc-section__icon--biz">
                <art-svg-icon icon="mdi:briefcase-account-outline" />
              </span>
            </div>
            <div class="hc-section__head-text">
              <h2 class="hc-section__title">{{ $t('helpCenterPage.business.title') }}</h2>
              <p class="hc-section__lead">{{ $t('helpCenterPage.business.lead') }}</p>
            </div>
          </div>
          <div class="hc-grid">
            <article
              v-for="(card, i) in businessCards"
              :key="i"
              class="hc-card hc-card--biz hc-glass-panel"
            >
              <h3 class="hc-card__title">
                <span class="hc-card__dot hc-card__dot--biz"></span>
                {{ $t(card.titleKey) }}
              </h3>
              <ul class="hc-card__list">
                <li v-for="(k, j) in card.lines" :key="j">{{ $t(k) }}</li>
              </ul>
            </article>
          </div>
        </section>

        <section :id="tocItems[2].id" class="hc-section">
          <div class="hc-section__head">
            <div class="hc-section__icon-wrapper hc-section__icon-wrapper--perf">
              <span class="hc-section__icon hc-section__icon--perf">
                <art-svg-icon icon="mdi:chart-line" />
              </span>
            </div>
            <div class="hc-section__head-text">
              <h2 class="hc-section__title">{{ $t('helpCenterPage.performance.title') }}</h2>
              <p class="hc-section__lead">{{ $t('helpCenterPage.performance.lead') }}</p>
            </div>
          </div>
          <div class="hc-grid">
            <article
              v-for="(card, i) in perfCards"
              :key="i"
              class="hc-card hc-card--perf hc-glass-panel"
            >
              <h3 class="hc-card__title">
                <span class="hc-card__dot hc-card__dot--perf"></span>
                {{ $t(card.titleKey) }}
              </h3>
              <ul class="hc-card__list">
                <li v-for="(k, j) in card.lines" :key="j">{{ $t(k) }}</li>
              </ul>
            </article>
          </div>
        </section>

        <footer class="hc-footnote hc-glass-panel" role="note">
          <art-svg-icon icon="mdi:information-outline" />
          <span>{{ $t('helpCenterPage.footnote') }}</span>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';

  defineOptions({ name: 'HelpCenter' });

  const { t } = useI18n();

  const tocItems = computed(() => [
    {
      id: 'hc-system',
      icon: 'ri:settings-3-line',
      label: t('helpCenterPage.system.navShort')
    },
    {
      id: 'hc-business',
      icon: 'mdi:briefcase-outline',
      label: t('helpCenterPage.business.navShort')
    },
    {
      id: 'hc-performance',
      icon: 'mdi:chart-timeline-variant',
      label: t('helpCenterPage.performance.navShort')
    }
  ]);

  const systemCards = [
    {
      titleKey: 'helpCenterPage.system.cards.user.title',
      lines: [
        'helpCenterPage.system.cards.user.l1',
        'helpCenterPage.system.cards.user.l2',
        'helpCenterPage.system.cards.user.l3'
      ]
    },
    {
      titleKey: 'helpCenterPage.system.cards.role.title',
      lines: [
        'helpCenterPage.system.cards.role.l1',
        'helpCenterPage.system.cards.role.l2',
        'helpCenterPage.system.cards.role.l3'
      ]
    },
    {
      titleKey: 'helpCenterPage.system.cards.menu.title',
      lines: [
        'helpCenterPage.system.cards.menu.l1',
        'helpCenterPage.system.cards.menu.l2',
        'helpCenterPage.system.cards.menu.l3'
      ]
    },
    {
      titleKey: 'helpCenterPage.system.cards.org.title',
      lines: [
        'helpCenterPage.system.cards.org.l1',
        'helpCenterPage.system.cards.org.l2',
        'helpCenterPage.system.cards.org.l3'
      ]
    },
    {
      titleKey: 'helpCenterPage.system.cards.profile.title',
      lines: [
        'helpCenterPage.system.cards.profile.l1',
        'helpCenterPage.system.cards.profile.l2',
        'helpCenterPage.system.cards.profile.l3',
        'helpCenterPage.system.cards.profile.l4'
      ]
    },
    {
      titleKey: 'helpCenterPage.system.cards.attachment.title',
      lines: [
        'helpCenterPage.system.cards.attachment.l1',
        'helpCenterPage.system.cards.attachment.l2',
        'helpCenterPage.system.cards.attachment.l3'
      ]
    }
  ];

  const businessCards = [
    {
      titleKey: 'helpCenterPage.business.cards.project.title',
      lines: [
        'helpCenterPage.business.cards.project.l1',
        'helpCenterPage.business.cards.project.l2',
        'helpCenterPage.business.cards.project.l3'
      ]
    },
    {
      titleKey: 'helpCenterPage.business.cards.task.title',
      lines: [
        'helpCenterPage.business.cards.task.l1',
        'helpCenterPage.business.cards.task.l2',
        'helpCenterPage.business.cards.task.l3',
        'helpCenterPage.business.cards.task.l4'
      ]
    },
    {
      titleKey: 'helpCenterPage.business.cards.rules.title',
      lines: [
        'helpCenterPage.business.cards.rules.l1',
        'helpCenterPage.business.cards.rules.l2',
        'helpCenterPage.business.cards.rules.l3',
        'helpCenterPage.business.cards.rules.l4'
      ]
    },
    {
      titleKey: 'helpCenterPage.business.cards.points.title',
      lines: [
        'helpCenterPage.business.cards.points.l1',
        'helpCenterPage.business.cards.points.l2',
        'helpCenterPage.business.cards.points.l3',
        'helpCenterPage.business.cards.points.l4'
      ]
    }
  ];

  const perfCards = [
    {
      titleKey: 'helpCenterPage.performance.cards.stats.title',
      lines: [
        'helpCenterPage.performance.cards.stats.l1',
        'helpCenterPage.performance.cards.stats.l2',
        'helpCenterPage.performance.cards.stats.l3',
        'helpCenterPage.performance.cards.stats.l4'
      ]
    }
  ];

  const activeId = ref('hc-system');

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    // scrollIntoView 会自动读取 CSS 中的 scroll-margin-top 属性作为偏移量
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeId.value = id;
  }

  const observerSections = ['hc-system', 'hc-business', 'hc-performance'];
  let io: IntersectionObserver | null = null;
  let headerRo: ResizeObserver | null = null;

  /** 与 #app-main 内 sticky 的 #app-header（顶栏 + 标签栏）高度对齐，避免侧栏吸顶与锚点滚动被遮挡 */
  const layoutStickyOffsetPx = ref(128);

  function measureHeaderStickyOffset() {
    const el = document.getElementById('app-header');
    const h = el ? Math.ceil(el.getBoundingClientRect().height) : 96;
    layoutStickyOffsetPx.value = h + 14;
  }

  function setupSectionObserver() {
    io?.disconnect();
    io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) activeId.value = visible[0].target.id;
      },
      {
        rootMargin: `-${layoutStickyOffsetPx.value}px 0px -60% 0px`,
        threshold: [0, 0.1, 0.25]
      }
    );
    observerSections.forEach((sid) => {
      const node = document.getElementById(sid);
      if (node) io?.observe(node);
    });
  }

  onMounted(() => {
    measureHeaderStickyOffset();
    const headerEl = document.getElementById('app-header');
    if (headerEl && typeof ResizeObserver !== 'undefined') {
      headerRo = new ResizeObserver(() => measureHeaderStickyOffset());
      headerRo.observe(headerEl);
    }
    window.addEventListener('resize', measureHeaderStickyOffset);
    setupSectionObserver();
  });

  watch(layoutStickyOffsetPx, () => {
    setupSectionObserver();
  });

  onUnmounted(() => {
    headerRo?.disconnect();
    headerRo = null;
    window.removeEventListener('resize', measureHeaderStickyOffset);
    io?.disconnect();
  });
</script>

<style scoped lang="scss">
  /* 基础变量扩展 */
  .help-center {
    --hc-layout-sticky-offset: 128px;
    --hc-border-subtle: color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
    --hc-border-hover: color-mix(in srgb, var(--el-color-primary) 35%, transparent);
    --hc-bg-glass: color-mix(in srgb, var(--default-box-color) 75%, transparent);
    --hc-shadow-sm: 0 4px 12px color-mix(in srgb, var(--el-text-color-primary) 3%, transparent);
    --hc-shadow-hover: 0 12px 32px color-mix(in srgb, var(--el-color-primary) 12%, transparent);

    padding: 16px 24px calc(48px + env(safe-area-inset-bottom, 0px));
    max-width: 1400px;
    margin: 0 auto;
    box-sizing: border-box;
    font-family: var(--el-font-family);
  }

  /* 通用玻璃态面板 */
  .hc-glass-panel {
    background: var(--hc-bg-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--hc-border-subtle);
    box-shadow: var(--hc-shadow-sm);
  }

  /* ------------------- 顶部条带（紧凑横幅） ------------------- */
  .hc-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 20px;
    padding: 12px 18px;
    margin-bottom: 20px;
    border-radius: 14px;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-primary) 7%, var(--default-box-color)) 0%,
      var(--default-box-color) 55%
    );

    &__leading {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1 1 220px;
    }

    &__icon-wrap {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, transparent);

      .art-svg-icon {
        font-size: 22px;
      }
    }

    &__titles {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    &__badge {
      display: inline-flex;
      align-self: flex-start;
      align-items: center;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, transparent);
    }

    &__title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.35;
      color: var(--el-text-color-primary);
    }

    &__subtitle {
      flex: 1 1 100%;
      margin: 0;
      font-size: 13px;
      line-height: 1.55;
      color: var(--el-text-color-secondary);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      overflow: hidden;

      @media (min-width: 900px) {
        flex: 1 1 280px;
        margin: 0 0 0 auto;
        max-width: min(520px, 46%);
        line-clamp: 3;
        -webkit-line-clamp: 3;
      }
    }
  }

  /* ------------------- 主体布局 ------------------- */
  .hc-layout {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 32px;
    align-items: start;

    @media (max-width: 992px) {
      grid-template-columns: 1fr;
    }
  }

  /* ------------------- 侧边导航 ------------------- */
  .hc-aside {
    position: sticky;
    top: var(--hc-layout-sticky-offset);
    z-index: 10;

    @media (max-width: 992px) {
      position: relative;
      top: 0;
      z-index: 1;
    }
  }

  .hc-aside__sticky {
    padding: 20px 16px;
    border-radius: 16px;
  }

  .hc-aside__title {
    margin: 0 0 16px 8px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--el-text-color-secondary);
  }

  .hc-nav {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hc-nav__link {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    text-decoration: none;
    overflow: hidden;
    transition: color 0.25s ease;

    .hc-nav__link-bg {
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
      opacity: 0;
      transform: scaleX(0.95);
      transform-origin: left;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: inherit;
    }

    .art-svg-icon {
      position: relative;
      z-index: 1;
      font-size: 18px;
      opacity: 0.8;
      transition: transform 0.25s ease;
    }

    .hc-nav__link-text {
      position: relative;
      z-index: 1;
    }

    &:hover {
      color: var(--el-color-primary);

      .hc-nav__link-bg {
        opacity: 0.5;
        transform: scaleX(1);
      }
      .art-svg-icon {
        transform: scale(1.1);
      }
    }

    &.is-active {
      color: var(--el-color-primary);
      font-weight: 600;

      .hc-nav__link-bg {
        opacity: 1;
        transform: scaleX(1);
      }
      .art-svg-icon {
        opacity: 1;
      }
    }
  }

  /* ------------------- 核心内容区 ------------------- */
  .hc-main {
    min-width: 0;
  }

  .hc-intro {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin: 0 0 24px;
    padding: 18px 20px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-regular);
    border-radius: 14px;
    border-left: 4px solid var(--el-color-primary);

    &__icon {
      flex-shrink: 0;
      margin-top: 2px;
      font-size: 20px;
      color: var(--el-color-primary);
    }

    p {
      margin: 0;
    }
  }

  .hc-section {
    scroll-margin-top: var(--hc-layout-sticky-offset);
    margin-bottom: 40px;

    &__head {
      display: flex;
      gap: 18px;
      align-items: center;
      margin-bottom: 24px;
    }

    &__icon-wrapper {
      position: relative;
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, transparent);

      &::after {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 20px;
        background: var(--el-color-primary);
        filter: blur(12px);
        opacity: 0.15;
        z-index: -1;
      }

      &--biz {
        background: color-mix(in srgb, #6366f1 12%, transparent);
        border-color: color-mix(in srgb, #6366f1 20%, transparent);
        &::after {
          background: #6366f1;
        }
      }

      &--perf {
        background: color-mix(in srgb, #0ea5e9 12%, transparent);
        border-color: color-mix(in srgb, #0ea5e9 20%, transparent);
        &::after {
          background: #0ea5e9;
        }
      }
    }

    &__icon {
      color: var(--el-color-primary);
      .art-svg-icon {
        font-size: 24px;
      }
      &--biz {
        color: #6366f1;
      }
      &--perf {
        color: #0ea5e9;
      }
    }

    &__head-text {
      flex: 1;
    }

    &__title {
      margin: 0 0 6px;
      font-size: 22px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      letter-spacing: -0.01em;
    }

    &__lead {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--el-text-color-secondary);
    }
  }

  /* ------------------- 网格与卡片 ------------------- */
  .hc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .hc-card {
    padding: 24px;
    border-radius: 16px;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    &:hover {
      transform: translateY(-4px);
      border-color: var(--hc-border-hover);
      box-shadow: var(--hc-shadow-hover);
    }

    &--biz:hover {
      border-color: color-mix(in srgb, #6366f1 40%, transparent);
      box-shadow: 0 12px 32px color-mix(in srgb, #6366f1 12%, transparent);
    }

    &--perf:hover {
      border-color: color-mix(in srgb, #0ea5e9 40%, transparent);
      box-shadow: 0 12px 32px color-mix(in srgb, #0ea5e9 12%, transparent);
    }

    &__title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    &__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--el-color-primary);
      box-shadow: 0 0 8px var(--el-color-primary);

      &--biz {
        background: #6366f1;
        box-shadow: 0 0 8px #6366f1;
      }
      &--perf {
        background: #0ea5e9;
        box-shadow: 0 0 8px #0ea5e9;
      }
    }

    &__list {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 13.5px;
      line-height: 1.7;
      color: var(--el-text-color-regular);

      li {
        margin-bottom: 10px;
        position: relative;

        &::marker {
          color: color-mix(in srgb, var(--el-text-color-regular) 50%, transparent);
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  /* ------------------- 底部提示 ------------------- */
  .hc-footnote {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 12px;
    margin-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    padding: 16px 20px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    border-radius: 14px;
    background: color-mix(in srgb, var(--el-text-color-primary) 2%, transparent);

    .art-svg-icon {
      flex-shrink: 0;
      margin-top: 2px;
      font-size: 18px;
      color: var(--el-color-info, #909399);
    }
  }
</style>
