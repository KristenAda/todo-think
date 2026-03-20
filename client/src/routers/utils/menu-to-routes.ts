/**
 * 菜单树 → Vue Router 路由对象转换器
 * 将后端返回的菜单树结构转换为前端 Vue Router 可用的路由配置
 */

const Layout = () => import('@/layouts/admin/AdminLayout.vue');

/**
 * 递归构建路由树
 * @param menuList 菜单列表（扁平或树形）
 * @param parentId 父菜单 ID（用于构建树形）
 * @returns 路由对象数组
 */
function buildRoutes(menuList: any[], parentId: number | null = null): any[] {
  const routes: any[] = [];

  for (const menu of menuList) {
    // 只处理当前层级的菜单
    if (menu.parentId !== parentId) continue;

    // 按钮（type=3）不生成路由
    if (menu.type === 3) continue;

    const route: any = {
      path: menu.path || '',
      name: menu.id ? `Menu_${menu.id}` : undefined,
      meta: {
        title: menu.title,
        icon: menu.icon,
        hidden: !menu.visible, // visible=false 时隐藏
        cache: menu.isCache, // 是否缓存
        isFrame: menu.isFrame, // 是否外链
      },
    };

    // 目录（type=1）或菜单（type=2）
    if (menu.type === 1) {
      // 目录：使用 Layout 包裹，children 为子菜单
      route.component = Layout;
      const children = buildRoutes(menuList, menu.id);
      if (children.length > 0) {
        route.children = children;
      }
    } else if (menu.type === 2) {
      // 菜单：动态导入组件
      if (menu.component) {
        // 组件路径：system/user/Index → @/views/system/user/Index.vue
        route.component = () =>
          import(`@/views/${menu.component}.vue`);
      }
    }

    routes.push(route);
  }

  return routes;
}

/**
 * 将菜单树转换为路由对象
 * @param menuTree 菜单树（后端 /sys/menu/tree 返回的结构）
 * @returns 路由对象数组
 */
export function menuToRoutes(menuTree: any[]): any[] {
  if (!Array.isArray(menuTree) || menuTree.length === 0) {
    return [];
  }

  // 如果菜单树已经是树形结构（有 children），需要先扁平化
  const flatMenuList = flattenMenuTree(menuTree);

  // 构建路由树（从顶级菜单开始，parentId=null）
  return buildRoutes(flatMenuList, null);
}

/**
 * 将树形菜单扁平化为数组
 * @param tree 树形菜单
 * @returns 扁平化的菜单数组
 */
function flattenMenuTree(tree: any[]): any[] {
  const result: any[] = [];

  function traverse(nodes: any[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children && Array.isArray(node.children)) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return result;
}
