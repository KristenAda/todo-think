/**
 * 组件加载器
 *
 * 负责动态加载 Vue 组件
 *
 * @module router/core/ComponentLoader
 * @author Art Design Pro Team
 */

import { h } from 'vue';

/** 已从仓库移除的视图：菜单库若仍指向旧 component，统一落到现有页，避免动态路由注册报错 */
const REMOVED_VIEW_COMPONENT_TARGETS: ReadonlyArray<{ match: (normalized: string) => boolean; target: string }> = [
  {
    match: (n) =>
      n === '/dashboard/analysis' ||
      n === '/dashboard/analysis/index' ||
      n.startsWith('/dashboard/analysis/'),
    target: '/dashboard/console'
  },
  {
    match: (n) =>
      n === '/dashboard/ecommerce' ||
      n === '/dashboard/ecommerce/index' ||
      n.startsWith('/dashboard/ecommerce/'),
    target: '/dashboard/console'
  }
];

function normalizeComponentPathForAlias(componentPath: string): string {
  const trimmed = componentPath.trim().replace(/\\/g, '/');
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+/g, '/');
}

function resolveRemovedViewAlias(componentPath: string): string | null {
  const normalized = normalizeComponentPathForAlias(componentPath);
  for (const { match, target } of REMOVED_VIEW_COMPONENT_TARGETS) {
    if (match(normalized.toLowerCase())) {
      return target;
    }
  }
  return null;
}

export class ComponentLoader {
  private modules: Record<string, () => Promise<any>>;

  constructor() {
    // 动态导入 views 目录下所有 .vue 组件
    this.modules = import.meta.glob('../../views/**/*.vue');
  }

  /**
   * 加载组件 (支持忽略大小写匹配)
   */
  load(componentPath: string): () => Promise<any> {
    if (!componentPath) {
      return this.createEmptyComponent();
    }

    const aliased = resolveRemovedViewAlias(componentPath);
    if (aliased) {
      return this.load(aliased);
    }

    // 1. 确保路径前缀格式正确 (之前修复的防漏斜杠逻辑)
    const safePath = componentPath.startsWith('/') ? componentPath : `/${componentPath}`;

    // 2. 构建预期的标准路径
    const expectedPath = `../../views${safePath}.vue`;
    const expectedPathWithIndex = `../../views${safePath}/index.vue`;

    // 3. 【核心修复】全部转为小写，准备进行忽略大小写的查找
    const expectedPathLower = expectedPath.toLowerCase();
    const expectedPathWithIndexLower = expectedPathWithIndex.toLowerCase();

    // 4. 遍历 vite glob 扫描到的所有真实物理文件路径
    const moduleKeys = Object.keys(this.modules);

    // 寻找真实路径全小写后，与我们预期路径全小写相等的那个 key
    const actualKey = moduleKeys.find((key) => {
      const keyLower = key.toLowerCase();
      return keyLower === expectedPathLower || keyLower === expectedPathWithIndexLower;
    });

    // 5. 使用真实匹配到的 key 去获取模块
    const module = actualKey ? this.modules[actualKey] : undefined;

    if (!module) {
      console.error(
        `[ComponentLoader] 未找到组件: ${componentPath}\n` +
          `预期匹配(忽略大小写): ${expectedPathLower} 或 ${expectedPathWithIndexLower}\n` +
          `请检查 views 目录下是否存在该文件。`
      );
      return this.createErrorComponent(componentPath);
    }

    return module;
  }

  /**
   * 预取视图 chunk（悬停菜单等场景，减轻首次点击时的白屏/等待）
   */
  prefetch(componentPath: string): void {
    const loader = this.load(componentPath);
    void loader().catch(() => {});
  }

  /**
   * 加载布局组件
   */
  loadLayout(): () => Promise<any> {
    return () => import('@/views/index/index.vue');
  }

  /**
   * 加载 iframe 组件
   */
  loadIframe(): () => Promise<any> {
    return () => import('@/views/outside/Iframe.vue');
  }

  /**
   * 创建空组件
   */
  private createEmptyComponent(): () => Promise<any> {
    return () =>
      Promise.resolve({
        render() {
          return h('div', {});
        }
      });
  }

  /**
   * 创建错误提示组件
   */
  private createErrorComponent(componentPath: string): () => Promise<any> {
    return () =>
      Promise.resolve({
        render() {
          return h('div', { class: 'route-error' }, `组件未找到: ${componentPath}`);
        }
      });
  }
}

/** 与动态路由注册共用同一套 glob，保证预取与点击加载为同一模块实例 */
export const componentLoader = new ComponentLoader();
