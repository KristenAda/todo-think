<!-- 用户管理页面 -->
<template>
  <div class="user-page art-full-height">
    <!-- 搜索栏 -->
    <UserSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams"></UserSearch>

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>新增用户</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>

      <!-- 用户弹窗 -->
      <UserDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :user-data="currentUserData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtTableRowActions from '@/components/core/forms/art-table-row-actions/index.vue';
  import { useTable } from '@/hooks/core/useTable';
  import { fetchGetUserList, fetchDeleteUser } from '@/api/system-manage';
  import UserSearch from './modules/user-search.vue';
  import UserDialog from './modules/user-dialog.vue';
  import { ElTag, ElMessageBox, ElImage } from 'element-plus';
  import { DialogType } from '@/types';
  import { resolveComponent } from 'vue';
  import { formatDateTime } from '@/utils/date';

  defineOptions({ name: 'User' });

  type UserListItem = Api.SystemManage.UserListItem;

  // 弹窗相关
  const dialogType = ref<DialogType>('add');
  const dialogVisible = ref(false);
  const currentUserData = ref<Partial<UserListItem>>({});

  // 选中行
  const selectedRows = ref<UserListItem[]>([]);

  // 搜索表单
  const searchForm = ref({
    userName: undefined,
    userGender: undefined,
    userPhone: undefined,
    userEmail: undefined,
    status: undefined
  });

  // 用户状态配置
  const USER_STATUS_CONFIG = {
    '1': { type: 'success' as const, text: '在线' },
    '2': { type: 'info' as const, text: '离线' },
    '3': { type: 'warning' as const, text: '异常' },
    '4': { type: 'danger' as const, text: '注销' }
  } as const;

  /**
   * 获取用户状态配置
   */
  const getUserStatusConfig = (status: string) => {
    return (
      USER_STATUS_CONFIG[status as keyof typeof USER_STATUS_CONFIG] || {
        type: 'info' as const,
        text: '未知'
      }
    );
  };

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
      apiFn: fetchGetUserList,
      apiParams: {
        current: 1,
        size: 20
      },
      columnsFactory: () => [
        { type: 'selection', width: 48 },
        { type: 'index', width: 60, label: '序号' },
        {
          prop: 'userInfo',
          label: '用户',
          minWidth: 200,
          formatter: (row) => {
            const ColorAvatar = resolveComponent('ColorAvatar');
            const nick = row.nickName?.trim();
            const displayName = nick || row.userName;
            const showAccountTag = !!nick;
            const email = row.userEmail?.trim();

            return h('div', { class: 'user-cell' }, [
              h(
                'div',
                { class: 'user-cell__avatar' },
                row.avatar
                  ? h(ElImage, {
                      class: 'user-cell__avatar-img size-9.5 rounded-full',
                      src: row.avatar,
                      previewSrcList: [row.avatar],
                      previewTeleported: true,
                      fit: 'cover'
                    })
                  : h(
                      'div',
                      {
                        class: 'user-cell__avatar-fallback size-9.5 rounded-full overflow-hidden'
                      },
                      [
                        h(ColorAvatar, {
                          name: nick || row.userName || '?',
                          gender: row.userGender || '',
                          size: 38
                        })
                      ]
                    )
              ),
              h('div', { class: 'user-cell__main' }, [
                h('div', { class: 'user-cell__title-row' }, [
                  h('span', { class: 'user-cell__name' }, displayName),
                  showAccountTag ? h('span', { class: 'user-cell__tag' }, row.userName) : null
                ]),
                ...(email ? [h('div', { class: 'user-cell__email' }, email)] : [])
              ])
            ]);
          }
        },
        {
          prop: 'userGender',
          label: '性别',
          width: 84,
          align: 'center',
          sortable: true,
          formatter: (row) => row.userGender
        },
        { prop: 'userPhone', label: '手机号', width: 130, showOverflowTooltip: true },
        {
          prop: 'status',
          label: '状态',
          width: 92,
          align: 'center',
          formatter: (row) => {
            const statusConfig = getUserStatusConfig(row.status);
            return h(ElTag, { type: statusConfig.type }, () => statusConfig.text);
          }
        },
        {
          prop: 'createTime',
          label: '创建日期',
          width: 172,
          sortable: true,
          formatter: (row: UserListItem) => (row.createTime ? formatDateTime(row.createTime) : '')
        },
        {
          prop: 'operation',
          label: '操作',
          width: 132,
          align: 'center',
          fixed: 'right',
          formatter: (row) =>
            h(ArtTableRowActions, {
              items: [
                { key: 'edit', label: '编辑', onClick: () => showDialog('edit', row) },
                { key: 'delete', label: '删除', danger: true, onClick: () => deleteUser(row) }
              ]
            })
        }
      ]
    }
  });

  /**
   * 搜索处理
   */
  const handleSearch = (params: Record<string, any>) => {
    Object.assign(searchParams, params);
    getData();
  };

  /**
   * 显示用户弹窗
   */
  const showDialog = (type: DialogType, row?: UserListItem): void => {
    dialogType.value = type;
    currentUserData.value = row || {};
    nextTick(() => {
      dialogVisible.value = false;
      nextTick(() => {
        dialogVisible.value = true;
      });
    });
  };

  /**
   * 删除用户
   */
  const deleteUser = async (row: UserListItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(
        `确定要删除用户"${row.userName}"吗？此操作不可恢复！`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );

      await fetchDeleteUser(row.id);
      ElMessage.success('删除成功');
      refreshData();
    } catch (error) {
      if (error !== 'cancel') {
        // 失败提示由 request 统一处理，这里避免重复弹窗
      }
    }
  };

  /**
   * 处理弹窗提交事件
   */
  const handleDialogSubmit = async () => {
    try {
      dialogVisible.value = false;
      currentUserData.value = {};
      refreshData();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: UserListItem[]): void => {
    selectedRows.value = selection;
  };
</script>

<style lang="scss">
  /* 用户列不用 scoped：formatter 里 h() 在表格内部渲染，样式挂在 .user-page 下 */
  .user-page {
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .user-cell__avatar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-cell__avatar-img {
      display: block;
      flex-shrink: 0;
    }

    .user-cell__avatar-fallback {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
    }

    .user-cell__main {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      min-width: 0;
      flex: 1 1 0;
      line-height: 1.2;
    }

    .user-cell__title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      max-width: 100%;
    }

    .user-cell__name {
      flex: 0 1 auto;
      min-width: 0;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.2;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-cell__tag {
      flex-shrink: 0;
      box-sizing: border-box;
      padding: 2px 8px;
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
        monospace;
      font-size: 12px;
      font-weight: 400;
      line-height: 1.2;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
      border-radius: 4px;
      white-space: nowrap;
    }

    .user-cell__email {
      margin: 0;
      padding: 0;
      font-size: 12px;
      font-weight: 400;
      line-height: 1.2;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
  }
</style>
