<template>
  <ArtDialog v-model="innerVisible" :title="title" :icon="icon" width="560px">
    <div class="dialog-search">
      <el-input
        v-model="searchText"
        placeholder="搜索用户名或昵称..."
        prefix-icon="Search"
        clearable
      />
    </div>
    <div class="user-select-container">
      <el-scrollbar height="340px">
        <div class="user-list">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="user-item"
            :class="{ 'is-selected': selectedIds.includes(user.id) }"
            @click="toggleUser(user.id)"
          >
            <el-checkbox
              :model-value="selectedIds.includes(user.id)"
              @click.stop="toggleUser(user.id)"
            />
            <UserAvatar
              :size="36"
              :src="user.avatar"
              :name="user.nickName || user.userName || '?'"
              :gender="user.userGender || ''"
              fit="cover"
              avatar-class="item-avatar"
            />
            <div class="item-info">
              <div class="item-name">{{ user.nickName || user.userName }}</div>
              <div class="item-sub">账号: {{ user.userName }}</div>
            </div>
            <el-tag size="small" :type="user.status === '1' ? 'success' : 'info'" effect="plain">
              {{ user.status === '1' ? '正常' : '停用' }}
            </el-tag>
          </div>
          <el-empty v-if="filteredUsers.length === 0" description="暂无可选用户" :image-size="60" />
        </div>
      </el-scrollbar>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <span class="selected-text"
          >已选择 <strong>{{ selectedIds.length }}</strong> 人</span
        >
        <div>
          <el-button @click="innerVisible = false">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleConfirm">确认添加</el-button>
        </div>
      </div>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { ElMessage } from 'element-plus';
  import ColorAvatar from '@/components/core/base/ColorAvatar.vue';

  const props = defineProps<{
    modelValue: boolean;
    title: string;
    icon: string;
    /** 可选用户全集（已排除已在部门的管理者/成员） */
    candidates: any[];
    loading?: boolean;
  }>();

  const emit = defineEmits<{
    'update:modelValue': [v: boolean];
    confirm: [ids: number[]];
  }>();

  const innerVisible = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
  });

  const searchText = ref('');
  const selectedIds = ref<number[]>([]);

  watch(
    () => props.modelValue,
    (open) => {
      if (open) {
        searchText.value = '';
        selectedIds.value = [];
      }
    }
  );

  const filteredUsers = computed(() => {
    const kw = searchText.value.toLowerCase();
    return props.candidates.filter(
      (u) =>
        !kw ||
        u.userName.toLowerCase().includes(kw) ||
        (u.nickName || '').toLowerCase().includes(kw)
    );
  });

  function toggleUser(id: number) {
    const index = selectedIds.value.indexOf(id);
    if (index === -1) selectedIds.value.push(id);
    else selectedIds.value.splice(index, 1);
  }

  function handleConfirm() {
    if (!selectedIds.value.length) {
      ElMessage.warning('请至少选择一个用户');
      return;
    }
    emit('confirm', [...selectedIds.value]);
  }
</script>

<style scoped lang="scss">
  $primary-color: var(--el-color-primary);

  .dialog-search {
    margin-bottom: 16px;
  }

  .user-select-container {
    border: 1px solid var(--art-card-border);
    border-radius: 8px;
    padding: 8px;
    background: var(--el-fill-color-blank);

    .user-list {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .user-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: var(--default-box-color);
        border: 1px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--el-color-primary-light-9);
        }

        &.is-selected {
          border-color: var(--el-color-primary-light-5);
          background: var(--el-color-primary-light-9);
        }

        .item-info {
          flex: 1;

          .item-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }

          .item-sub {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            margin-top: 2px;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-top: 4px;

    .selected-text {
      font-size: 13px;
      color: var(--el-text-color-regular);

      strong {
        color: $primary-color;
        font-size: 16px;
      }
    }
  }
</style>
