# 权限指令 v-permission

用于控制元素的显示/隐藏/禁用，基于用户权限。

## 使用方式

### 1. 字符串格式（单个权限）

```vue
<el-button v-permission="'sys:user:add'">新增用户</el-button>
```

### 2. 数组格式（多个权限，OR 逻辑）

```vue
<!-- 用户有 sys:user:add 或 sys:user:edit 权限时显示 -->
<el-button v-permission="['sys:user:add', 'sys:user:edit']">操作</el-button>
```

### 3. 对象格式（指定模式）

```vue
<!-- 指定模式为 'hide'（隐藏而非移除） -->
<el-button v-permission="{ value: ['sys:user:add'], mode: 'hide' }">新增</el-button>

<!-- 指定模式为 'disable'（禁用按钮） -->
<el-button v-permission="{ value: ['sys:user:delete'], mode: 'disable' }">删除</el-button>
```

## 模式说明

| 模式 | 说明 | 场景 | 效果 |
|------|------|------|------|
| `remove` | 无权限时从 DOM 移除（**默认**） | 按钮、菜单项 | 元素完全不存在 |
| `hide` | 无权限时隐藏（`display:none`） | 需保留 DOM 结构 | 元素隐藏但占位 |
| `disable` | 无权限时禁用 | 按钮提示用户 | 按钮灰显 + title 提示 |

## 实际示例

### 用户管理页面

```vue
<template>
  <div class="user-management">
    <!-- 新增按钮：无权限时移除 -->
    <el-button v-permission="'sys:user:add'" type="primary">新增用户</el-button>

    <!-- 编辑按钮：无权限时禁用 -->
    <el-button v-permission="{ value: 'sys:user:edit', mode: 'disable' }">
      编辑
    </el-button>

    <!-- 删除按钮：无权限时隐藏 -->
    <el-button v-permission="{ value: 'sys:user:delete', mode: 'hide' }" type="danger">
      删除
    </el-button>

    <!-- 表格操作列 -->
    <el-table-column label="操作">
      <template #default="{ row }">
        <el-button v-permission="'sys:user:edit'" link type="primary">编辑</el-button>
        <el-button v-permission="'sys:user:delete'" link type="danger">删除</el-button>
      </template>
    </el-table-column>
  </div>
</template>
```

### 菜单权限控制

```vue
<template>
  <!-- 仅管理员可见的菜单项 -->
  <el-menu-item v-permission="'sys:admin:manage'">
    <span>系统管理</span>
  </el-menu-item>

  <!-- 多权限 OR 逻辑 -->
  <el-menu-item v-permission="['sys:user:view', 'sys:user:edit']">
    <span>用户管理</span>
  </el-menu-item>
</template>
```

## 权限标识规范

权限标识采用 `模块:资源:操作` 的格式：

```
sys:user:add      # 系统模块 - 用户资源 - 新增操作
sys:user:edit     # 系统模块 - 用户资源 - 编辑操作
sys:user:delete   # 系统模块 - 用户资源 - 删除操作
sys:role:manage   # 系统模块 - 角色资源 - 管理操作
*                 # 超级管理员（拥有所有权限）
```

## 权限检查逻辑

- **数组权限**：采用 **OR 逻辑**，只要用户拥有其中一个权限就显示
- **超级管理员**：权限列表包含 `*` 时，自动通过所有权限检查
- **权限更新**：指令支持动态权限变更，权限改变时自动重新检查

## 常见问题

### Q: 如何同时检查多个权限（AND 逻辑）？

A: 目前指令支持 OR 逻辑。如需 AND 逻辑，可在组件中使用 `hasPermission()` 方法：

```vue
<script setup>
import { useAuthorityStore } from '@/stores/authority';

const authorityStore = useAuthorityStore();

const canManage = computed(() =>
  authorityStore.hasPermission('sys:user:add') &&
  authorityStore.hasPermission('sys:user:delete')
);
</script>

<template>
  <el-button v-if="canManage">批量操作</el-button>
</template>
```

### Q: disable 模式对非按钮元素有效吗？

A: 不完全有效。disable 模式主要针对按钮类元素（`<button>`、`.el-button`）。对其他元素会自动降级为 `hide` 模式。

### Q: 如何在 JavaScript 中检查权限？

A: 使用 `authorityStore.hasPermission()` 方法：

```javascript
import { useAuthorityStore } from '@/stores/authority';

const authorityStore = useAuthorityStore();

if (authorityStore.hasPermission('sys:user:add')) {
  // 用户有权限
}
```

## 性能建议

- **remove 模式**：适合权限固定的场景，减少 DOM 节点
- **hide 模式**：适合权限可能动态变更的场景，保留 DOM 结构
- **disable 模式**：适合需要给用户反馈的场景（如灰显按钮 + 提示）

## 与后端权限的关系

- 指令检查的是**前端按钮级权限**（`permissions` 数组）
- 后端接口仍需进行**独立的权限校验**
- 指令仅用于 UI 层面的权限控制，不能替代后端鉴权
