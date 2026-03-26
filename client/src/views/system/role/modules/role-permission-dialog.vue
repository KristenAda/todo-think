<template>
  <ArtDialog
    v-model="visible"
    title="菜单权限"
    icon="solar:shield-check-bold-duotone"
    width="520px"
    @close="handleClose"
  >
    <ElScrollbar height="70vh">
      <ElTree
        ref="treeRef"
        :data="processedMenuList"
        show-checkbox
        node-key="id"
        :default-expand-all="isExpandAll"
        :props="defaultProps"
        @check="handleTreeCheck"
      >
        <template #default="{ data }">
          <div style="display: flex; align-items: center">
            <span>{{ data.label }}</span>
          </div>
        </template>
      </ElTree>
    </ElScrollbar>
    <template #footer>
      <ElButton @click="toggleExpandAll">{{ isExpandAll ? '全部收起' : '全部展开' }}</ElButton>
      <ElButton @click="toggleSelectAll" style="margin-left: 8px">{{
        isSelectAll ? '取消全选' : '全部选择'
      }}</ElButton>
      <ElButton type="primary" @click="savePermission" :loading="loading">保存</ElButton>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { fetchGetMenuList, fetchAssignRoleMenus, fetchGetRoleMenus } from '@/api/system-manage';

  type RoleListItem = Api.SystemManage.RoleListItem;

  interface Props {
    modelValue: boolean;
    roleData?: RoleListItem;
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    roleData: undefined
  });

  const emit = defineEmits<Emits>();

  const treeRef = ref();
  const isExpandAll = ref(true);
  const isSelectAll = ref(false);
  const loading = ref(false);
  const menuList = ref<Api.SystemManage.MenuItem[]>([]);

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });

  interface MenuNode {
    id: number;
    label: string;
    children?: MenuNode[];
  }

  const processedMenuList = computed(() => {
    return menuList.value.map((menu) => ({
      id: menu.id,
      label: menu.meta?.title || menu.name,
      children: menu.children?.map((child) => ({
        id: child.id,
        label: child.meta?.title || child.name,
        children: child.children?.map((grandchild) => ({
          id: grandchild.id,
          label: grandchild.meta?.title || grandchild.name
        }))
      }))
    }));
  });

  const defaultProps = {
    children: 'children',
    label: 'label'
  };

  const loadMenuList = async () => {
    try {
      const res = await fetchGetMenuList();
      // request.get 已经解包了 BaseResponse，直接返回 data 字段（树数组）
      if (Array.isArray(res)) {
        menuList.value = res;
      } else if (res && (res as any).data) {
        menuList.value = (res as any).data;
      }
    } catch (error) {
      console.error('加载菜单列表失败:', error);
    }
  };

  watch(
    () => props.modelValue,
    async (newVal) => {
      if (newVal) {
        await loadMenuList();
        // 加载该角色已分配的菜单权限并回显
        if (props.roleData?.roleId) {
          try {
            const checkedIds = (await fetchGetRoleMenus(
              props.roleData.roleId
            )) as unknown as number[];
            if (Array.isArray(checkedIds)) {
              nextTick(() => {
                // 只设置叶子节点为选中，父节点会自动变为半选状态
                // 避免设置父节点导致所有子节点被强制全选
                const leafIds = checkedIds.filter((id) => {
                  const node = treeRef.value?.getNode(id);
                  return node && node.isLeaf;
                });
                treeRef.value?.setCheckedKeys(leafIds);
              });
            }
          } catch (error) {
            console.error('加载角色菜单权限失败:', error);
          }
        }
      }
    }
  );

  const handleClose = () => {
    visible.value = false;
    treeRef.value?.setCheckedKeys([]);
  };

  const savePermission = async () => {
    if (!props.roleData) return;

    try {
      loading.value = true;
      // getCheckedKeys 只包含完全选中的节点
      // getHalfCheckedKeys 包含半选（子节点部分选中）的父级节点
      // 两者合并才能正确保存父目录
      const checkedKeys = treeRef.value?.getCheckedKeys() || [];
      const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() || [];
      const allKeys = [...checkedKeys, ...halfCheckedKeys] as number[];
      await fetchAssignRoleMenus(props.roleData.roleId, allKeys);
      ElMessage.success('权限保存成功');
      emit('success');
      handleClose();
    } catch (error) {
      console.error('保存权限失败:', error);
      ElMessage.error('保存权限失败，请重试');
    } finally {
      loading.value = false;
    }
  };

  const toggleExpandAll = () => {
    const tree = treeRef.value;
    if (!tree) return;

    const nodes = tree.store.nodesMap;
    Object.values(nodes).forEach((node: any) => {
      node.expanded = !isExpandAll.value;
    });

    isExpandAll.value = !isExpandAll.value;
  };

  const toggleSelectAll = () => {
    const tree = treeRef.value;
    if (!tree) return;

    if (!isSelectAll.value) {
      const allKeys = getAllNodeKeys(processedMenuList.value);
      tree.setCheckedKeys(allKeys);
    } else {
      tree.setCheckedKeys([]);
    }

    isSelectAll.value = !isSelectAll.value;
  };

  const getAllNodeKeys = (nodes: MenuNode[]): number[] => {
    const keys: number[] = [];
    const traverse = (nodeList: MenuNode[]): void => {
      nodeList.forEach((node) => {
        keys.push(node.id);
        if (node.children?.length) traverse(node.children);
      });
    };
    traverse(nodes);
    return keys;
  };

  const handleTreeCheck = () => {
    const tree = treeRef.value;
    if (!tree) return;

    const checkedKeys = tree.getCheckedKeys();
    const allKeys = getAllNodeKeys(processedMenuList.value);

    isSelectAll.value = checkedKeys.length === allKeys.length && allKeys.length > 0;
  };
</script>
