<!-- 角色管理页面 -->
<template>
  <div class="art-full-height">
    <RoleSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    ></RoleSearch>

    <ElCard
      class="art-table-card"
      shadow="never"
      :style="{ 'margin-top': showSearchBar ? '12px' : '0' }"
    >
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>新增角色</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>

    <!-- 角色编辑弹窗 -->
    <RoleEditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :role-data="currentRoleData"
      @success="refreshData"
    />

    <!-- 菜单权限弹窗 -->
    <RolePermissionDialog
      v-model="permissionDialog"
      :role-data="currentRoleData"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable';
  import { fetchGetRoleList, fetchDeleteRole } from '@/api/system-manage';
  import ArtTableRowActions from '@/components/core/forms/art-table-row-actions/index.vue';
  import RoleSearch from './modules/role-search.vue';
  import RoleEditDialog from './modules/role-edit-dialog.vue';
  import RolePermissionDialog from './modules/role-permission-dialog.vue';
  import { ElTag, ElMessageBox } from 'element-plus';
  import { formatDateTime } from '@/utils/date';

  defineOptions({ name: 'Role' });

  type RoleListItem = Api.SystemManage.RoleListItem;

  // 搜索表单
  const searchForm = ref({
    roleName: undefined,
    roleCode: undefined,
    description: undefined,
    enabled: undefined,
    daterange: undefined
  });

  const showSearchBar = ref(false);

  const dialogVisible = ref(false);
  const permissionDialog = ref(false);
  const currentRoleData = ref<RoleListItem | undefined>(undefined);

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    // 核心配置
    core: {
      apiFn: fetchGetRoleList,
      apiParams: {
        current: 1,
        size: 20
      },
      excludeParams: ['daterange'],
      columnsFactory: () => [
        { type: 'globalIndex', width: 60, label: '序号' },
        {
          prop: 'roleName',
          label: '角色名称',
          minWidth: 120
        },
        {
          prop: 'roleCode',
          label: '角色编码',
          minWidth: 120
        },
        {
          prop: 'description',
          label: '角色描述',
          minWidth: 150,
          showOverflowTooltip: true
        },
        {
          prop: 'isDefaultRole',
          label: '角色类型',
          width: 96,
          formatter: (row) =>
            row.isDefaultRole
              ? h(ElTag, { type: 'info', size: 'small' }, () => '默认角色')
              : h('span', { class: 'text-muted' }, '—')
        },
        {
          prop: 'enabled',
          label: '角色状态',
          width: 100,
          formatter: (row) => {
            const statusConfig = row.enabled
              ? { type: 'success', text: '启用' }
              : { type: 'warning', text: '禁用' };
            return h(
              ElTag,
              { type: statusConfig.type as 'success' | 'warning' },
              () => statusConfig.text
            );
          }
        },
        {
          prop: 'createTime',
          label: '创建日期',
          width: 185,
          sortable: true,
          formatter: (row: RoleListItem) => (row.createTime ? formatDateTime(row.createTime) : '')
        },
        {
          prop: 'operation',
          label: '操作',
          width: 220,
          align: 'center',
          fixed: 'right',
          formatter: (row) =>
            h(ArtTableRowActions, {
              items: [
                { key: 'permission', label: '菜单权限', onClick: () => showPermissionDialog(row) },
                { key: 'edit', label: '编辑', onClick: () => showDialog('edit', row) },
                { key: 'delete', label: '删除', danger: true, onClick: () => deleteRole(row) }
              ]
            })
        }
      ]
    }
  });

  const dialogType = ref<'add' | 'edit'>('add');

  const showDialog = (type: 'add' | 'edit', row?: RoleListItem) => {
    dialogVisible.value = false;
    nextTick(() => {
      dialogVisible.value = true;
    });
    dialogType.value = type;
    currentRoleData.value = row;
  };

  /**
   * 搜索处理
   */
  const handleSearch = (params: Record<string, any>) => {
    const { daterange, ...filtersParams } = params;
    const [startTime, endTime] = Array.isArray(daterange) ? daterange : [null, null];

    Object.assign(searchParams, { ...filtersParams, startTime, endTime });
    getData();
  };

  const showPermissionDialog = (row?: RoleListItem) => {
    permissionDialog.value = true;
    currentRoleData.value = row;
  };

  const deleteRole = async (row: RoleListItem) => {
    try {
      await ElMessageBox.confirm(`确定删除角色"${row.roleName}"吗？此操作不可恢复！`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      await fetchDeleteRole(row.roleId);
      ElMessage.success('删除成功');
      refreshData();
    } catch (error) {
      if (error !== 'cancel') {
        // 失败提示由 request 统一处理，这里避免重复弹窗
      }
    }
  };
</script>
