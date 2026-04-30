<template>
  <ArtDialog
    v-model="innerVisible"
    title="人员详情"
    icon="mdi:account-details"
    width="400px"
    :show-minimize="false"
    :show-maximize="false"
  >
    <div v-if="user" class="profile-card">
      <div class="profile-header">
        <el-avatar :size="72" :src="user.avatar || ''" class="profile-avatar" fit="cover">
          <ColorAvatar
            :name="user.nickName || user.userName || '?'"
            :gender="user.userGender || ''"
            :size="72"
          />
        </el-avatar>
        <div class="profile-name">{{ user.nickName || user.userName }}</div>
        <div class="profile-role">@{{ user.userName }}</div>
      </div>
      <div class="profile-details">
        <div class="detail-item">
          <span class="label"><art-svg-icon icon="mdi:gender-male-female" /> 性别</span>
          <span class="value">{{ user.userGender || '未知' }}</span>
        </div>
        <div class="detail-item">
          <span class="label"><art-svg-icon icon="mdi:cellphone" /> 手机号</span>
          <span class="value">{{ user.userPhone || '未填写' }}</span>
        </div>
        <div class="detail-item">
          <span class="label"><art-svg-icon icon="mdi:email" /> 邮箱</span>
          <span class="value">{{ user.userEmail || '未填写' }}</span>
        </div>
        <div class="detail-item">
          <span class="label"><art-svg-icon icon="mdi:shield-check" /> 状态</span>
          <span class="value">
            <el-tag :type="user.status === '1' ? 'success' : 'danger'" size="small" effect="dark">
              {{ user.status === '1' ? '正常' : '异常' }}
            </el-tag>
          </span>
        </div>
      </div>
    </div>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import ColorAvatar from '@/components/core/base/ColorAvatar.vue';

  const props = defineProps<{
    modelValue: boolean;
    user: any | null;
  }>();

  const emit = defineEmits<{
    'update:modelValue': [v: boolean];
  }>();

  const innerVisible = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
  });
</script>

<style scoped lang="scss">
  .profile-card {
    text-align: center;
    padding: 10px;

    .profile-header {
      margin-bottom: 24px;
      .profile-avatar {
        border: 2px solid var(--art-card-border);
        margin-bottom: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color-light);
      }
      .profile-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      .profile-role {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }

    .profile-details {
      background: var(--art-main-bg-color);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;

        .label {
          color: var(--el-text-color-secondary);
          display: flex;
          align-items: center;
          gap: 6px;

          .art-svg-icon {
            font-size: 16px;
          }
        }
        .value {
          color: var(--el-text-color-primary);
          font-weight: 500;
        }
      }
    }
  }
</style>
