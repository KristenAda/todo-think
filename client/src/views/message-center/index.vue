<!-- 消息中心 -->
<template>
  <div class="art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" :disabled="!hasUnread" @click="handleMarkAllRead" v-ripple>
              全部已读
            </ElButton>
            <ElTag v-if="hasUnread" type="danger" effect="light"> 未读 {{ unreadCount }} </ElTag>
            <ElTag v-else type="info" effect="light">暂无未读</ElTag>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { h, onMounted } from 'vue';
  import { ElButton, ElMessage, ElSpace, ElTag } from 'element-plus';
  import { useTable } from '@/hooks/core/useTable';
  import { fetchMessagePage } from '@/api/message';
  import { useMessageStore } from '@/store/modules/message';
  import { storeToRefs } from 'pinia';
  import { pushWorkbenchOpenTask } from '@/utils/navigation';
  import { formatDateTime } from '@/utils/date';
  import ArtTableRowActions from '@/components/core/forms/art-table-row-actions/index.vue';

  defineOptions({ name: 'MessageCenter' });

  const messageStore = useMessageStore();
  const { unreadCount, hasUnread } = storeToRefs(messageStore);
  const { columns, data, loading, pagination, refreshData, handleSizeChange, handleCurrentChange } =
    useTable({
      core: {
        apiFn: fetchMessagePage as any,
        paginationKey: { current: 'page', size: 'pageSize' },
        apiParams: {
          page: 1,
          pageSize: 20
        },
        immediate: true,
        columnsFactory: () => [
          {
            prop: 'title',
            label: '标题',
            minWidth: 180,
            showOverflowTooltip: true,
            render: ({ row }: any) => {
              const taskId = Number(row?.extra?.taskId);
              const title = row?.title ?? '新消息';

              // 若是任务通知，则标题可点击直达任务详情
              if (taskId && !Number.isNaN(taskId)) {
                return h(
                  ElButton,
                  {
                    type: 'primary',
                    link: true,
                    onClick: async () => {
                      if (!row?.isRead && row?.id) {
                        try {
                          await messageStore.markRead(row.id);
                          row.isRead = true;
                        } catch {
                          // ignore
                        }
                      }

                      await pushWorkbenchOpenTask(taskId);
                    }
                  },
                  () => title
                );
              }

              return title;
            }
          },
          {
            prop: 'content',
            label: '内容',
            minWidth: 320,
            showOverflowTooltip: true
          },
          {
            prop: 'sender',
            label: '发送者',
            width: 120,
            formatter: (row: any) => row?.sender?.nickName || row?.sender?.userName || '系统'
          },
          {
            prop: 'createTime',
            label: '时间',
            width: 170,
            formatter: (row: any) => (row?.createTime ? formatDateTime(row.createTime) : '')
          },
          {
            prop: 'isRead',
            label: '状态',
            width: 100,
            formatter: (row: any) => (row?.isRead ? '已读' : '未读')
          },
          {
            prop: '__actions__',
            label: '操作',
            width: 188,
            align: 'center',
            render: ({ row }: any) => {
              const taskId = Number(row?.extra?.taskId);

              const items = [
                {
                  key: 'markRead',
                  label: '标记已读',
                  disabled: Boolean(row?.isRead),
                  onClick: async () => {
                    if (!row?.id) return;
                    try {
                      await messageStore.markRead(row.id);
                      row.isRead = true;
                    } catch {
                      // 失败提示由 request 统一处理，这里避免重复弹窗
                    }
                  }
                }
              ];

              if (taskId && !Number.isNaN(taskId)) {
                items.push({
                  key: 'viewTask',
                  label: '查看任务',
                  disabled: false,
                  onClick: async () => {
                    if (!row?.isRead && row?.id) {
                      try {
                        await messageStore.markRead(row.id);
                        row.isRead = true;
                      } catch {
                        // 忽略
                      }
                    }
                    await pushWorkbenchOpenTask(taskId);
                  }
                });
              }

              return h(ArtTableRowActions, { items });
            }
          }
        ]
      }
    });

  const handleMarkAllRead = async () => {
    try {
      await messageStore.markAllRead();
      ElMessage.success('已全部标记已读');
      await refreshData();
    } catch {
      // 失败提示由 request 统一处理，这里避免重复弹窗
    }
  };

  onMounted(() => {
    messageStore.refreshUnreadCount();
  });
</script>
