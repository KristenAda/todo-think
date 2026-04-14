<!-- 附件管理 -->
<template>
  <div class="art-full-height">
    <AttachmentSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    />

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
            <ElUpload
              :show-file-list="false"
              :disabled="uploading"
              :http-request="handleUpload"
              accept="*"
            >
              <ElButton type="primary" :loading="uploading" v-ripple>上传文件</ElButton>
            </ElUpload>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ElProgress v-if="uploading" :percentage="progressPercent" style="margin-bottom: 12px" />

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
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue';
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue';
  import { useTable } from '@/hooks/core/useTable';
  import {
    fetchAttachmentPage,
    fetchAttachmentDelete,
    downloadAttachmentBlob,
    type AttachmentItem
  } from '@/api/attachment';
  import { useChunkUpload } from '@/composables/useChunkUpload';
  import AttachmentSearch from './modules/attachment-search.vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import type { UploadRequestOptions } from 'element-plus';
  import { h } from 'vue';

  defineOptions({ name: 'SystemAttachment' });

  const showSearchBar = ref(false);
  const { uploading, progressPercent, errorMessage, upload } = useChunkUpload();

  const searchForm = ref({
    keyword: undefined as string | undefined
  });

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
    core: {
      apiFn: fetchAttachmentPage,
      paginationKey: { current: 'page', size: 'pageSize' },
      apiParams: {
        page: 1,
        pageSize: 20,
        keyword: undefined as string | undefined
      },
      columnsFactory: () => [
        { type: 'globalIndex', width: 60, label: '序号' },
        {
          prop: 'originalName',
          label: '文件名',
          minWidth: 180,
          showOverflowTooltip: true
        },
        {
          prop: 'size',
          label: '大小',
          width: 100,
          formatter: (row: AttachmentItem) => formatSize(row.size)
        },
        {
          prop: 'uploadedBy',
          label: '上传人',
          width: 120,
          formatter: (row: AttachmentItem) =>
            row.uploadedBy?.nickName || row.uploadedBy?.userName || '-'
        },
        {
          prop: 'createTime',
          label: '上传时间',
          width: 180,
          sortable: true
        },
        {
          prop: 'operation',
          label: '操作',
          width: 90,
          fixed: 'right',
          formatter: (row: AttachmentItem) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  {
                    key: 'download',
                    label: '下载',
                    icon: 'ri:download-line'
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c'
                  }
                ],
                onClick: (item: ButtonMoreItem) => buttonMoreClick(item, row)
              })
            ])
        }
      ]
    }
  });

  function formatSize(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  const handleSearch = (params: Record<string, any>) => {
    Object.assign(searchParams, params);
    getData();
  };

  async function handleUpload(opt: UploadRequestOptions) {
    try {
      await upload(opt.file as File);
      ElMessage.success('上传并合并成功');
      refreshData();
    } catch {
      if (errorMessage.value) ElMessage.error(errorMessage.value);
    }
  }

  const buttonMoreClick = (item: ButtonMoreItem, row: AttachmentItem) => {
    switch (item.key) {
      case 'download':
        handleDownload(row);
        break;
      case 'delete':
        deleteAttachment(row);
        break;
    }
  };

  async function handleDownload(row: AttachmentItem) {
    try {
      const { blob, name } = await downloadAttachmentBlob(row.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      ElMessage.error('下载失败');
    }
  }

  async function deleteAttachment(row: AttachmentItem) {
    try {
      await ElMessageBox.confirm(`确定删除「${row.originalName}」？`, '提示', { type: 'warning' });
      await fetchAttachmentDelete(row.id);
      ElMessage.success('已删除');
      refreshData();
    } catch (e: unknown) {
      if (e !== 'cancel') ElMessage.error((e as Error)?.message ?? '删除失败');
    }
  }
</script>
