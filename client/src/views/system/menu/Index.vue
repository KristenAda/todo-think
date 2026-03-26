<!-- 菜单管理页面 -->
<template>
  <div class="menu-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="formFilters"
      :items="formItems"
      :showExpand="false"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader
        :showZebra="false"
        :loading="loading"
        v-model:columns="columnChecks"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElButton v-auth="'add'" @click="handleAddMenu" v-ripple> 添加菜单 </ElButton>
          <ElButton @click="toggleExpand" v-ripple>
            {{ isExpanded ? '收起' : '展开' }}
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        ref="tableRef"
        rowKey="id"
        :loading="loading"
        :columns="columns"
        :data="filteredTableData"
        :stripe="false"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
      />

      <!-- 菜单弹窗 -->
      <MenuDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :editData="editData"
        :lockType="lockMenuType"
        @submit="handleSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue';
  import { useTableColumns } from '@/hooks/core/useTableColumns';
  import MenuDialog from './modules/menu-dialog.vue';
  import {
    fetchGetMenuList,
    fetchDeleteMenu,
    fetchAddMenu,
    fetchUpdateMenu
  } from '@/api/system-manage';
  import { ElTag, ElMessageBox } from 'element-plus';

  defineOptions({ name: 'Menus' });

  // 状态管理
  const loading = ref(false);
  const isExpanded = ref(false);
  const tableRef = ref();

  // 弹窗相关
  const dialogVisible = ref(false);
  const dialogType = ref<'menu' | 'button'>('menu');
  const editData = ref<Api.SystemManage.MenuItem | any>(null);
  const lockMenuType = ref(false);

  // 搜索相关
  const initialSearchState = {
    name: '',
    route: ''
  };

  const formFilters = reactive({ ...initialSearchState });
  const appliedFilters = reactive({ ...initialSearchState });

  const formItems = computed(() => [
    {
      label: '菜单名称',
      key: 'name',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: '路由地址',
      key: 'route',
      type: 'input',
      props: { clearable: true }
    }
  ]);

  onMounted(() => {
    getMenuList();
  });

  const tableData = ref<Api.SystemManage.MenuItem[]>([]);

  /**
   * 获取菜单列表数据
   */
  const getMenuList = async (): Promise<void> => {
    loading.value = true;

    try {
      const res = await fetchGetMenuList();
      // request.get 已经解包了 BaseResponse，直接返回 data 字段（树数组）
      if (Array.isArray(res)) {
        tableData.value = res;
      } else if (res && (res as any).data) {
        tableData.value = (res as any).data;
      } else {
        tableData.value = [];
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('获取菜单失败');
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取菜单类型标签颜色
   */
  const getMenuTypeTag = (
    row: Api.SystemManage.MenuItem
  ): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    if (row.meta?.isEnable === false) return 'warning';
    if (row.children?.length) return 'info';
    if (row.meta?.link && row.meta?.isIframe) return 'success';
    if (row.path) return 'primary';
    if (row.meta?.link) return 'warning';
    return 'info';
  };

  /**
   * 获取菜单类型文本
   */
  const getMenuTypeText = (row: Api.SystemManage.MenuItem): string => {
    if (row.children?.length) return '目录';
    if (row.meta?.link && row.meta?.isIframe) return '内嵌';
    if (row.path) return '菜单';
    if (row.meta?.link) return '外链';
    return '菜单';
  };

  // 表格列配置
  const { columnChecks, columns } = useTableColumns(() => [
    {
      prop: 'meta.title',
      label: '菜单名称',
      minWidth: 120,
      formatter: (row: Api.SystemManage.MenuItem) => row.meta?.title || row.name
    },
    {
      prop: 'type',
      label: '菜单类型',
      formatter: (row: Api.SystemManage.MenuItem) => {
        return h(ElTag, { type: getMenuTypeTag(row) }, () => getMenuTypeText(row));
      }
    },
    {
      prop: 'path',
      label: '路由',
      formatter: (row: Api.SystemManage.MenuItem) => {
        return row.meta?.link || row.path || '';
      }
    },
    {
      prop: 'meta.authList',
      label: '权限标识',
      formatter: (row: Api.SystemManage.MenuItem) => {
        if (!row.meta?.authList?.length) return '';
        return `${row.meta.authList.length} 个权限标识`;
      }
    },
    {
      prop: 'createTime',
      label: '编辑时间',
      formatter: () => new Date().toLocaleString()
    },
    {
      prop: 'status',
      label: '状态',
      formatter: (row: Api.SystemManage.MenuItem) => {
        const statusText = row.meta?.isEnable ? '启用' : '禁用';
        const statusType = row.meta?.isEnable ? 'success' : 'warning';
        return h(ElTag, { type: statusType }, () => statusText);
      }
    },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      align: 'right',
      formatter: (row: Api.SystemManage.MenuItem) => {
        const buttonStyle = { style: 'text-align: right' };

        return h('div', buttonStyle, [
          h(ArtButtonTable, {
            type: 'edit',
            onClick: () => handleEditMenu(row)
          }),
          h(ArtButtonTable, {
            type: 'delete',
            onClick: () => handleDeleteMenu(row)
          })
        ]);
      }
    }
  ]);

  /**
   * 重置搜索条件
   */
  const handleReset = (): void => {
    Object.assign(formFilters, { ...initialSearchState });
    Object.assign(appliedFilters, { ...initialSearchState });
    getMenuList();
  };

  /**
   * 执行搜索
   */
  const handleSearch = (): void => {
    Object.assign(appliedFilters, { ...formFilters });
    getMenuList();
  };

  /**
   * 刷新菜单列表
   */
  const handleRefresh = (): void => {
    getMenuList();
  };

  /**
   * 深度克隆对象
   */
  const deepClone = <T,>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj) as T;
    if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as T;

    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  };

  /**
   * 搜索菜单
   */
  const searchMenu = (items: Api.SystemManage.MenuItem[]): Api.SystemManage.MenuItem[] => {
    const results: Api.SystemManage.MenuItem[] = [];

    for (const item of items) {
      const searchName = appliedFilters.name?.toLowerCase().trim() || '';
      const searchRoute = appliedFilters.route?.toLowerCase().trim() || '';
      const menuTitle = (item.meta?.title || '').toLowerCase();
      const menuPath = (item.path || '').toLowerCase();
      const nameMatch = !searchName || menuTitle.includes(searchName);
      const routeMatch = !searchRoute || menuPath.includes(searchRoute);

      if (item.children?.length) {
        const matchedChildren = searchMenu(item.children);
        if (matchedChildren.length > 0) {
          const clonedItem = deepClone(item);
          clonedItem.children = matchedChildren;
          results.push(clonedItem);
          continue;
        }
      }

      if (nameMatch && routeMatch) {
        results.push(deepClone(item));
      }
    }

    return results;
  };

  // 过滤后的表格数据
  const filteredTableData = computed(() => {
    return searchMenu(tableData.value);
  });

  /**
   * 添加菜单
   */
  const handleAddMenu = (): void => {
    dialogType.value = 'menu';
    editData.value = null;
    lockMenuType.value = true;
    dialogVisible.value = false;
    nextTick(() => { dialogVisible.value = true; });
  };

  /**
   * 编辑菜单
   */
  const handleEditMenu = (row: Api.SystemManage.MenuItem): void => {
    dialogType.value = 'menu';
    editData.value = row;
    lockMenuType.value = true;
    dialogVisible.value = false;
    nextTick(() => { dialogVisible.value = true; });
  };

  /**
   * 删除菜单
   */
  const handleDeleteMenu = async (row: Api.SystemManage.MenuItem): Promise<void> => {
    try {
      await ElMessageBox.confirm('确定要删除该菜单吗？删除后无法恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      await fetchDeleteMenu(row.id);
      ElMessage.success('删除成功');
      getMenuList();
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败');
      }
    }
  };

  /**
   * 提交表单数据
   */
  const handleSubmit = (_formData: any): void => {
    // 菜单对话框内部已调用 API，这里只需刷新列表
    getMenuList();
  };

  /**
   * 切换展开/收起所有菜单
   */
  const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value;
    nextTick(() => {
      if (tableRef.value?.elTableRef && filteredTableData.value) {
        const processRows = (rows: Api.SystemManage.MenuItem[]) => {
          rows.forEach((row) => {
            if (row.children?.length) {
              tableRef.value.elTableRef.toggleRowExpansion(row, isExpanded.value);
              processRows(row.children);
            }
          });
        };
        processRows(filteredTableData.value);
      }
    });
  };
</script>
